import { DeviceProfileId } from '../types/hardware';
import {
  evaluatePinSelection,
  getSelectedPinId,
  getSignalRequirement,
} from '../hardware/pinModel';
import {
  ConditionNode,
  NumericExpressionNode,
  ParsedProgram,
  PinBinding,
  SensorKey,
  StatementNode,
} from '../types/studio';

export type NarrativeStepKind =
  | 'start'
  | 'configuration'
  | 'repeat'
  | 'read'
  | 'condition'
  | 'branch'
  | 'action'
  | 'communication'
  | 'wait'
  | 'continue';

export interface DidacticNarrativeStep {
  id: string;
  kind: NarrativeStepKind;
  blockLabel: string;
  explanation: string;
  depth: number;
  blockId?: string;
  branch?: 'then' | 'else';
}

export interface DidacticProgramInterpretation {
  device: DeviceProfileId;
  isEmpty: boolean;
  totalStatements: number;
  summarySentence: string;
  narrativeSteps: DidacticNarrativeStep[];
}

interface ConditionSummary {
  subject: string;
  comparisonText: string;
  pedagogicalMeaning: string;
}

interface SensorReference {
  sensor: SensorKey;
  pin?: string;
  bindings?: PinBinding[];
  blockId?: string;
}

interface ProgramFeatures {
  configure: boolean;
  read: boolean;
  compare: boolean;
  decide: boolean;
  act: boolean;
  communicate: boolean;
  wait: boolean;
  repeat: boolean;
}

const EMPTY_MESSAGE =
  'Tu programa todavía no tiene instrucciones. Agregá bloques para comenzar a construir y después vas a poder leer aquí, paso a paso, qué hace tu algoritmo.';

export const WIFI_INTERPRETER_EXPLANATION =
  'Este bloque conecta la placa a la red Wi-Fi indicada para que pueda comunicarse con otros dispositivos o servicios.';

export function formatSensorDisplayName(sensor: SensorKey): string {
  switch (sensor) {
    case 'temperatura':
      return 'temperatura ambiente';
    case 'humedadAmbiente':
      return 'humedad del aire';
    case 'humedadSuelo':
      return 'humedad del suelo';
    case 'nivelLuz':
      return 'nivel de luz ambiental';
    case 'entradaAnalogicaA0':
      return 'entrada analógica';
    case 'entradaDigital':
      return 'entrada digital';
  }
}

export function formatSensorUnit(sensor: SensorKey): string {
  switch (sensor) {
    case 'temperatura':
      return '°C';
    case 'humedadAmbiente':
      return '%';
    case 'humedadSuelo':
    case 'nivelLuz':
    case 'entradaAnalogicaA0':
    case 'entradaDigital':
      return '';
  }
}

export function formatNumericExpression(expr: NumericExpressionNode): string {
  switch (expr.kind) {
    case 'sensor_read': {
      const selectedPin = getSelectedPinId(
        expr.sensor,
        expr.bindings,
        expr.pin
      );
      return `${formatSensorDisplayName(expr.sensor)}${
        selectedPin ? ` conectada a ${selectedPin}` : ''
      }`;
    }
    case 'number_literal':
      return String(expr.value);
    case 'math_op':
      return `${formatNumericExpression(expr.left)} ${expr.operator} ${expr.rightNumber}`;
  }
}

function describePhysicalInput(
  device: DeviceProfileId,
  sensor: SensorKey,
  pin?: string,
  bindings?: PinBinding[]
): string {
  const selectedPin = getSelectedPinId(sensor, bindings, pin);
  if (!selectedPin) {
    return 'Todavía falta elegir un GPIO compatible para este sensor.';
  }
  const requirement = getSignalRequirement(sensor);
  const evaluation = evaluatePinSelection(
    device,
    requirement,
    selectedPin,
    sensor
  );
  if (!evaluation.valid) return evaluation.feedback[0].message;
  if (requirement.signalType === 'digital-protocol') {
    return `El DHT11 utiliza comunicación digital temporizada por una línea de datos. Elegiste ${selectedPin}.`;
  }
  if (requirement.signalType === 'analog') {
    return `El sensor produce una señal analógica. Elegiste ${selectedPin}, que admite lectura ADC.`;
  }
  return `El componente produce una señal digital simple. Elegiste ${selectedPin}, que admite entrada digital.`;
}

