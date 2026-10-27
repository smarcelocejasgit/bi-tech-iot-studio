import { DeviceProfileId } from '../types/hardware';
import {
  ConditionNode,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';

export type DidacticCategoryKey =
  | 'start'
  | 'observe'
  | 'decide'
  | 'act'
  | 'communicate'
  | 'repeat';

export interface DidacticCategoryMeta {
  key: DidacticCategoryKey;
  label: string;
  badgeLabel: string;
  iconName: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const DIDACTIC_CATEGORIES: Record<DidacticCategoryKey, DidacticCategoryMeta> = {
  start: {
    key: 'start',
    label: 'Al comenzar',
    badgeLabel: 'Configuración inicial',
    iconName: 'Play',
    colorClass: 'text-sky-700',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
  },
  observe: {
    key: 'observe',
    label: 'Observar / medir',
    badgeLabel: 'Lectura de sensores',
    iconName: 'Eye',
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
  },
  decide: {
    key: 'decide',
    label: 'Decidir',
    badgeLabel: 'Condiciones y lógica',
    iconName: 'GitBranch',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  act: {
    key: 'act',
    label: 'Actuar',
    badgeLabel: 'Control de actuadores',
    iconName: 'Zap',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  communicate: {
    key: 'communicate',
    label: 'Comunicar',
    badgeLabel: 'Telemetría y red',
    iconName: 'Radio',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
  },
  repeat: {
    key: 'repeat',
    label: 'Repetir',
    badgeLabel: 'Ciclo continuo',
    iconName: 'Repeat',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
};

export interface DidacticItem {
  id: string;
  category: DidacticCategoryKey;
  title: string;
  explanation: string;
  blockId?: string;
  tag?: string;
}

export interface DidacticProgramInterpretation {
  device: DeviceProfileId;
  isEmpty: boolean;
  totalStatements: number;
  summarySentence: string;
  itemsByCategory: Record<DidacticCategoryKey, DidacticItem[]>;
  activeCategories: DidacticCategoryKey[];
}

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
      return 'sensor en entrada analógica A0';
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
    case 'sensor_read':
      return formatSensorDisplayName(expr.sensor);
    case 'number_literal':
      return String(expr.value);
    case 'math_op':
      return `${formatNumericExpression(expr.left)} ${expr.operator} ${expr.rightNumber}`;
  }
}

interface ConditionSummary {
  subject: string;
  comparisonText: string;
  pedagogicalMeaning: string;
}

export function describeCondition(cond: ConditionNode | null): ConditionSummary {
  if (!cond) {
    return {
      subject: 'Condición sin configurar',
      comparisonText: 'condición no definida',
      pedagogicalMeaning: 'requiere completar los parámetros en el bloque',
    };
  }

  if (cond.kind === 'camera_state_check') {
    return {
      subject: 'Estado de la cámara',
      comparisonText: 'si la cámara está lista y activa',
      pedagogicalMeaning: 'el módulo OV2640 está disponible para operar',
    };
  }

  if (cond.kind === 'logical') {
    const leftDesc = describeCondition(cond.left);
    const rightDesc = describeCondition(cond.right);
    const opWord = cond.operator === 'AND' ? 'y además' : 'o bien';
    return {
      subject: `${leftDesc.subject} ${cond.operator} ${rightDesc.subject}`,
      comparisonText: `${leftDesc.comparisonText} ${opWord} ${rightDesc.comparisonText}`,
      pedagogicalMeaning:
        cond.operator === 'AND'
          ? `ambas condiciones deben cumplirse a la vez (${leftDesc.pedagogicalMeaning} y ${rightDesc.pedagogicalMeaning})`
          : `al menos una de las dos condiciones debe cumplirse (${leftDesc.pedagogicalMeaning} o ${rightDesc.pedagogicalMeaning})`,
    };
  }

  // Comparison
  const sensorKey: SensorKey | undefined =
    cond.leftSensor ??
    (cond.leftExpr && cond.leftExpr.kind === 'sensor_read'
      ? cond.leftExpr.sensor
      : undefined);

  const leftLabel = cond.leftExpr
    ? formatNumericExpression(cond.leftExpr)
    : sensorKey
      ? formatSensorDisplayName(sensorKey)
      : cond.leftNumber !== undefined
        ? String(cond.leftNumber)
        : 'valor';

  const rightVal = cond.rightNumber;
  const unit = sensorKey ? formatSensorUnit(sensorKey) : '';
  const rightWithUnit = unit ? `${rightVal} ${unit}` : `${rightVal}`;

  let opText = '';
  switch (cond.operator) {
    case '<':
      opText = 'es menor que';
      break;
    case '<=':
      opText = 'es menor o igual que';
      break;
    case '>':
      opText = 'es mayor que';
      break;
    case '>=':
      opText = 'es mayor o igual que';
      break;
    case '==':
      opText = 'es igual a';
      break;
    case '!=':
      opText = 'es diferente de';
      break;
  }

  let meaning = '';
  if (sensorKey === 'humedadSuelo') {
    if (cond.operator === '<' || cond.operator === '<=') {
      meaning = 'detecta que el suelo necesita agua';
    } else if (cond.operator === '>' || cond.operator === '>=') {
      meaning = 'detecta que el suelo tiene suficiente humedad';
    } else {
      meaning = `la humedad de suelo coincide con ${rightVal}`;
    }
  } else if (sensorKey === 'temperatura') {
    if (cond.operator === '>' || cond.operator === '>=') {
      meaning = `detecta calor elevado (más de ${rightWithUnit})`;
    } else if (cond.operator === '<' || cond.operator === '<=') {
      meaning = `detecta frío ambiental (menos de ${rightWithUnit})`;
    } else {
      meaning = `la temperatura es de ${rightWithUnit}`;
    }
  } else if (sensorKey === 'humedadAmbiente') {
    if (cond.operator === '<' || cond.operator === '<=') {
      meaning = 'el aire está seco';
    } else if (cond.operator === '>' || cond.operator === '>=') {
      meaning = 'el aire tiene alta humedad';
    } else {
      meaning = `la humedad ambiental alcanza ${rightWithUnit}`;
    }
  } else if (sensorKey === 'nivelLuz') {
    if (cond.operator === '<' || cond.operator === '<=') {
      meaning = 'detecta oscuridad o luz insuficiente';
    } else if (cond.operator === '>' || cond.operator === '>=') {
      meaning = 'detecta buena iluminación natural';
    } else {
      meaning = `el nivel de luz equivale a ${rightVal}`;
    }
  } else if (sensorKey === 'entradaDigital') {
    if (rightVal === 1) {
      meaning = 'la entrada digital se activa (HIGH)';
    } else {
      meaning = 'la entrada digital está inactiva (LOW)';
    }
  } else if (sensorKey === 'entradaAnalogicaA0') {
    meaning = `la lectura del canal A0 ${opText} ${rightVal}`;
  } else {
    meaning = `${leftLabel} ${opText} ${rightWithUnit}`;
  }

  return {
    subject: leftLabel,
    comparisonText: `${leftLabel} ${opText} ${rightWithUnit}`,
    pedagogicalMeaning: meaning,
  };
}

export function formatActionsList(statements: StatementNode[]): string {
  if (!statements || statements.length === 0) {
    return 'no realiza ninguna acción adicional';
  }

  const parts = statements.map((st) => {
    switch (st.kind) {
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
        return `espera ${st.seconds} segundo(s)`;
      case 'cam_capture':
        return 'toma una captura fotográfica';
      case 'cam_stream_start':
        return 'inicia la transmisión de video en vivo';
      case 'cam_stream_stop':
        return 'detiene la transmisión de video';
      case 'data_log':
        return `registra el dato "${st.label}"`;
      case 'iot_publish':
        return `envía la lectura al canal IoT "${st.topic}"`;
      case 'cam_config':
        return 'configura la cámara';
      case 'cam_resolution':
        return `ajusta la resolución a ${st.resolution}`;
      case 'cam_quality':
        return `ajusta la calidad a ${st.quality}`;
      case 'cam_init':
        return 'inicia el sensor de cámara';
      case 'cam_wifi':
        return `conecta a la red Wi-Fi ${st.ssid}`;
      case 'if':
        return 'evalúa una condición anidada';
    }
  });

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
  const last = parts.pop();
  return `${parts.join(', ')} y ${last}`;
}

function collectSensorsFromExpr(
  expr: NumericExpressionNode | undefined,
  target: Set<SensorKey>
) {
  if (!expr) return;
  if (expr.kind === 'sensor_read') {
    target.add(expr.sensor);
  } else if (expr.kind === 'math_op') {
    collectSensorsFromExpr(expr.left, target);
  }
}

function collectSensorsFromCondition(
  cond: ConditionNode | null | undefined,
  target: Set<SensorKey>
) {
  if (!cond) return;
  if (cond.kind === 'comparison') {
    if (cond.leftSensor) target.add(cond.leftSensor);
    if (cond.rightSensor) target.add(cond.rightSensor);
    collectSensorsFromExpr(cond.leftExpr, target);
  } else if (cond.kind === 'logical') {
    collectSensorsFromCondition(cond.left, target);
    collectSensorsFromCondition(cond.right, target);
  }
}

function collectSensorsFromStatements(
  statements: StatementNode[],
  target: Set<SensorKey>
) {
  for (const st of statements) {
    if (st.kind === 'if') {
      collectSensorsFromCondition(st.condition, target);
      collectSensorsFromStatements(st.thenBranch, target);
      if (st.elseBranch) collectSensorsFromStatements(st.elseBranch, target);
    } else if (st.kind === 'data_log' || st.kind === 'iot_publish') {
      target.add(st.sensor);
    }
  }
}

export function interpretProgram(program: ParsedProgram): DidacticProgramInterpretation {
  const itemsByCategory: Record<DidacticCategoryKey, DidacticItem[]> = {
    start: [],
    observe: [],
    decide: [],
    act: [],
    communicate: [],
    repeat: [],
  };

  const totalStatements =
    program.setupStatements.length + program.loopStatements.length;

  if (totalStatements === 0) {
    return {
      device: program.device,
      isEmpty: true,
      totalStatements: 0,
      summarySentence:
        'El proyecto no tiene instrucciones cargadas todavía. Construí tu programa arrastrando bloques.',
      itemsByCategory,
      activeCategories: [],
    };
  }

  // 1. AL COMENZAR (Setup / Inicialización)
  program.setupStatements.forEach((st, idx) => {
    switch (st.kind) {
      case 'cam_config':
        itemsByCategory.start.push({
          id: `start-cam-config-${idx}`,
          category: 'start',
          title: 'Configurar pines del módulo de cámara OV2640',
          explanation:
            'Prepara los pines de datos, reloj e inicialización del bus para el sensor de cámara.',
          blockId: st.blockId,
          tag: 'Cámara',
        });
        break;
      case 'cam_resolution':
        itemsByCategory.start.push({
          id: `start-cam-res-${idx}`,
          category: 'start',
          title: `Definir resolución en ${st.resolution}`,
          explanation: `Establece la resolución óptica del video/foto en ${st.resolution} para equilibrar nitidez y fluidez.`,
          blockId: st.blockId,
          tag: 'Cámara',
        });
        break;
      case 'cam_quality':
        itemsByCategory.start.push({
          id: `start-cam-qual-${idx}`,
          category: 'start',
          title: `Fijar calidad JPEG en nivel ${st.quality}`,
          explanation: `Ajusta el nivel de compresión de la imagen (valores bajos ofrecen mayor definición fotográfica).`,
          blockId: st.blockId,
          tag: 'Cámara',
        });
        break;
      case 'cam_init':
        itemsByCategory.start.push({
          id: `start-cam-init-${idx}`,
          category: 'start',
          title: 'Inicializar sensor de cámara OV2640',
          explanation:
            'Energiza el sensor óptico y verifica que responda antes de iniciar la captura o streaming.',
          blockId: st.blockId,
          tag: 'Cámara',
        });
        break;
      case 'cam_wifi':
        itemsByCategory.start.push({
          id: `start-cam-wifi-${idx}`,
          category: 'start',
          title: `Conectar a Wi-Fi ("${st.ssid}")`,
          explanation: `Conecta la placa a la red escolar local ("${st.ssid}") para permitir la transmisión de datos o video en vivo.`,
          blockId: st.blockId,
          tag: 'Wi-Fi',
        });
        break;
      default:
        // Any other setup statements
        break;
    }
  });

  // 2. OBSERVAR / MEDIR (Sensores)
  const observedSensors = new Set<SensorKey>();
  collectSensorsFromStatements(program.setupStatements, observedSensors);
  collectSensorsFromStatements(program.loopStatements, observedSensors);

  observedSensors.forEach((sensor) => {
    switch (sensor) {
      case 'humedadSuelo':
        itemsByCategory.observe.push({
          id: `obs-soil`,
          category: 'observe',
          title: 'Sensor de humedad del suelo',
          explanation:
            'La placa mide el nivel de agua retenida en el sustrato para saber cuándo las raíces necesitan hidratación.',
          tag: 'Humedad suelo',
        });
        break;
      case 'temperatura':
        itemsByCategory.observe.push({
          id: `obs-temp`,
          category: 'observe',
          title: 'Sensor de temperatura (DHT11)',
          explanation:
            'La placa mide los grados de calor ambiente (°C) para prevenir estrés térmico en el cultivo.',
          tag: 'Temperatura',
        });
        break;
      case 'humedadAmbiente':
        itemsByCategory.observe.push({
          id: `obs-hum`,
          category: 'observe',
          title: 'Sensor de humedad del aire (DHT11)',
          explanation:
            'La placa mide el porcentaje de humedad ambiental (%) para vigilar la transpiración de las plantas.',
          tag: 'Humedad aire',
        });
        break;
      case 'nivelLuz':
        itemsByCategory.observe.push({
          id: `obs-light`,
          category: 'observe',
          title: 'Fotorresistencia LDR (luz)',
          explanation:
            'La placa mide la intensidad de luz ambiente para saber si la huerta requiere iluminación artificial de apoyo.',
          tag: 'Luz ambiental',
        });
        break;
      case 'entradaAnalogicaA0':
        itemsByCategory.observe.push({
          id: `obs-a0`,
          category: 'observe',
          title: 'Canal analógico A0 (0 a 1023)',
          explanation:
            'La placa mide la tensión del sensor conectado al único canal analógico de la placa NodeMCU.',
          tag: 'Analógico A0',
        });
        break;
      case 'entradaDigital':
        itemsByCategory.observe.push({
          id: `obs-dig-in`,
          category: 'observe',
          title: 'Entrada digital (HIGH / LOW)',
          explanation:
            'La placa lee el estado binario del pin digital para detectar señales de pulsadores o sensores todo/nada.',
          tag: 'Entrada digital',
        });
        break;
    }
  });

  // 3. DECIDIR (Condicionales / Lógica) & 4. ACTUAR & 5. COMUNICAR
  let decideIndex = 0;
  let waitSecondsCount = 0;

  function traverseStatements(statements: StatementNode[], depth = 0) {
    for (const st of statements) {
      if (st.kind === 'if') {
        decideIndex++;
        const condDesc = describeCondition(st.condition);
        const thenSummary = formatActionsList(st.thenBranch);
        const hasElse = Boolean(st.elseBranch && st.elseBranch.length > 0);
        const elseSummary = hasElse
          ? formatActionsList(st.elseBranch!)
          : undefined;

        // Construir la explicación pedagógica natural:
        // "La placa compara la humedad del suelo con el valor 30. Si detecta que el suelo necesita agua, activa la bomba."
        let sentence = '';
        if (st.condition && st.condition.kind === 'comparison') {
          const sensorKey: SensorKey | undefined =
            st.condition.leftSensor ??
            (st.condition.leftExpr &&
            st.condition.leftExpr.kind === 'sensor_read'
              ? st.condition.leftExpr.sensor
              : undefined);

          const subject = sensorKey
            ? formatSensorDisplayName(sensorKey)
            : 'el valor medido';

          sentence = `La placa compara ${subject} con el valor ${st.condition.rightNumber}. Si ${condDesc.pedagogicalMeaning}, ${thenSummary}.`;
          if (elseSummary) {
            sentence += ` De lo contrario, ${elseSummary}.`;
          }
        } else {
          sentence = `La placa evalúa ${condDesc.comparisonText}. Si se cumple (${condDesc.pedagogicalMeaning}), ${thenSummary}.`;
          if (elseSummary) {
            sentence += ` En caso contrario, ${elseSummary}.`;
          }
        }

        itemsByCategory.decide.push({
          id: `decide-${decideIndex}`,
          category: 'decide',
          title: `Evaluar: ${condDesc.comparisonText}`,
          explanation: sentence,
          blockId: st.blockId,
          tag: depth > 0 ? 'Decisión anidada' : 'Decisión',
        });

        // Recorrer ramas para actuaciones y comunicaciones
        traverseStatements(st.thenBranch, depth + 1);
        if (st.elseBranch) {
          traverseStatements(st.elseBranch, depth + 1);
        }
      } else if (st.kind === 'bomba_on') {
        itemsByCategory.act.push({
          id: `act-bomba-on-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Activar bomba de riego',
          explanation:
            'Enciende la bomba eléctrica para suministrar agua a la tierra de la huerta.',
          blockId: st.blockId,
          tag: 'Bomba',
        });
      } else if (st.kind === 'bomba_off') {
        itemsByCategory.act.push({
          id: `act-bomba-off-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Apagar bomba de riego',
          explanation:
            'Detiene la bomba de agua para evitar encharcamientos o sobrehidratación.',
          blockId: st.blockId,
          tag: 'Bomba',
        });
      } else if (st.kind === 'luz_on') {
        itemsByCategory.act.push({
          id: `act-luz-on-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Encender iluminación artificial',
          explanation:
            'Activa la luminaria para aportar luz complementaria y estimular el desarrollo vegetal.',
          blockId: st.blockId,
          tag: 'Iluminación',
        });
      } else if (st.kind === 'luz_off') {
        itemsByCategory.act.push({
          id: `act-luz-off-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Apagar iluminación',
          explanation:
            'Apaga la luminaria para permitir el descanso fisiológico de las plantas.',
          blockId: st.blockId,
          tag: 'Iluminación',
        });
      } else if (st.kind === 'relay_on') {
        itemsByCategory.act.push({
          id: `act-relay-on-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Activar relay',
          explanation:
            'Conmuta el contacto del relay para encender la carga de potencia conectada.',
          blockId: st.blockId,
          tag: 'Relay',
        });
      } else if (st.kind === 'relay_off') {
        itemsByCategory.act.push({
          id: `act-relay-off-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Desactivar relay',
          explanation:
            'Abre el circuito del relay para desenergizar el artefacto conectado.',
          blockId: st.blockId,
          tag: 'Relay',
        });
      } else if (st.kind === 'digital_out_on') {
        itemsByCategory.act.push({
          id: `act-dig-on-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Activar salida digital (HIGH)',
          explanation:
            'Establece el pin digital en nivel alto (3.3V) para enviar una señal de control.',
          blockId: st.blockId,
          tag: 'Salida digital',
        });
      } else if (st.kind === 'digital_out_off') {
        itemsByCategory.act.push({
          id: `act-dig-off-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Desactivar salida digital (LOW)',
          explanation:
            'Pone el pin digital en 0V para desactivar la señal de control externa.',
          blockId: st.blockId,
          tag: 'Salida digital',
        });
      } else if (st.kind === 'cam_capture') {
        itemsByCategory.act.push({
          id: `act-cam-cap-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Tomar fotografía con la cámara',
          explanation:
            'Dispara el sensor OV2640 y genera un fotograma de la huerta para observación botánica.',
          blockId: st.blockId,
          tag: 'Cámara',
        });
      } else if (st.kind === 'cam_stream_start') {
        itemsByCategory.act.push({
          id: `act-cam-stream-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Iniciar transmisión de video en vivo',
          explanation:
            'Abre el flujo MJPEG en la red para ver el estado de la huerta en tiempo real.',
          blockId: st.blockId,
          tag: 'Streaming',
        });
      } else if (st.kind === 'cam_stream_stop') {
        itemsByCategory.act.push({
          id: `act-cam-stop-${Math.random().toString(36).slice(2, 6)}`,
          category: 'act',
          title: 'Detener transmisión de video',
          explanation:
            'Pausa el video en vivo para reducir el consumo energético y el tráfico de red.',
          blockId: st.blockId,
          tag: 'Streaming',
        });
      } else if (st.kind === 'data_log') {
        itemsByCategory.communicate.push({
          id: `comm-log-${Math.random().toString(36).slice(2, 6)}`,
          category: 'communicate',
          title: `Registrar por serie: "${st.label}"`,
          explanation: `Envía por el cable USB el dato "${st.label}" correspondiente a ${formatSensorDisplayName(st.sensor)} para su lectura en la computadora.`,
          blockId: st.blockId,
          tag: 'Monitor Serie',
        });
      } else if (st.kind === 'iot_publish') {
        itemsByCategory.communicate.push({
          id: `comm-iot-${Math.random().toString(36).slice(2, 6)}`,
          category: 'communicate',
          title: `Publicar en canal IoT: "${st.topic}"`,
          explanation: `Transmite la lectura de ${formatSensorDisplayName(st.sensor)} vía Wi-Fi hacia "${st.topic}" para su visualización en Smart Garden Lab.`,
          blockId: st.blockId,
          tag: 'IoT Wi-Fi',
        });
      } else if (st.kind === 'cam_wifi') {
        itemsByCategory.communicate.push({
          id: `comm-wifi-${Math.random().toString(36).slice(2, 6)}`,
          category: 'communicate',
          title: `Conectar a Wi-Fi: "${st.ssid}"`,
          explanation: `Establece la conexión de red inalámbrica con la red escolar "${st.ssid}".`,
          blockId: st.blockId,
          tag: 'Wi-Fi',
        });
      } else if (st.kind === 'wait') {
        waitSecondsCount += st.seconds;
      }
    }
  }

  traverseStatements(program.loopStatements);

  // 6. REPETIR (Ciclo continuo)
  if (program.loopStatements.length > 0) {
    if (waitSecondsCount > 0) {
      itemsByCategory.repeat.push({
        id: 'rep-loop-wait',
        category: 'repeat',
        title: 'Ciclo continuo con temporización',
        explanation: `La placa repite estas instrucciones de manera indefinida. Cada ciclo incluye una pausa de ${waitSecondsCount} segundo(s) para dar tiempo a que los actuadores y sensores se estabilicen.`,
        tag: 'Bucle principal',
      });
    } else {
      itemsByCategory.repeat.push({
        id: 'rep-loop-continuous',
        category: 'repeat',
        title: 'Ciclo continuo rápido',
        explanation:
          'La placa repite la lectura y toma de decisiones continuamente a la máxima velocidad del microcontrolador.',
        tag: 'Bucle principal',
      });
    }
  }

  const activeCategories: DidacticCategoryKey[] = (
    ['start', 'observe', 'decide', 'act', 'communicate', 'repeat'] as DidacticCategoryKey[]
  ).filter((k) => itemsByCategory[k].length > 0);

  // Resumen pedagógico conciso de cabecera
  const categorySummaryWords = activeCategories
    .map((k) => DIDACTIC_CATEGORIES[k].label)
    .join(' → ');

  const summarySentence = `El programa ejecuta el ciclo pedagógico: ${categorySummaryWords}.`;

  return {
    device: program.device,
    isEmpty: false,
    totalStatements,
    summarySentence,
    itemsByCategory,
    activeCategories,
  };
}
