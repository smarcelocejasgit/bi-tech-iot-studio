import {
  ComponentSignalRequirement,
  DeviceProfileId,
  HardwarePinDefinition,
  PinCapability,
  PinSelectionEvaluation,
  PrototypePinEvidence,
} from '../types/hardware';
import { PinBinding, SensorKey } from '../types/studio';

export const UNSELECTED_PIN_ID = '__SELECT_GPIO__';

const digitalIo: PinCapability[] = ['digital-input', 'digital-output'];

export const HARDWARE_PIN_CATALOG: Record<
  DeviceProfileId,
  HardwarePinDefinition[]
> = {
  'garden-node': [
    {
      id: 'GPIO34',
      label: 'GPIO34',
      arduinoExpression: '34',
      capabilities: ['adc-input', 'digital-input'],
      restrictions: ['input-only'],
    },
    {
      id: 'GPIO35',
      label: 'GPIO35',
      arduinoExpression: '35',
      capabilities: ['adc-input', 'digital-input'],
      restrictions: ['input-only'],
    },
    { id: 'GPIO4', label: 'GPIO4', arduinoExpression: '4', capabilities: digitalIo },
    { id: 'GPIO21', label: 'GPIO21', arduinoExpression: '21', capabilities: digitalIo },
    { id: 'GPIO26', label: 'GPIO26', arduinoExpression: '26', capabilities: digitalIo },
    { id: 'GPIO27', label: 'GPIO27', arduinoExpression: '27', capabilities: digitalIo },
  ],
  'nodemcu-esp8266': [
    {
      id: 'A0',
      label: 'A0',
      arduinoExpression: 'A0',
      capabilities: ['adc-input'],
      restrictions: ['input-only'],
    },
    ...[
      ['D1', 'GPIO5'],
      ['D2', 'GPIO4'],
      ['D5', 'GPIO14'],
      ['D6', 'GPIO12'],
      ['D7', 'GPIO13'],
    ].map(([id, gpio]) => ({
      id,
      label: `${id} (${gpio})`,
      arduinoExpression: id,
      capabilities: [...digitalIo],
    })),
    ...[
      ['D3', 'GPIO0'],
      ['D4', 'GPIO2'],
      ['D8', 'GPIO15'],
    ].map(([id, gpio]) => ({
      id,
      label: `${id} (${gpio})`,
      arduinoExpression: id,
      capabilities: [...digitalIo],
      restrictions: ['boot-pin' as const],
      notes: ['Pin de arranque excluido del selector educativo.'],
    })),
  ],
  'camera-node': [
    ...[0, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 34, 35, 36, 39].map(
      (gpio) => ({
        id: `GPIO${gpio}`,
        label: `GPIO${gpio}`,
        arduinoExpression: String(gpio),
        capabilities: [...digitalIo],
        restrictions: ['camera-reserved' as const],
        notes: ['Reservado por el módulo de cámara del perfil Camera Node.'],
      })
    ),
  ],
};

export const SENSOR_SIGNAL_REQUIREMENTS: Record<
  SensorKey,
  ComponentSignalRequirement
> = {
  humedadSuelo: {
    role: 'AO',
    signalType: 'analog',
    mcuAccess: 'read',
    requiredCapabilities: ['adc-input'],
  },
  nivelLuz: {
    role: 'AO',
    signalType: 'analog',
    mcuAccess: 'read',
    requiredCapabilities: ['adc-input'],
  },
  entradaAnalogicaA0: {
    role: 'AO',
    signalType: 'analog',
    mcuAccess: 'read',
    requiredCapabilities: ['adc-input'],
  },
  entradaDigital: {
    role: 'DATA',
    signalType: 'digital-simple',
    mcuAccess: 'read',
    requiredCapabilities: ['digital-input'],
  },
  temperatura: {
    role: 'DATA',
    signalType: 'digital-protocol',
    mcuAccess: 'read-write',
    requiredCapabilities: ['digital-input', 'digital-output'],
    protocol: 'dht-timed-single-line',
  },
  humedadAmbiente: {
    role: 'DATA',
    signalType: 'digital-protocol',
    mcuAccess: 'read-write',
    requiredCapabilities: ['digital-input', 'digital-output'],
    protocol: 'dht-timed-single-line',
  },
};

export const PROTOTYPE_PIN_EVIDENCE: PrototypePinEvidence[] = [
  {
    componentId: 'dht11',
    role: 'DATA',
    profile: 'garden-node',
    pinId: 'GPIO21',
    status: 'validated',
    detail: 'Conexión validada en Smart Garden Lab: GPIO21.',
  },
  {
    componentId: 'dht11',
    role: 'DATA',
    profile: 'nodemcu-esp8266',
    pinId: 'D5',
    status: 'validated',
    detail: 'Conexión validada en el prototipo NodeMCU: D5 / GPIO14.',
  },
];