function formatOperator(operator: string): string {
  switch (operator) {
    case '<':
      return 'es menor que';
    case '<=':
      return 'es menor o igual que';
    case '>':
      return 'es mayor que';
    case '>=':
      return 'es mayor o igual que';
    case '==':
      return 'es igual a';
    case '!=':
      return 'es diferente de';
    default:
      return operator;
  }
}

export function describeCondition(
  cond: ConditionNode | null,
  device: DeviceProfileId = 'garden-node'
): ConditionSummary {
  if (!cond) {
    return {
      subject: 'condición sin configurar',
      comparisonText: 'la condición todavía no está configurada',
      pedagogicalMeaning:
        'el bloque necesita una condición para poder elegir entre sus caminos',
    };
  }

  if (cond.kind === 'camera_state_check') {
    return {
      subject: 'estado de la cámara',
      comparisonText: 'la cámara está lista y activa',
      pedagogicalMeaning:
        'comprueba el estado de la cámara y obtiene un resultado verdadero o falso',
    };
  }

  if (cond.kind === 'logical') {
    const left = describeCondition(cond.left, device);
    const right = describeCondition(cond.right, device);
    const connector = cond.operator === 'AND' ? 'y además' : 'o bien';
    return {
      subject: `${left.subject} ${cond.operator} ${right.subject}`,
      comparisonText: `${left.comparisonText} ${connector} ${right.comparisonText}`,
      pedagogicalMeaning:
        cond.operator === 'AND'
          ? 'las dos comparaciones deben ser verdaderas al mismo tiempo'
          : 'alcanza con que una de las dos comparaciones sea verdadera',
    };
  }

  const sensor =
    cond.leftSensor ??
    (cond.leftExpr?.kind === 'sensor_read'
      ? cond.leftExpr.sensor
      : undefined);
  const left = cond.leftExpr
    ? formatNumericExpression(cond.leftExpr)
    : sensor
      ? formatSensorDisplayName(sensor)
      : cond.leftNumber !== undefined
        ? String(cond.leftNumber)
        : 'el valor disponible';
  const leftWithPin =
    sensor && getSelectedPinId(sensor, cond.leftBindings, cond.leftPin)
      ? `${formatSensorDisplayName(sensor)} conectada a ${getSelectedPinId(
          sensor,
          cond.leftBindings,
          cond.leftPin
        )}`
      : left;
  const unit = sensor ? formatSensorUnit(sensor) : '';
  const right = unit ? `${cond.rightNumber} ${unit}` : String(cond.rightNumber);
  const comparisonText = `${leftWithPin} ${formatOperator(cond.operator)} ${right}`;

  return {
    subject: leftWithPin,
    comparisonText,
    pedagogicalMeaning: `realiza la comparación “${comparisonText}” y obtiene un resultado verdadero o falso`,
  };
}

