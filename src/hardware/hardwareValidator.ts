import { HardwareValidationIssue } from '../types/hardware';
import {
  ConditionNode,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';
import {
  evaluatePinSelection,
  getSelectedPinId,
  getSignalRequirement,
} from './pinModel';
import {
  getDeviceProfile,
  isAnalogSensorKey,
} from './hardwareCapabilities';

const SENSOR_LABELS: Record<SensorKey, string> = {
  temperatura: 'Temperatura (DHT11)',
  humedadAmbiente: 'Humedad ambiente (DHT11)',
  humedadSuelo: 'Humedad del suelo (Analógico)',
  nivelLuz: 'Nivel de luz LDR (Analógico)',
  entradaAnalogicaA0: 'Entrada analógica A0',
  entradaDigital: 'Entrada digital',
};

function collectSensorsFromNumericExpr(
  expr: NumericExpressionNode | undefined,
  acc: Set<SensorKey>
): void {
  if (!expr) return;
  if (expr.kind === 'sensor_read') {
    acc.add(expr.sensor);
  } else if (expr.kind === 'math_op') {
    collectSensorsFromNumericExpr(expr.left, acc);
  }
}

function collectSensorsFromCondition(
  cond: ConditionNode | null,
  acc: Set<SensorKey>
): void {
  if (!cond) return;
  if (cond.kind === 'comparison') {
    if (cond.leftSensor) acc.add(cond.leftSensor);
    if (cond.rightSensor) acc.add(cond.rightSensor);
    collectSensorsFromNumericExpr(cond.leftExpr, acc);
  } else if (cond.kind === 'logical') {
    collectSensorsFromCondition(cond.left, acc);
    collectSensorsFromCondition(cond.right, acc);
  }
}

export function collectAllSensorsInStatements(
  stmts: StatementNode[],
  acc: Set<SensorKey>
): void {
  for (const st of stmts) {
    if (st.kind === 'if') {
      collectSensorsFromCondition(st.condition, acc);
      collectAllSensorsInStatements(st.thenBranch, acc);
      if (st.elseBranch) {
        collectAllSensorsInStatements(st.elseBranch, acc);
      }
    } else if (st.kind === 'data_log' || st.kind === 'iot_publish') {
      acc.add(st.sensor);
    }
  }
}

interface PinUsage {
  sensor: SensorKey;
  pinId?: string;
  blockId?: string;
}

function collectPinUsagesFromExpression(
  expression: NumericExpressionNode | undefined,
  usages: PinUsage[]
): void {
  if (!expression) return;
  if (expression.kind === 'sensor_read') {
    usages.push({
      sensor: expression.sensor,
      pinId: getSelectedPinId(
        expression.sensor,
        expression.bindings,
        expression.pin
      ),
      blockId: expression.blockId,
    });
  } else if (expression.kind === 'math_op') {
    collectPinUsagesFromExpression(expression.left, usages);
  }
}

function collectPinUsagesFromCondition(
  condition: ConditionNode | null,
  usages: PinUsage[]
): void {
  if (!condition) return;
  if (condition.kind === 'comparison') {
    if (condition.leftExpr) {
      collectPinUsagesFromExpression(condition.leftExpr, usages);
    } else if (condition.leftSensor) {
      usages.push({
        sensor: condition.leftSensor,
        pinId: getSelectedPinId(
          condition.leftSensor,
          condition.leftBindings,
          condition.leftPin
        ),
        blockId: condition.blockId,
      });
    }
  } else if (condition.kind === 'logical') {
    collectPinUsagesFromCondition(condition.left, usages);
    collectPinUsagesFromCondition(condition.right, usages);
  }
}

function collectPinUsages(
  statements: StatementNode[],
  usages: PinUsage[]
): void {
  for (const statement of statements) {
    if (statement.kind === 'data_log' || statement.kind === 'iot_publish') {
      usages.push({
        sensor: statement.sensor,
        pinId: getSelectedPinId(
          statement.sensor,
          statement.bindings,
          statement.pin
        ),
        blockId: statement.blockId,
      });
    } else if (statement.kind === 'if') {
      collectPinUsagesFromCondition(statement.condition, usages);
      collectPinUsages(statement.thenBranch, usages);
      collectPinUsages(statement.elseBranch ?? [], usages);
    }
  }
}

function sensorResource(sensor: SensorKey): string {
  return sensor === 'temperatura' || sensor === 'humedadAmbiente'
    ? 'dht11'
    : sensor;
}

export function getSelectedBlockPinFeedback(
  program: ParsedProgram,
  blockId?: string
): string[] {
  if (!blockId) return [];
  const usages: PinUsage[] = [];
  usages.push(...(program.pinSelections ?? []));
  collectPinUsages(program.setupStatements, usages);
  collectPinUsages(program.loopStatements, usages);
  const usage = usages.find((item) => item.blockId === blockId);
  if (!usage) return [];
  return evaluatePinSelection(
    program.device,
    getSignalRequirement(usage.sensor),
    usage.pinId,
    usage.sensor
  ).feedback.map((feedback) => {
    const prefix =
      feedback.severity === 'success'
        ? '✓'
        : feedback.severity === 'warning'
          ? '⚠'
          : '✕';
    return `${prefix} ${feedback.message}`;
  });
}

const CAMERA_ONLY_STATEMENT_KINDS = new Set<StatementNode['kind']>([
  'cam_config',
  'cam_resolution',
  'cam_quality',
  'cam_init',
  'cam_stream_start',
  'cam_stream_stop',
  'cam_capture',
]);

const WIFI_STATEMENT_KINDS = new Set<StatementNode['kind']>([
  'cam_wifi',
  'iot_connect_channel',
  'iot_publish',
]);

function hasCameraCondition(cond: ConditionNode | null): boolean {
  if (!cond) return false;
  if (cond.kind === 'camera_state_check') return true;
  if (cond.kind === 'logical') {
    return hasCameraCondition(cond.left) || hasCameraCondition(cond.right);
  }
  return false;
}

function hasCameraStatements(stmts: StatementNode[]): boolean {
  for (const st of stmts) {
    if (CAMERA_ONLY_STATEMENT_KINDS.has(st.kind)) return true;
    if (st.kind === 'if') {
      if (hasCameraCondition(st.condition)) return true;
      if (hasCameraStatements(st.thenBranch)) return true;
      if (st.elseBranch && hasCameraStatements(st.elseBranch)) return true;
    }
  }
  return false;
}

function hasWifiStatements(stmts: StatementNode[]): boolean {
  for (const st of stmts) {
    if (WIFI_STATEMENT_KINDS.has(st.kind)) return true;
    if (st.kind === 'if') {
      if (hasWifiStatements(st.thenBranch)) return true;
      if (st.elseBranch && hasWifiStatements(st.elseBranch)) return true;
    }
  }
  return false;
}

/**
 * Valida que el programa construido por el estudiante respete las capacidades
 * físicas declaradas por el perfil de hardware seleccionado.
 * No utiliza condicionales por nombre de placa, sino las propiedades de `capabilities`.
 */
export function validateProgramAgainstCapabilities(
  program: ParsedProgram
): HardwareValidationIssue[] {
  const profile = getDeviceProfile(program.device);
  const { capabilities } = profile;
  const issues: HardwareValidationIssue[] = [];

  const usedSensors = new Set<SensorKey>(program.usedSensors ?? []);
  collectAllSensorsInStatements(program.setupStatements, usedSensors);
  collectAllSensorsInStatements(program.loopStatements, usedSensors);

  const analogSensorsUsed = Array.from(usedSensors).filter((s) =>
    isAnalogSensorKey(s)
  );

  if (analogSensorsUsed.length > capabilities.analogInputs) {
    const affectedNames = analogSensorsUsed.map((s) => SENSOR_LABELS[s]);
    issues.push({
      code: 'ANALOG_INPUTS_EXCEEDED',
      severity: 'warning',
      title: 'Restricción física de entradas analógicas superada',
      message:
        `Este proyecto requiere más entradas analógicas (${analogSensorsUsed.length}) que las disponibles en el dispositivo seleccionado (${profile.shortBadge}: ${capabilities.analogInputs} disponible).`,
      pedagogicalExplanation:
        `${profile.shortBadge} dispone de ${capabilities.analogInputs} entrada(s) analógica(s). Estás intentando leer simultáneamente: ${affectedNames.join(' + ')}. En programación física, el algoritmo debe adaptarse a los recursos reales del hardware o seleccionar un microcontrolador con más canales ADC (como ESP32).`,
      affectedSensorsOrBlocks: affectedNames,
    });
  }

  const pinUsages: PinUsage[] = [];
  pinUsages.push(...(program.pinSelections ?? []));
  collectPinUsages(program.setupStatements, pinUsages);
  collectPinUsages(program.loopStatements, pinUsages);
  const uniquePinUsages = pinUsages.filter(
    (usage, index) =>
      pinUsages.findIndex(
        (candidate) =>
          candidate.blockId === usage.blockId &&
          candidate.sensor === usage.sensor &&
          candidate.pinId === usage.pinId
      ) === index
  );

  for (const usage of uniquePinUsages) {
    const evaluation = evaluatePinSelection(
      program.device,
      getSignalRequirement(usage.sensor),
      usage.pinId,
      usage.sensor
    );
    if (evaluation.valid) continue;
    const feedback = evaluation.feedback[0];
    const code =
      feedback.code === 'PIN_RESERVED'
        ? 'PIN_RESERVED'
        : feedback.code === 'PIN_SELECTION_REQUIRED'
          ? 'PIN_SELECTION_REQUIRED'
          : 'PIN_CAPABILITY_MISMATCH';
    issues.push({
      code,
      severity: 'error',
      title:
        code === 'PIN_SELECTION_REQUIRED'
          ? 'Falta elegir un GPIO'
          : 'GPIO incompatible con la señal',
      message: feedback.message,
      pedagogicalExplanation: `El componente ${SENSOR_LABELS[usage.sensor]} requiere ${getSignalRequirement(
        usage.sensor
      ).requiredCapabilities.join(' + ')}. La placa no elegirá el pin por vos.`,
      affectedSensorsOrBlocks: [usage.blockId ?? SENSOR_LABELS[usage.sensor]],
    });
  }

  const usagesByPin = new Map<string, PinUsage[]>();
  for (const usage of uniquePinUsages.filter((item) => item.pinId)) {
    const list = usagesByPin.get(usage.pinId!) ?? [];
    list.push(usage);
    usagesByPin.set(usage.pinId!, list);
  }
  for (const [pinId, usages] of usagesByPin) {
    const resources = new Set(usages.map((usage) => sensorResource(usage.sensor)));
    if (resources.size <= 1) continue;
    issues.push({
      code: 'PIN_CONFLICT',
      severity: 'warning',
      title: 'Posible conflicto de GPIO',
      message: `Dos componentes utilizan ${pinId}: ${usages
        .map((usage) => SENSOR_LABELS[usage.sensor])
        .join(' + ')}.`,
      pedagogicalExplanation:
        'Compartir un GPIO sólo es correcto cuando las señales pertenecen al mismo componente o el circuito/protocolo lo permite. Revisá el diagrama antes de conectar.',
      affectedSensorsOrBlocks: usages.map(
        (usage) => usage.blockId ?? SENSOR_LABELS[usage.sensor]
      ),
    });
  }

  const temperaturePins = new Set(
    uniquePinUsages
      .filter((usage) => usage.sensor === 'temperatura' && usage.pinId)
      .map((usage) => usage.pinId!)
  );
  const humidityPins = new Set(
    uniquePinUsages
      .filter((usage) => usage.sensor === 'humedadAmbiente' && usage.pinId)
      .map((usage) => usage.pinId!)
  );
  if (
    temperaturePins.size > 0 &&
    humidityPins.size > 0 &&
    !Array.from(temperaturePins).some((pin) => humidityPins.has(pin))
  ) {
    issues.push({
      code: 'DHT_DATA_INCONSISTENT',
      severity: 'warning',
      title: 'DATA del DHT11 no coincide',
      message:
        'Temperatura y humedad DHT11 parecen pertenecer al mismo sensor pero usan DATA diferentes.',
      pedagogicalExplanation:
        'Un mismo DHT11 entrega ambas mediciones por una sola línea DATA. Si realmente usás dos módulos DHT11, esta diferencia puede ser intencional.',
      affectedSensorsOrBlocks: ['Temperatura DHT11', 'Humedad DHT11'],
    });
  }

  const allStatements = [...program.setupStatements, ...program.loopStatements];
  if (!capabilities.camera && hasCameraStatements(allStatements)) {
    issues.push({
      code: 'UNSUPPORTED_CAMERA_ON_DEVICE',
      severity: 'warning',
      title: 'Módulo de cámara no disponible en este perfil',
      message: `El dispositivo seleccionado (${profile.shortBadge}) no incluye interfaz de cámara OV2640.`,
      pedagogicalExplanation:
        'Los bloques de cámara requieren el perfil Camera Node Bi-Tech (ESP32-CAM).',
      affectedSensorsOrBlocks: ['Cámara OV2640'],
    });
  }

  if (!capabilities.wifi && hasWifiStatements(allStatements)) {
    issues.push({
      code: 'UNSUPPORTED_WIFI_ON_DEVICE',
      severity: 'warning',
      title: 'Conectividad Wi-Fi no disponible en este perfil',
      message: `El dispositivo seleccionado (${profile.shortBadge}) no incluye conectividad Wi-Fi.`,
      pedagogicalExplanation:
        'Los bloques de conexión Wi-Fi y publicación IoT requieren un dispositivo con interfaz Wi-Fi habilitada.',
      affectedSensorsOrBlocks: ['Wi-Fi / IoT'],
    });
  }

  return issues;
}
