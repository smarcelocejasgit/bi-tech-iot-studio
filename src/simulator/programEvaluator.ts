import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import {
  CameraSimulationState,
  ComparisonOperator,
  ConditionNode,
  GardenActuatorState,
  GardenSensorState,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';

const SENSOR_HUMAN_NAMES: Record<SensorKey, string> = {
  humedadSuelo: 'El suelo',
  temperatura: 'La temperatura',
  humedadAmbiente: 'La humedad ambiente',
  nivelLuz: 'El nivel de luz',
};

const SENSOR_SHORT_LABELS: Record<SensorKey, string> = {
  humedadSuelo: 'humedad del suelo',
  temperatura: 'temperatura',
  humedadAmbiente: 'humedad ambiente',
  nivelLuz: 'nivel de luz',
};

function compareValues(left: number, op: ComparisonOperator, right: number): boolean {
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

function describeCondition(cond: ConditionNode | null, sensors: GardenSensorState): string {
  if (!cond) return 'condición vacía';
  if (cond.kind === 'comparison') {
    const sensorKey = cond.leftSensor ?? 'humedadSuelo';
    const currentVal = sensors[sensorKey];
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
    return `${describeCondition(cond.left, sensors)} ${joiner} ${describeCondition(
      cond.right,
      sensors
    )}`;
  }
  return 'estado de cámara';
}

export function evaluateCondition(
  cond: ConditionNode | null,
  sensors: GardenSensorState
): boolean {
  if (!cond) return false;
  if (cond.kind === 'comparison') {
    const leftVal = cond.leftSensor
      ? sensors[cond.leftSensor]
      : (cond.leftNumber ?? 0);
    return compareValues(leftVal, cond.operator, cond.rightNumber);
  }
  if (cond.kind === 'logical') {
    const l = evaluateCondition(cond.left, sensors);
    const r = evaluateCondition(cond.right, sensors);
    return cond.operator === 'AND' ? l && r : l || r;
  }
  return true;
}

interface BranchExecutionContext {
  bomba: boolean;
  iluminacion: boolean;
  lastDelaySeconds: number | null;
  explanations: string[];
  triggeredConditions: string[];
}

function runGardenBranch(
  stmts: StatementNode[],
  sensors: GardenSensorState,
  ctx: BranchExecutionContext,
  activeConditionDescription?: string
): void {
  let seenWaitInBranch = false;
  let pumpTurnedOnBeforeWait = false;
  let lightTurnedOnBeforeWait = false;

  for (const st of stmts) {
    switch (st.kind) {
      case 'bomba_on':
        ctx.bomba = true;
        if (!seenWaitInBranch) {
          pumpTurnedOnBeforeWait = true;
        }
        if (activeConditionDescription) {
          ctx.explanations.push(`${activeConditionDescription}: el programa activa la bomba.`);
        } else {
          ctx.explanations.push('El programa activa la bomba de agua.');
        }
        break;

      case 'bomba_off':
        // Si en la misma rama se encendió la bomba, luego hubo un esperar (delay) y luego apagar bomba,
        // representa un pulso de riego activo mientras la condición se cumple.
        if (pumpTurnedOnBeforeWait && seenWaitInBranch) {
          ctx.bomba = true;
        } else {
          ctx.bomba = false;
          if (activeConditionDescription) {
            ctx.explanations.push(`${activeConditionDescription}: el programa apaga la bomba.`);
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

      case 'wait':
        seenWaitInBranch = true;
        ctx.lastDelaySeconds = st.seconds;
        break;

      case 'if': {
        const isTrue = evaluateCondition(st.condition, sensors);
        if (isTrue) {
          const condDesc = describeCondition(st.condition, sensors);
          ctx.triggeredConditions.push(condDesc);

          // Caso exacto de la referencia visual para mensaje didáctico claro
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
            }
          }

          runGardenBranch(st.thenBranch, sensors, ctx, friendlyPrefix);
        } else if (st.elseBranch && st.elseBranch.length > 0) {
          runGardenBranch(
            st.elseBranch,
            sensors,
            ctx,
            'La condición no se cumple (rama "si no")'
          );
        } else if (st.condition?.kind === 'comparison' && st.condition.leftSensor) {
          const sKey = st.condition.leftSensor;
          ctx.explanations.push(
            `Lectura de ${SENSOR_SHORT_LABELS[sKey]} (${sensors[sKey]}) no cumple ${st.condition.operator} ${st.condition.rightNumber}: actuadores en reposo (OFF).`
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
 * Evalúa el programa de bloques del estudiante para el perfil Garden Node Bi-Tech
 * frente a los valores actuales de los sensores del simulador.
 * Estado inicial seguro: Bomba OFF, Iluminación OFF.
 */
export function evaluateGardenProgram(
  program: ParsedProgram,
  sensors: GardenSensorState
): GardenActuatorState {
  const ctx: BranchExecutionContext = {
    bomba: false, // Estado seguro inicial OFF (Sección 12)
    iluminacion: false, // Estado seguro inicial OFF (Sección 12)
    lastDelaySeconds: null,
    explanations: [],
    triggeredConditions: [],
  };

  runGardenBranch(program.setupStatements, sensors, ctx);
  runGardenBranch(program.loopStatements, sensors, ctx);

  const primaryExplanation =
    ctx.explanations.length > 0
      ? ctx.explanations[0]
      : 'Sistema en estado seguro: bomba e iluminación en OFF. Ajusta los sensores o agrega condiciones.';

  return {
    bomba: ctx.bomba,
    iluminacion: ctx.iluminacion,
    lastDelaySeconds: ctx.lastDelaySeconds,
    explanation: primaryExplanation,
    triggeredConditions: ctx.triggeredConditions,
  };
}

/**
 * Evalúa el programa de bloques del estudiante para el perfil Camera Node Bi-Tech.
 * Representa el comportamiento de la ESP32-CAM sin asumir streaming por USB.
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
    streaming: false,
    capturas: 0,
    ultimaCaptura: null,
    explanation: 'Camera Node en espera. Agrega bloques de cámara para inicializar el sistema.',
  };

  const allStatements = [...program.setupStatements, ...program.loopStatements];
  const actionsDone: string[] = [];

  function processStatements(stmts: StatementNode[]): void {
    for (const st of stmts) {
      switch (st.kind) {
        case 'cam_config':
          state.configurada = true;
          actionsDone.push('cámara configurada');
          break;
        case 'cam_resolution':
          state.resolucion = st.resolution;
          break;
        case 'cam_quality':
          state.calidad = st.quality;
          break;
        case 'cam_init':
          state.activa = true;
          actionsDone.push('cámara activa');
          break;
        case 'cam_wifi':
          state.wifiConectado = true;
          actionsDone.push(`Wi-Fi conectado (${st.ssid})`);
          break;
        case 'cam_stream_start':
          if (state.activa) {
            state.streaming = true;
            actionsDone.push('streaming Wi-Fi ON');
          } else {
            actionsDone.push('aviso: iniciar cámara antes del streaming');
          }
          break;
        case 'cam_stream_stop':
          state.streaming = false;
          actionsDone.push('streaming detenido (OFF)');
          break;
        case 'cam_capture':
          if (state.activa) {
            state.capturas += 1;
            state.ultimaCaptura = manualTimestamp ?? '14:32:15';
            actionsDone.push('captura tomada');
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
    state.explanation = 'Cámara configurada pero inactiva: agrega el bloque "iniciar cámara".';
  }

  return state;
}