export function formatActionsList(statements: StatementNode[]): string {
  if (statements.length === 0) return 'no ejecuta otras instrucciones';

  const actions = statements.map((statement) => {
    switch (statement.kind) {
      case 'bomba_on':
        return 'activa la bomba de riego';
      case 'bomba_off':
        return 'apaga la bomba de riego';
      case 'luz_on':
        return 'enciende la iluminación';
      case 'luz_off':
        return 'apaga la iluminación';
      case 'relay_on':
        return 'activa el relay';
      case 'relay_off':
        return 'desactiva el relay';
      case 'digital_out_on':
        return 'activa la salida digital';
      case 'digital_out_off':
        return 'desactiva la salida digital';
      case 'wait':
        return `espera ${statement.seconds} segundo(s)`;
      case 'cam_capture':
        return 'toma una captura';
      case 'cam_stream_start':
        return 'inicia la transmisión de video';
      case 'cam_stream_stop':
        return 'detiene la transmisión de video';
      case 'data_log':
        return `registra el dato “${statement.label}”`;
      case 'iot_connect_channel':
        return `conecta el dispositivo con el canal ${statement.channel} de Smart Garden Lab`;
      case 'iot_publish':
        return `publica un dato en “${statement.topic}”`;
      case 'cam_config':
        return 'configura la cámara';
      case 'cam_resolution':
        return `define la resolución ${statement.resolution}`;
      case 'cam_quality':
        return `define la calidad ${statement.quality}`;
      case 'cam_init':
        return 'inicia la cámara';
      case 'cam_wifi':
        return WIFI_INTERPRETER_EXPLANATION;
      case 'if':
        return 'evalúa una decisión anidada';
    }
  });

  if (actions.length === 1) return actions[0];
  if (actions.length === 2) return `${actions[0]} y ${actions[1]}`;
  return `${actions.slice(0, -1).join(', ')} y ${actions.at(-1)}`;
}

function deviceDisplayName(device: DeviceProfileId): string {
  switch (device) {
    case 'garden-node':
      return 'Garden Node';
    case 'camera-node':
      return 'Camera Node';
    case 'nodemcu-esp8266':
      return 'NodeMCU';
  }
}

function collectSensorsFromExpression(
  expression: NumericExpressionNode | undefined,
  target: SensorReference[]
): void {
  if (!expression) return;
  if (expression.kind === 'sensor_read') {
    target.push({
      sensor: expression.sensor,
      pin: expression.pin,
      bindings: expression.bindings,
      blockId: expression.blockId,
    });
  } else if (expression.kind === 'math_op') {
    collectSensorsFromExpression(expression.left, target);
  }
}

function collectSensorsFromCondition(
  condition: ConditionNode | null,
  target: SensorReference[]
): void {
  if (!condition) return;
  if (condition.kind === 'comparison') {
    if (condition.leftSensor) {
      target.push({
        sensor: condition.leftSensor,
        pin: condition.leftPin,
        bindings: condition.leftBindings,
        blockId: condition.blockId,
      });
    }
    if (condition.rightSensor) {
      target.push({ sensor: condition.rightSensor, blockId: condition.blockId });
    }
    collectSensorsFromExpression(condition.leftExpr, target);
  } else if (condition.kind === 'logical') {
    collectSensorsFromCondition(condition.left, target);
    collectSensorsFromCondition(condition.right, target);
  }
}

function uniqueSensors(condition: ConditionNode | null): SensorReference[] {
  const collected: SensorReference[] = [];
  collectSensorsFromCondition(condition, collected);
  return collected.filter(
    (item, index) =>
      collected.findIndex((candidate) => candidate.sensor === item.sensor) === index
  );
}

function countStatements(statements: StatementNode[]): number {
  return statements.reduce((total, statement) => {
    if (statement.kind !== 'if') return total + 1;
    return (
      total +
      1 +
      countStatements(statement.thenBranch) +
      countStatements(statement.elseBranch ?? [])
    );
  }, 0);
}

function newFeatures(): ProgramFeatures {
  return {
    configure: false,
    read: false,
    compare: false,
    decide: false,
    act: false,
    communicate: false,
    wait: false,
    repeat: false,
  };
}

function collectFeatures(
  statements: StatementNode[],
  features: ProgramFeatures
): void {
  for (const statement of statements) {
    switch (statement.kind) {
      case 'if':
        features.compare = true;
        features.decide = true;
        features.read ||= uniqueSensors(statement.condition).length > 0;
        collectFeatures(statement.thenBranch, features);
        collectFeatures(statement.elseBranch ?? [], features);
        break;
      case 'data_log':
      case 'iot_connect_channel':
      case 'iot_publish':
        features.read ||= statement.kind !== 'iot_connect_channel';
        features.communicate = true;
        break;
      case 'cam_wifi':
      case 'cam_stream_start':
      case 'cam_stream_stop':
        features.communicate = true;
        break;
      case 'cam_config':
      case 'cam_resolution':
      case 'cam_quality':
      case 'cam_init':
        features.configure = true;
        break;
      case 'wait':
        features.wait = true;
        break;
      case 'bomba_on':
      case 'bomba_off':
      case 'luz_on':
      case 'luz_off':
      case 'relay_on':
      case 'relay_off':
      case 'digital_out_on':
      case 'digital_out_off':
      case 'cam_capture':
        features.act = true;
        break;
    }
  }
}

