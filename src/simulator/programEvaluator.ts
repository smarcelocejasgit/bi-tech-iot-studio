import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import {
  CameraSimulationState,
  ComparisonOperator,
  ConditionNode,
  GardenActuatorState,
  GardenSensorState,
  NodeMcuActuatorState,
  NodeMcuSensorState,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  SimulatedInputReading,
  StatementNode,
} from '../types/studio';

const SENSOR_HUMAN_NAMES: Record<SensorKey, string> = {
  humedadSuelo: 'El suelo',
  temperatura: 'La temperatura',
  humedadAmbiente: 'La humedad ambiente',
  nivelLuz: 'El nivel de luz',
  entradaAnalogicaA0: 'La entrada analógica A0',
  entradaDigital: 'La entrada digital',
};

const SENSOR_SHORT_LABELS: Record<SensorKey, string> = {
  humedadSuelo: 'humedad del suelo',
  temperatura: 'temperatura',
  humedadAmbiente: 'humedad ambiente',
  nivelLuz: 'nivel de luz',
  entradaAnalogicaA0: 'entrada analógica A0',
  entradaDigital: 'entrada digital',
};

function compareValues(
  left: number,
  op: ComparisonOperator,
  right: number
): boolean {
  switch (op) {
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
  }
}

function readSensorFromMap(
  sensorKey: SensorKey,
  values: Record<SensorKey, number>
): number {
  return values[sensorKey] ?? 0;
}

function simulatedInputReading(
  sensor: SensorKey,
  pin: string | undefined,
  values: Record<SensorKey, number>
): SimulatedInputReading | null {
  if (sensor === 'entradaAnalogicaA0') {
    return {
      type: 'analog',
      pin: pin ?? 'pin analógico',
      value: readSensorFromMap(sensor, values),
    };
  }
  if (sensor === 'entradaDigital') {
    return {
      type: 'digital',
      pin: pin ?? 'pin digital',
      value: readSensorFromMap(sensor, values),
    };
  }
  return null;
}

function collectReadingsFromExpression(
  expression: NumericExpressionNode | undefined,
  values: Record<SensorKey, number>,
  target: Map<string, SimulatedInputReading>
): void {
  if (!expression) return;
  if (expression.kind === 'sensor_read') {
    const reading = simulatedInputReading(
      expression.sensor,
      expression.pin,
      values
    );
    if (reading) target.set(`${reading.type}:${reading.pin}`, reading);
  } else if (expression.kind === 'math_op') {
    collectReadingsFromExpression(expression.left, values, target);
  }
}

function collectReadingsFromCondition(
  condition: ConditionNode | null,
  values: Record<SensorKey, number>,
  target: Map<string, SimulatedInputReading>
): void {
  if (!condition) return;
  if (condition.kind === 'comparison') {
    collectReadingsFromExpression(condition.leftExpr, values, target);
    if (condition.leftSensor) {
      const reading = simulatedInputReading(
        condition.leftSensor,
        condition.leftPin,
        values
      );
      if (reading) target.set(`${reading.type}:${reading.pin}`, reading);
    }
  } else if (condition.kind === 'logical') {
    collectReadingsFromCondition(condition.left, values, target);
    collectReadingsFromCondition(condition.right, values, target);
  }
}

function collectProgramInputReadings(
  program: ParsedProgram,
  values: Record<SensorKey, number>
): SimulatedInputReading[] {
  const target = new Map<string, SimulatedInputReading>();
  const visit = (statements: StatementNode[]) => {
    for (const statement of statements) {
      if (statement.kind === 'data_log' || statement.kind === 'iot_publish') {
        const reading = simulatedInputReading(
          statement.sensor,
          statement.pin,
          values
        );
        if (reading) target.set(`${reading.type}:${reading.pin}`, reading);
      } else if (statement.kind === 'if') {
        collectReadingsFromCondition(statement.condition, values, target);
        visit(statement.thenBranch);
        visit(statement.elseBranch ?? []);
      }
    }
  };
  visit(program.setupStatements);
  visit(program.loopStatements);
  return Array.from(target.values());
}

function evalNumericExpr(
  expr: NumericExpressionNode | undefined,
  values: Record<SensorKey, number>
): number {
  if (!expr) return 0;
  if (expr.kind === 'number_literal') return expr.value;
  if (expr.kind === 'sensor_read') return readSensorFromMap(expr.sensor, values);
  if (expr.kind === 'math_op') {
    const l = evalNumericExpr(expr.left, values);
    const r = expr.rightNumber;
    switch (expr.operator) {
      case '+':
        return l + r;
      case '-':
        return l - r;
      case '*':
        return l * r;
      case '/':
        return r !== 0 ? l / r : 0;
    }
  }
  return 0;
}

