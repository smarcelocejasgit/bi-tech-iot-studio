import { HardwareValidationIssue } from '../types/hardware';
import {
  ConditionNode,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';
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

function hasCameraStatements(stmts: StatementNode[]): boolean {
  for (const st of stmts) {
    if (st.kind.startsWith('cam_')) return true;
    if (st.kind === 'if') {
      if (hasCameraStatements(st.thenBranch)) return true;
      if (st.elseBranch && hasCameraStatements(st.elseBranch)) return true;
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

  return issues;
}