function buildSummary(features: ProgramFeatures): string {
  const actions: string[] = [];
  if (features.configure) actions.push('configura');
  if (features.read) actions.push('mide');
  if (features.compare) actions.push('compara');
  if (features.decide) actions.push('decide');
  if (features.act) actions.push('actúa');
  if (features.communicate) actions.push('comunica');
  if (features.wait) actions.push('espera');
  if (features.repeat) {
    actions.push(features.read ? 'vuelve a medir' : 'repite');
  }
  return `Este programa: ${actions.join(' → ')}.`;
}

function sequenceOpening(
  index: number,
  context: 'setup' | 'loop' | 'then' | 'else'
): string {
  if (index > 0) return 'Después,';
  switch (context) {
    case 'setup':
      return 'Primero,';
    case 'loop':
      return 'En cada repetición,';
    case 'then':
      return 'Dentro de la rama “si”, primero,';
    case 'else':
      return 'Dentro de la rama “si no”, primero,';
  }
}

function describeSimpleStatement(
  statement: Exclude<StatementNode, { kind: 'if' }>,
  device: DeviceProfileId
): {
  kind: NarrativeStepKind;
  blockLabel: string;
  explanation: string;
} {
  switch (statement.kind) {
    case 'bomba_on':
      return {
        kind: 'action',
        blockLabel: 'encender bomba',
        explanation:
          'es una instrucción de salida: activa la bomba de riego y produce una acción sobre el sistema físico.',
      };
    case 'bomba_off':
      return {
        kind: 'action',
        blockLabel: 'apagar bomba',
        explanation:
          'es una instrucción de salida: desactiva la bomba de riego.',
      };
    case 'luz_on':
      return {
        kind: 'action',
        blockLabel: 'encender iluminación',
        explanation:
          'es una instrucción de salida: activa la iluminación conectada.',
      };
    case 'luz_off':
      return {
        kind: 'action',
        blockLabel: 'apagar iluminación',
        explanation:
          'es una instrucción de salida: desactiva la iluminación conectada.',
      };
    case 'relay_on':
      return {
        kind: 'action',
        blockLabel: 'encender relay',
        explanation:
          'es una instrucción de salida: activa el canal del relay.',
      };
    case 'relay_off':
      return {
        kind: 'action',
        blockLabel: 'apagar relay',
        explanation:
          'es una instrucción de salida: desactiva el canal del relay.',
      };
    case 'digital_out_on':
      return {
        kind: 'action',
        blockLabel: 'activar salida digital',
        explanation:
          'es una instrucción de salida: coloca el pin configurado en estado HIGH.',
      };
    case 'digital_out_off':
      return {
        kind: 'action',
        blockLabel: 'desactivar salida digital',
        explanation:
          'es una instrucción de salida: coloca el pin configurado en estado LOW.',
      };
    case 'wait':
      return {
        kind: 'wait',
        blockLabel: `esperar ${statement.seconds} segundo(s)`,
        explanation: `cumple una función de temporización: pausa la secuencia durante ${statement.seconds} segundo(s) antes de continuar.`,
      };
    case 'cam_config':
      return {
        kind: 'configuration',
        blockLabel: 'configurar cámara',
        explanation:
          'prepara la configuración necesaria para que el módulo de cámara pueda utilizarse.',
      };
    case 'cam_resolution':
      return {
        kind: 'configuration',
        blockLabel: `resolución ${statement.resolution}`,
        explanation: `define ${statement.resolution} como tamaño de las imágenes que producirá la cámara.`,
      };
    case 'cam_quality':
      return {
        kind: 'configuration',
        blockLabel: `calidad ${statement.quality}`,
        explanation: `establece el nivel ${statement.quality} para la compresión JPEG de las imágenes.`,
      };
    case 'cam_init':
      return {
        kind: 'configuration',
        blockLabel: 'iniciar cámara',
        explanation:
          'inicializa el sensor OV2640 para que las instrucciones posteriores puedan usarlo.',
      };
    case 'cam_wifi':
      return {
        kind: 'communication',
        blockLabel: 'conectar a Wi-Fi',
        explanation: WIFI_INTERPRETER_EXPLANATION,
      };
    case 'cam_stream_start':
      return {
        kind: 'communication',
        blockLabel: 'iniciar transmisión',
        explanation:
          'cumple una función de comunicación: comienza a ofrecer el flujo de video de la cámara.',
      };
    case 'cam_stream_stop':
      return {
        kind: 'communication',
        blockLabel: 'detener transmisión',
        explanation:
          'cumple una función de comunicación: detiene el flujo de video.',
      };
    case 'cam_capture':
      return {
        kind: 'action',
        blockLabel: 'capturar imagen',
        explanation:
          'produce un dato visual: solicita una nueva imagen al sensor de cámara.',
      };
    case 'data_log': {
      const inputDescription = describePhysicalInput(
        device,
        statement.sensor,
        statement.pin,
        statement.bindings
      );
      return {
        kind: 'communication',
        blockLabel: 'registrar dato',
        explanation: `${inputDescription} Luego registra ese valor por el puerto serie con la etiqueta “${statement.label}”.`,
      };
    }
    case 'iot_publish': {
      const inputDescription = describePhysicalInput(
        device,
        statement.sensor,
        statement.pin,
        statement.bindings
      );
      return {
        kind: 'communication',
        blockLabel: 'enviar a IoT',
        explanation: `${inputDescription} Luego publica ese valor en el canal “${statement.topic}” y lo envía al Smart Garden Lab.`,
      };
    }
    case 'iot_connect_channel':
      return {
        kind: 'communication',
        blockLabel: `conectar a Smart Garden Lab — canal ${statement.channel}`,
        explanation: `establece el canal de comunicación ${statement.channel} para este dispositivo. Ese número permitirá identificar la placa y visualizar sus datos desde Smart Garden Lab; no funciona como contraseña ni reemplaza la credencial técnica interna.`,
      };
  }
}