function describeConditionWithMap(
  cond: ConditionNode | null,
  values: Record<SensorKey, number>
): string {
  if (!cond) return 'condición vacía';
  if (cond.kind === 'comparison') {
    const sensorKey = cond.leftSensor ?? 'humedadSuelo';
    const currentVal = readSensorFromMap(sensorKey, values);
    const opText =
      cond.operator === '<'
        ? `está por debajo de ${cond.rightNumber}`
        : cond.operator === '>'
        ? `supera ${cond.rightNumber}`
        : `${cond.operator} ${cond.rightNumber}`;
    return `${SENSOR_HUMAN_NAMES[sensorKey]} (${currentVal}) ${opText}`;
  }
  if (cond.kind === 'logical') {
    const joiner = cond.operator === 'AND' ? 'y' : 'o';
    return `${describeConditionWithMap(
      cond.left,
      values
    )} ${joiner} ${describeConditionWithMap(cond.right, values)}`;
  }
  return 'estado de cámara';
}

export function evaluateConditionWithMap(
  cond: ConditionNode | null,
  values: Record<SensorKey, number>
): boolean {
  if (!cond) return false;
  if (cond.kind === 'comparison') {
    const leftVal = cond.leftExpr
      ? evalNumericExpr(cond.leftExpr, values)
      : cond.leftSensor
      ? readSensorFromMap(cond.leftSensor, values)
      : (cond.leftNumber ?? 0);
    return compareValues(leftVal, cond.operator, cond.rightNumber);
  }
  if (cond.kind === 'logical') {
    const l = evaluateConditionWithMap(cond.left, values);
    const r = evaluateConditionWithMap(cond.right, values);
    return cond.operator === 'AND' ? l && r : l || r;
  }
  return true;
}

export function evaluateCondition(
  cond: ConditionNode | null,
  sensors: GardenSensorState
): boolean {
  return evaluateConditionWithMap(cond, {
    ...sensors,
    entradaAnalogicaA0: sensors.humedadSuelo,
    entradaDigital: 0,
  });
}

interface BranchExecutionContext {
  bomba: boolean;
  relay: boolean;
  iluminacion: boolean;
  salidaDigital: boolean;
  bitechChannel: number | null;
  lastDelaySeconds: number | null;
  explanations: string[];
  triggeredConditions: string[];
}

