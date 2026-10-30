import { DeviceProfileId } from '../types/hardware';
import {
  BiTechAssistantContext,
  GeneratedArduinoOutput,
  ParsedProgram,
  ProgramPinSelection,
  SensorKey,
  StatementNode,
} from '../types/studio';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import {
  evaluatePinSelection,
  getSelectedPinId,
  getSignalRequirement,
} from '../hardware/pinModel';
import {
  redactProgramWifiPasswords,
  redactWifiCredentials,
} from '../security/wifiCredentials';

export const BITECH_ASSISTANT_SUGGESTIONS: readonly string[] = [
  'Explicame este programa',
  '¿Qué me falta configurar?',
  'Explicame este bloque',
  'Ayudame a encontrar el error',
] as const;

export interface AssistantSelectedBlockContext {
  component: string;
  signalType: string;
  requiredCapability: string;
  pin: string | null;
  selectionState: 'missing' | 'compatible' | 'incompatible';
  physicalEvidence: 'validated' | 'not-validated';
}

export interface AssistantRequestContext {
  profile: string;
  mode: 'program' | 'simulate' | 'board';
  programSummary: string;
  validation: string[];
  selectedBlocks: AssistantSelectedBlockContext[];
  channel: number | null;
}

export interface BuildAssistantContextParams {
  activeDevice: DeviceProfileId;
  mode?: 'program' | 'simulate' | 'board';
  projectName: string;
  selectedBlockType?: string;
  selectedBlockId?: string;
  parsedProgram: ParsedProgram;
  generatedCode: GeneratedArduinoOutput;
}

/**
 * Construye una instantánea reutilizable y tipada del estado del proyecto
 * lista para integrarse en el futuro con un asistente pedagógico de IA.
 */
export function buildBiTechAssistantContext(
  params: BuildAssistantContextParams
): BiTechAssistantContext {
  const {
    activeDevice,
    mode = 'program',
    projectName,
    selectedBlockType,
    selectedBlockId,
    parsedProgram,
    generatedCode,
  } = params;

  return {
    activeDevice,
    mode,
    projectName,
    selectedBlockType,
    selectedBlockId,
    parsedProgram: redactProgramWifiPasswords(parsedProgram),
    generatedEducationalCode: generatedCode.compactCode,
    generatedSketch: redactWifiCredentials(generatedCode.compilableSketch),
    validationIssues: generatedCode.validationIssues.map((i) => i.message),
  };
}

const SENSOR_LABELS: Record<SensorKey, string> = {
  temperatura: 'temperatura DHT11',
  humedadAmbiente: 'humedad ambiente DHT11',
  humedadSuelo: 'humedad de suelo',
  nivelLuz: 'nivel de luz LDR',
  entradaAnalogicaA0: 'entrada analógica',
  entradaDigital: 'entrada digital',
};

const SIGNAL_LABELS = {
  analog: 'señal analógica',
  'digital-simple': 'señal digital simple',
  'digital-protocol': 'protocolo digital temporizado por una línea DATA',
  'digital-multi-signal': 'señal digital con múltiples líneas',
} as const;

const CAPABILITY_LABELS = {
  'adc-input': 'ADC',
  'digital-input': 'entrada digital',
  'digital-output': 'salida digital',
} as const;

function safeText(value: string, maxLength = 500): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP REDACTADA]')
    .replace(/(password|contrase(?:ñ|n)a|api[_ -]?key|token|secret)\s*[:=]\s*\S+/gi, '$1: [REDACTED]')
    .slice(0, maxLength);
}

function flattenStatements(statements: StatementNode[]): StatementNode[] {
  return statements.flatMap((statement) =>
    statement.kind === 'if'
      ? [
          statement,
          ...flattenStatements(statement.thenBranch),
          ...flattenStatements(statement.elseBranch ?? []),
        ]
      : [statement]
  );
}

function findChannel(program: ParsedProgram): number | null {
  const statement = flattenStatements([
    ...program.setupStatements,
    ...program.loopStatements,
  ]).find((candidate) => candidate.kind === 'iot_connect_channel');
  return statement?.kind === 'iot_connect_channel' ? statement.channel : null;
}

/**
 * Reduce el estado interno del Studio a una lista blanca pedagógica. No incluye
 * XML, sketch, SSID, contraseña, direcciones locales ni identificadores técnicos.
 */
export function buildAssistantRequestContext(
  context: BiTechAssistantContext
): AssistantRequestContext {
  const profile = getDeviceProfile(context.activeDevice);
  const selections: ProgramPinSelection[] = (
    context.parsedProgram.pinSelections?.length
      ? context.parsedProgram.pinSelections
      : (context.parsedProgram.usedSensors ?? []).map((sensor, index) => ({
          sensor,
          blockId: `sensor-${index}`,
        }))
  ).slice(0, 12);
  const selectedBlocks = selections.map((selection) => {
    const requirement = getSignalRequirement(selection.sensor);
    const pin = getSelectedPinId(
      selection.sensor,
      selection.bindings,
      selection.pin
    );
    const evaluation = evaluatePinSelection(
      context.activeDevice,
      requirement,
      pin,
      selection.sensor
    );
    const physicallyValidated = evaluation.feedback.some(
      (item) => item.code === 'PROTOTYPE_VALIDATED'
    );
    return {
      component: SENSOR_LABELS[selection.sensor],
      signalType: SIGNAL_LABELS[requirement.signalType],
      requiredCapability: requirement.requiredCapabilities
        .map((capability) => CAPABILITY_LABELS[capability])
        .join(' + '),
      pin: pin && pin !== '__SELECT_GPIO__' ? safeText(pin, 30) : null,
      selectionState: !pin || pin === '__SELECT_GPIO__'
        ? ('missing' as const)
        : evaluation.valid
          ? ('compatible' as const)
          : ('incompatible' as const),
      physicalEvidence: physicallyValidated
        ? ('validated' as const)
        : ('not-validated' as const),
    };
  });

  const statements = flattenStatements([
    ...context.parsedProgram.setupStatements,
    ...context.parsedProgram.loopStatements,
  ]);
  const kinds = [...new Set(statements.map((statement) => statement.kind))];
  const sensors = [
    ...new Set(
      selectedBlocks.map((selection) => selection.component)
    ),
  ];
  const missingCount = selectedBlocks.filter(
    (selection) => selection.selectionState === 'missing'
  ).length;
  const summaryParts = [
    `${statements.length} bloques activos`,
    kinds.length > 0 ? `acciones: ${kinds.join(', ')}` : 'sin acciones',
    sensors.length > 0 ? `componentes: ${sensors.join(', ')}` : 'sin sensores',
    missingCount > 0 ? `${missingCount} selección(es) GPIO pendiente(s)` : 'GPIO completos',
    context.selectedBlockType
      ? `bloque seleccionado: ${safeText(context.selectedBlockType, 80)}`
      : 'sin bloque seleccionado',
    `resumen Arduino: ${[
      'analogRead',
      'digitalRead',
      'pinMode',
      'DHT',
      'conectarCanalBiTech',
    ]
      .filter((operation) => context.generatedEducationalCode.includes(operation))
      .join(', ') || 'sin operaciones de hardware generadas'}`,
  ];

  return {
    profile: `${profile.name} (${profile.mcu})`,
    mode: context.mode,
    programSummary: summaryParts.join('. ').slice(0, 1200),
    validation: context.validationIssues
      .slice(0, 12)
      .map((issue) => safeText(issue, 350)),
    selectedBlocks,
    channel: findChannel(context.parsedProgram),
  };
}