function buildNarrative(program: ParsedProgram): DidacticNarrativeStep[] {
  const steps: DidacticNarrativeStep[] = [];
  const device = deviceDisplayName(program.device);

  steps.push({
    id: 'start',
    kind: 'start',
    blockLabel: 'al iniciar',
    explanation: `Al iniciar el programa, la placa ${device} comienza a ejecutar, en orden, las instrucciones que construiste.`,
    depth: 0,
    blockId: program.startBlockId,
  });

  const appendStatements = (
    statements: StatementNode[],
    depth: number,
    context: 'setup' | 'loop' | 'then' | 'else',
    path: string
  ) => {
    statements.forEach((statement, index) => {
      const id = `${path}-${index}`;
      const opening = sequenceOpening(index, context);

      if (statement.kind !== 'if') {
        const description = describeSimpleStatement(statement, program.device);
        steps.push({
          id,
          kind: description.kind,
          blockLabel: description.blockLabel,
          explanation:
            statement.kind === 'cam_wifi'
              ? WIFI_INTERPRETER_EXPLANATION
              : `${opening} el bloque ${description.blockLabel} ${description.explanation}`,
          depth,
          blockId: statement.blockId,
        });
        return;
      }

      const condition = describeCondition(statement.condition, program.device);
      const sensors = uniqueSensors(statement.condition);
      sensors.forEach((sensor, sensorIndex) => {
        const sensorName = formatSensorDisplayName(sensor.sensor);
        steps.push({
          id: `${id}-read-${sensor.sensor}`,
          kind: 'read',
          blockLabel: `leer ${sensorName}`,
          explanation: `${
            sensorIndex === 0 ? opening : 'También,'
          } ${describePhysicalInput(
            program.device,
            sensor.sensor,
            sensor.pin,
            sensor.bindings
          )} Ese valor queda disponible para la decisión que viene a continuación.`,
          depth,
          blockId: sensor.blockId ?? statement.blockId,
        });
      });

      const hasElse = statement.elseBranch !== undefined;
      steps.push({
        id: `${id}-condition`,
        kind: 'condition',
        blockLabel: hasElse ? 'si... entonces / si no' : 'si... entonces',
        explanation: `${
          sensors.length > 0 ? 'Luego,' : opening
        } este bloque cumple la función computacional de una decisión condicional. Comprueba si ${condition.comparisonText}. Si el resultado es verdadero, ejecuta la rama “si”${
          hasElse
            ? '; si es falso, ejecuta la rama “si no”'
            : '; si es falso, salta los bloques de esa rama'
        }.`,
        depth,
        blockId: statement.blockId,
      });

      steps.push({
        id: `${id}-then`,
        kind: 'branch',
        blockLabel: 'rama si',
        explanation:
          statement.thenBranch.length > 0
            ? 'Cuando la condición es verdadera, el programa entra en esta rama y ejecuta sus bloques en orden.'
            : 'Cuando la condición es verdadera, esta rama no contiene instrucciones.',
        depth: depth + 1,
        branch: 'then',
      });
      appendStatements(statement.thenBranch, depth + 2, 'then', `${id}-then`);

      if (hasElse) {
        steps.push({
          id: `${id}-else`,
          kind: 'branch',
          blockLabel: 'rama si no',
          explanation:
            statement.elseBranch!.length > 0
              ? 'Cuando la condición es falsa, el programa entra en esta otra rama y ejecuta sus bloques en orden.'
              : 'Cuando la condición es falsa, esta rama no contiene instrucciones.',
          depth: depth + 1,
          branch: 'else',
        });
        appendStatements(
          statement.elseBranch!,
          depth + 2,
          'else',
          `${id}-else`
        );
      }
    });
  };

  appendStatements(program.setupStatements, 1, 'setup', 'setup');

  if (program.loopStatements.length > 0) {
    steps.push({
      id: 'repeat',
      kind: 'repeat',
      blockLabel: 'repetir siempre',
      explanation: `Después de la preparación inicial, el bloque repetir siempre crea un ciclo: hace que todas las instrucciones que contiene vuelvan a ejecutarse continuamente mientras la placa ${device} está funcionando.`,
      depth: 0,
      blockId: program.loopBlockId,
    });
    appendStatements(program.loopStatements, 1, 'loop', 'loop');
    steps.push({
      id: 'repeat-again',
      kind: 'continue',
      blockLabel: 'volver a repetir',
      explanation:
        'Cuando termina la última instrucción del ciclo, el programa vuelve al comienzo de repetir siempre y ejecuta nuevamente la misma secuencia con datos actualizados.',
      depth: 0,
      blockId: program.loopBlockId,
    });
  }

  return steps;
}

export function interpretProgram(
  program: ParsedProgram
): DidacticProgramInterpretation {
  const totalStatements =
    countStatements(program.setupStatements) +
    countStatements(program.loopStatements);

  if (totalStatements === 0) {
    return {
      device: program.device,
      isEmpty: true,
      totalStatements: 0,
      summarySentence: EMPTY_MESSAGE,
      narrativeSteps: [],
    };
  }

  const features = newFeatures();
  collectFeatures(program.setupStatements, features);
  collectFeatures(program.loopStatements, features);
  features.repeat = program.loopStatements.length > 0;

  return {
    device: program.device,
    isEmpty: false,
    totalStatements,
    summarySentence: buildSummary(features),
    narrativeSteps: buildNarrative(program),
  };
}