function runSystemBranch(
  stmts: StatementNode[],
  values: Record<SensorKey, number>,
  ctx: BranchExecutionContext,
  activeConditionDescription?: string
): void {
  let seenWaitInBranch = false;
  let pumpTurnedOnBeforeWait = false;
  let relayTurnedOnBeforeWait = false;
  let lightTurnedOnBeforeWait = false;
  let digitalOutTurnedOnBeforeWait = false;

  for (const st of stmts) {
    switch (st.kind) {
      case 'bomba_on':
        ctx.bomba = true;
        if (!seenWaitInBranch) {
          pumpTurnedOnBeforeWait = true;
        }
        if (activeConditionDescription) {
          ctx.explanations.push(
            `${activeConditionDescription}: el programa activa la bomba.`
          );
        } else {
          ctx.explanations.push('El programa activa la bomba de agua.');
        }
        break;

      case 'bomba_off':
        if (pumpTurnedOnBeforeWait && seenWaitInBranch) {
          ctx.bomba = true;
        } else {
          ctx.bomba = false;
          if (activeConditionDescription) {
            ctx.explanations.push(
              `${activeConditionDescription}: el programa apaga la bomba.`
            );
          }
        }
        break;

      case 'relay_on':
        ctx.relay = true;
        if (!seenWaitInBranch) {
          relayTurnedOnBeforeWait = true;
        }
        if (activeConditionDescription) {
          ctx.explanations.push(
            `${activeConditionDescription}: el programa activa el relay.`
          );
        } else {
          ctx.explanations.push('El programa enciende el módulo relay.');
        }
        break;

      case 'relay_off':
        if (relayTurnedOnBeforeWait && seenWaitInBranch) {
          ctx.relay = true;
        } else {
          ctx.relay = false;
          if (activeConditionDescription) {
            ctx.explanations.push(
              `${activeConditionDescription}: el programa apaga el relay.`
            );
          }
        }
        break;

      case 'luz_on':
        ctx.iluminacion = true;
        if (!seenWaitInBranch) {
          lightTurnedOnBeforeWait = true;
        }
        if (activeConditionDescription) {
          ctx.explanations.push(
            `${activeConditionDescription}: el programa enciende la iluminación.`
          );
        } else {
          ctx.explanations.push('El programa enciende la iluminación LED.');
        }
        break;

      case 'luz_off':
        if (lightTurnedOnBeforeWait && seenWaitInBranch) {
          ctx.iluminacion = true;
        } else {
          ctx.iluminacion = false;
          if (activeConditionDescription) {
            ctx.explanations.push(
              `${activeConditionDescription}: el programa apaga la iluminación.`
            );
          }
        }
        break;

      case 'digital_out_on':
        ctx.salidaDigital = true;
        if (!seenWaitInBranch) {
          digitalOutTurnedOnBeforeWait = true;
        }
        if (activeConditionDescription) {
          ctx.explanations.push(
            `${activeConditionDescription}: salida digital en HIGH.`
          );
        } else {
          ctx.explanations.push('El programa activa la salida digital (HIGH).');
        }
        break;

      case 'digital_out_off':
        if (digitalOutTurnedOnBeforeWait && seenWaitInBranch) {
          ctx.salidaDigital = true;
        } else {
          ctx.salidaDigital = false;
        }
        break;

      case 'wait':
        seenWaitInBranch = true;
        ctx.lastDelaySeconds = st.seconds;
        break;

      case 'iot_connect_channel':
        ctx.bitechChannel = st.channel;
        ctx.explanations.push(
          `El dispositivo queda asociado al canal ${st.channel} de Smart Garden Lab para identificar sus datos.`
        );
        break;

      case 'if': {
        const isTrue = evaluateConditionWithMap(st.condition, values);
        if (isTrue) {
          const condDesc = describeConditionWithMap(st.condition, values);
          ctx.triggeredConditions.push(condDesc);

          let friendlyPrefix = condDesc;
          if (
            st.condition?.kind === 'comparison' &&
            st.condition.leftSensor === 'humedadSuelo' &&
            st.condition.operator === '<'
          ) {
            friendlyPrefix = `El suelo está por debajo de ${st.condition.rightNumber}`;
          } else if (
            st.condition?.kind === 'comparison' &&
            st.condition.leftSensor
          ) {
            const sKey = st.condition.leftSensor;
            if (st.condition.operator === '<') {
              friendlyPrefix = `${SENSOR_HUMAN_NAMES[sKey]} está por debajo de ${st.condition.rightNumber}`;
            } else if (st.condition.operator === '>') {
              friendlyPrefix = `${SENSOR_HUMAN_NAMES[sKey]} supera ${st.condition.rightNumber}`;
            } else if (st.condition.operator === '==') {
              friendlyPrefix = `${SENSOR_HUMAN_NAMES[sKey]} es igual a ${st.condition.rightNumber}`;
            }
          }

          runSystemBranch(st.thenBranch, values, ctx, friendlyPrefix);
        } else if (st.elseBranch && st.elseBranch.length > 0) {
          runSystemBranch(
            st.elseBranch,
            values,
            ctx,
            'La condición no se cumple (rama "si no")'
          );
        } else if (
          st.condition?.kind === 'comparison' &&
          st.condition.leftSensor
        ) {
          const sKey = st.condition.leftSensor;
          ctx.explanations.push(
            `Lectura de ${SENSOR_SHORT_LABELS[sKey]} (${readSensorFromMap(
              sKey,
              values
            )}) no cumple ${st.condition.operator} ${
              st.condition.rightNumber
            }: actuadores en reposo (OFF).`
          );
        }
        break;
      }

      default:
        break;
    }
  }
}

/**
 * Evalúa el programa de bloques del estudiante para el perfil Garden Node Bi-Tech (ESP32).
 */
export function evaluateGardenProgram(
  program: ParsedProgram,
  sensors: GardenSensorState
): GardenActuatorState {
  const ctx: BranchExecutionContext = {
    bomba: false,
    relay: false,
    iluminacion: false,
    salidaDigital: false,
    bitechChannel: null,
    lastDelaySeconds: null,
    explanations: [],
    triggeredConditions: [],
  };

  const sensorMap: Record<SensorKey, number> = {
    ...sensors,
    entradaAnalogicaA0: sensors.humedadSuelo,
    entradaDigital: 0,
  };

  runSystemBranch(program.setupStatements, sensorMap, ctx);
  runSystemBranch(program.loopStatements, sensorMap, ctx);

  const primaryExplanation =
    ctx.explanations.length > 0
      ? ctx.explanations[0]
      : 'Sistema en estado seguro: bomba e iluminación en OFF. Ajusta los sensores o agrega condiciones.';

  return {
    bomba: ctx.bomba,
    iluminacion: ctx.iluminacion,
    bitechChannel: ctx.bitechChannel,
    lastDelaySeconds: ctx.lastDelaySeconds,
    explanation: primaryExplanation,
    triggeredConditions: ctx.triggeredConditions,
    inputReadings: collectProgramInputReadings(program, sensorMap),
  };
}