export function getSignalRequirement(sensor: SensorKey): ComponentSignalRequirement {
  return SENSOR_SIGNAL_REQUIREMENTS[sensor];
}

export function getHardwarePins(device: DeviceProfileId): HardwarePinDefinition[] {
  return HARDWARE_PIN_CATALOG[device];
}

function isRestricted(pin: HardwarePinDefinition): boolean {
  return Boolean(
    pin.restrictions?.includes('camera-reserved') ||
      pin.restrictions?.includes('boot-pin')
  );
}

export function pinSupportsRequirement(
  pin: HardwarePinDefinition,
  requirement: ComponentSignalRequirement
): boolean {
  return (
    !isRestricted(pin) &&
    requirement.requiredCapabilities.every((capability) =>
      pin.capabilities.includes(capability)
    )
  );
}

export function getCompatiblePins(
  device: DeviceProfileId,
  requirement: ComponentSignalRequirement
): HardwarePinDefinition[] {
  return getHardwarePins(device).filter((pin) =>
    pinSupportsRequirement(pin, requirement)
  );
}

function componentIdForSensor(sensor?: SensorKey): PrototypePinEvidence['componentId'] | null {
  if (sensor === 'temperatura' || sensor === 'humedadAmbiente') return 'dht11';
  if (sensor === 'humedadSuelo') return 'soil-moisture';
  if (sensor === 'nivelLuz') return 'ldr';
  return null;
}

export function evaluatePinSelection(
  device: DeviceProfileId,
  requirement: ComponentSignalRequirement,
  pinId?: string,
  sensor?: SensorKey
): PinSelectionEvaluation {
  if (!pinId || pinId === UNSELECTED_PIN_ID) {
    return {
      valid: false,
      pin: null,
      feedback: [
        {
          severity: 'error',
          code: 'PIN_SELECTION_REQUIRED',
          message: 'Todavía falta elegir un GPIO compatible para este sensor.',
        },
      ],
    };
  }

  const pin = getHardwarePins(device).find((candidate) => candidate.id === pinId) ?? null;
  if (!pin) {
    return {
      valid: false,
      pin: null,
      feedback: [
        {
          severity: 'error',
          code: 'PIN_CAPABILITY_MISMATCH',
          message: `${pinId} no pertenece al perfil de hardware activo.`,
        },
      ],
    };
  }
  if (isRestricted(pin)) {
    const cameraReserved = pin.restrictions?.includes('camera-reserved');
    return {
      valid: false,
      pin,
      feedback: [
        {
          severity: 'error',
          code: 'PIN_RESERVED',
          message: cameraReserved
            ? `${pin.label} está reservado por Camera Node.`
            : `${pin.label} está reservado por el arranque de la placa.`,
        },
      ],
    };
  }
  const missing = requirement.requiredCapabilities.filter(
    (capability) => !pin.capabilities.includes(capability)
  );
  if (missing.length > 0) {
    return {
      valid: false,
      pin,
      feedback: [
        {
          severity: 'error',
          code: 'PIN_CAPABILITY_MISMATCH',
          message: `${pin.label} no posee la capacidad requerida: ${missing.join(', ')}.`,
        },
      ],
    };
  }

  const feedback: PinSelectionEvaluation['feedback'] = [
    {
      severity: 'success',
      code: 'PIN_COMPATIBLE',
      message:
        requirement.signalType === 'analog'
          ? `${pin.label} admite lectura analógica mediante ADC.`
          : pin.capabilities.includes('digital-output')
            ? `${pin.label} puede utilizarse como entrada/salida digital.`
            : `${pin.label} admite entrada digital.`,
    },
  ];
  if (pin.restrictions?.includes('input-only')) {
    feedback.push({
      severity: 'warning',
      code: 'PIN_INPUT_ONLY',
      message: `${pin.label} es sólo entrada.`,
    });
  }
  const componentId = componentIdForSensor(sensor);
  const evidence = componentId
    ? PROTOTYPE_PIN_EVIDENCE.find(
        (item) =>
          item.profile === device &&
          item.componentId === componentId &&
          item.role === requirement.role &&
          item.pinId === pin.id
      )
    : undefined;
  if (evidence) {
    feedback.push({
      severity: 'success',
      code: 'PROTOTYPE_VALIDATED',
      message: evidence.detail,
    });
  }
  return { valid: true, pin, feedback };
}

/** Lee primero bindings nuevos y migra de forma segura el pin legado si existe. */
export function getSelectedPinId(
  sensor: SensorKey,
  bindings?: PinBinding[],
  legacyPin?: string
): string | undefined {
  const role = getSignalRequirement(sensor).role;
  return bindings?.find((binding) => binding.role === role)?.pinId || legacyPin;
}

export function bindingsFromPin(sensor: SensorKey, pinId?: string): PinBinding[] | undefined {
  if (!pinId || pinId === UNSELECTED_PIN_ID) return undefined;
  return [{ role: getSignalRequirement(sensor).role, pinId }];
}