/**
 * Evalúa el programa de bloques del estudiante para el perfil NodeMCU — ESP8266.
 * Interpreta las lecturas de DHT11, la única entrada analógica A0 y la entrada digital,
 * actualizando el estado de Relay, Iluminación y Salida Digital.
 */
export function evaluateNodeMcuProgram(
  program: ParsedProgram,
  sensors: NodeMcuSensorState
): NodeMcuActuatorState {
  const ctx: BranchExecutionContext = {
    bomba: false,
    relay: false,
    iluminacion: false,
    salidaDigital: false,
    bitechChannel: null,
    lastDelaySeconds: null,
    explanations: [],
    triggeredConditions: [],
  };

  // En NodeMCU el único canal ADC físico es A0
  const sensorMap: Record<SensorKey, number> = {
    temperatura: sensors.temperatura,
    humedadAmbiente: sensors.humedadAmbiente,
    entradaAnalogicaA0: sensors.entradaAnalogicaA0,
    humedadSuelo: sensors.entradaAnalogicaA0,
    nivelLuz: sensors.entradaAnalogicaA0,
    entradaDigital: sensors.entradaDigital,
  };

  runSystemBranch(program.setupStatements, sensorMap, ctx);
  runSystemBranch(program.loopStatements, sensorMap, ctx);

  const activeSummaries = ctx.explanations.filter(
    (msg) => !msg.includes('en reposo (OFF)')
  );

  const primaryExplanation =
    activeSummaries.length > 0
      ? activeSummaries.join(' · ')
      : ctx.explanations[0] ??
        'NodeMCU en estado seguro: Relay OFF, Iluminación OFF, Salida Digital LOW.';

  return {
    relay: ctx.relay || ctx.bomba,
    iluminacion: ctx.iluminacion,
    salidaDigital: ctx.salidaDigital,
    bitechChannel: ctx.bitechChannel,
    lastDelaySeconds: ctx.lastDelaySeconds,
    explanation: primaryExplanation,
    triggeredConditions: ctx.triggeredConditions,
    inputReadings: collectProgramInputReadings(program, sensorMap),
  };
}

/**
 * Evalúa el programa de bloques del estudiante para el perfil Camera Node Bi-Tech.
 */
export function evaluateCameraProgram(
  program: ParsedProgram,
  extraManualCaptures = 0,
  manualTimestamp: string | null = null
): CameraSimulationState {
  const state: CameraSimulationState = {
    configurada: false,
    activa: false,
    resolucion: CAMERA_NODE_CONFIG.defaultResolution,
    calidad: CAMERA_NODE_CONFIG.defaultQuality,
    wifiConectado: false,
    wifiSsid: null,
    streaming: false,
    capturas: 0,
    ultimaCaptura: null,
    explanation:
      'Camera Node en espera. Agrega bloques de cámara para inicializar el sistema.',
  };

  const allStatements = [...program.setupStatements, ...program.loopStatements];

  function processStatements(stmts: StatementNode[]): void {
    for (const st of stmts) {
      switch (st.kind) {
        case 'cam_config':
          state.configurada = true;
          break;
        case 'cam_resolution':
          state.resolucion = st.resolution;
          break;
        case 'cam_quality':
          state.calidad = st.quality;
          break;
        case 'cam_init':
          state.activa = true;
          break;
        case 'cam_wifi':
          state.wifiConectado = true;
          state.wifiSsid = st.ssid;
          break;
        case 'cam_stream_start':
          if (state.activa) {
            state.streaming = true;
          }
          break;
        case 'cam_stream_stop':
          state.streaming = false;
          break;
        case 'cam_capture':
          if (state.activa) {
            state.capturas += 1;
            state.ultimaCaptura = manualTimestamp ?? '14:32:15';
          }
          break;
        case 'if':
          processStatements(st.thenBranch);
          break;
        default:
          break;
      }
    }
  }

  processStatements(allStatements);

  if (state.activa && extraManualCaptures > 0) {
    state.capturas += extraManualCaptures;
    if (manualTimestamp) {
      state.ultimaCaptura = manualTimestamp;
    }
  }

  if (state.activa && state.streaming) {
    state.explanation = `Cámara ACTIVA (${state.resolucion}, calidad ${state.calidad}) transmitiendo streaming simulado vía Wi-Fi.`;
  } else if (state.activa) {
    state.explanation = `Cámara ACTIVA (${state.resolucion}, calidad ${state.calidad}). Streaming en OFF.`;
  } else if (state.configurada) {
    state.explanation =
      'Cámara configurada pero inactiva: agrega el bloque "iniciar cámara".';
  }

  return state;
}
