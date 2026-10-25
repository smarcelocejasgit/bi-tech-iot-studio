/**
 * Contratos tipados para los perfiles y capacidades de hardware de Bi-Tech IoT Studio (V0.1.2).
 * IMPORTANTE:
 * - Se distingue explícitamente entre Capacidades Físicas del Hardware y Recursos Habilitados por el Perfil Educativo.
 * - Se distingue entre etiquetas de placa (D0, D1, D2...) y números de GPIO reales del chip (GPIO16, GPIO5, GPIO4...).
 * - No se asume una tensión máxima universal en A0 (`adcInputVoltageRange: 'unverified'`).
 */

export type DeviceProfileId = 'garden-node' | 'camera-node' | 'nodemcu-esp8266';

export type WorkMode = 'program' | 'simulate' | 'board';

export type RelayActivePolarity = 'ACTIVE_LOW' | 'ACTIVE_HIGH' | 'PENDING_VERIFICATION';

export type SimulatorSystemKind = 'garden-system' | 'camera-system' | 'nodemcu-system';

export type AdcVoltageRangeStatus = 'unverified' | '0-1.0V' | '0-3.2V' | '0-3.3V';

export type CompatibleSensorId =
  | 'temperatura'
  | 'humedadAmbiente'
  | 'humedadSuelo'
  | 'nivelLuz'
  | 'entradaAnalogicaA0'
  | 'entradaDigital';

export type CompatibleActuatorId =
  | 'water_pump'
  | 'led_lighting'
  | 'single_relay'
  | 'digital_output'
  | 'camera_ov2640';

/**
 * Representa un pin de la placa distinguiendo entre:
 * - Identificador simbólico en código C/C++ (ej. `RELAY_PIN`)
 * - Etiqueta impresa en la serigrafía de la placa (ej. `D1`, `D2`, `A0`)
 * - Número de GPIO real del microcontrolador (ej. `GPIO5` -> `5`)
 */
export interface SymbolicPinAssignment {
  /** Identificador simbólico utilizado en el código C/C++ educativo (ej. RELAY_PIN, ANALOG_A0_PIN) */
  symbolicName: string;
  /** Etiqueta de serigrafía en la placa (ej. 'D1', 'D2', 'A0'), null si aún no se fijó el cableado */
  boardLabel: string | null;
  /** Pin físico GPIO del chip (null hasta que se cierre el cableado definitivo en laboratorio) */
  verifiedGpio: number | string | null;
  /** Etiqueta de placa candidata para compilación de prueba en V0.1.2 (ej. 'D1') */
  candidateBoardLabel?: string;
  /** GPIO real correspondiente a la etiqueta candidata para compilación (ej. 5 para D1 -> GPIO5) */
  candidateGpio?: number | string;
  /** Rol eléctrico del pin */
  mode: 'INPUT' | 'OUTPUT' | 'ADC';
  /** Descripción del componente conectado */
  component: string;
  /** Nota técnica o supuesto pendiente */
  verificationNote: string;
}

/**
 * Mapeo de referencia entre la serigrafía de la placa NodeMCU y el GPIO real del ESP8266.
 */
export interface BoardPinReference {
  boardLabel: string;
  espGpioName: string;
  gpioNumber: number | string;
  notes: string;
  safeForGeneralEducationalUse: boolean;
}

/**
 * Capacidades físicas reales del microcontrolador / placa de desarrollo.
 */
export interface PhysicalHardwareCapabilities {
  mcuModel: string;
  operatingVoltage: '3.3V';
  totalUsableGpios: number;
  analogInputs: number;
  analogResolutionBits: number;
  analogMaxRawValue: number;
  adcInputVoltageRange: AdcVoltageRangeStatus;
  adcVoltageNote: string;
  pwmCapablePins: number;
  wifi: boolean;
  cameraInterface: boolean;
  physicalNotes: string;
}

/**
 * Subconjunto estructurado de recursos que el perfil educativo habilita en el editor visual
 * para facilitar el aprendizaje seguro en el aula.
 */
export interface EducationalProfileAllocation {
  digitalInputsExposed: number;
  digitalOutputsExposed: number;
  analogInputsExposed: number;
  relayChannelsExposed: number;
  simplificationExplanation: string;
}

/**
 * Declaración de capacidades consultada por el editor, el validador y el simulador.
 */
export interface HardwareCapabilities {
  digitalInputs: number;
  digitalOutputs: number;
  analogInputs: number;
  analogResolutionBits: number;
  analogMaxValue: number;
  adcInputVoltageRange: AdcVoltageRangeStatus;
  pwmChannels: number;
  wifi: boolean;
  camera: boolean;
  relayChannels: number;
  compatibleSensors: CompatibleSensorId[];
  compatibleActuators: CompatibleActuatorId[];
  pedagogicalResourceNote: string;
  physicalCapabilities: PhysicalHardwareCapabilities;
  educationalAllocation: EducationalProfileAllocation;
}

export interface BaseDeviceHardwareProfile {
  id: DeviceProfileId;
  name: string;
  shortBadge: string;
  mcu: 'ESP32' | 'ESP32-CAM' | 'ESP8266';
  simulatorKind: SimulatorSystemKind;
  verifiedFqbn: string | null;
  capabilities: HardwareCapabilities;
}

export interface GardenNodeHardwareConfig extends BaseDeviceHardwareProfile {
  id: 'garden-node';
  mcu: 'ESP32';
  pins: {
    dht11: SymbolicPinAssignment;
    soilMoisture: SymbolicPinAssignment;
    ldr: SymbolicPinAssignment;
    relayChannel1Pump: SymbolicPinAssignment;
    relayChannel2Light: SymbolicPinAssignment;
  };
  relayConfig: {
    polarity: RelayActivePolarity;
    safeInitialState: {
      pump: 'OFF';
      light: 'OFF';
    };
  };
}

export type CameraResolutionOption =
  | 'QVGA (320x240)'
  | 'CIF (400x296)'
  | 'VGA (640x480)'
  | 'SVGA (800x600)'
  | 'XGA (1024x768)';

export interface CameraNodeHardwareConfig extends BaseDeviceHardwareProfile {
  id: 'camera-node';
  mcu: 'ESP32-CAM';
  sensor: 'OV2640';
  /** FQBN candidato para compilación previa a validación física (ej. esp32:esp32:esp32cam) */
  candidateFqbn: string;
  /** Supuesto documentado del modelo de placa hasta verificar físicamente el hardware */
  boardModelAssumption: string;
  programmingChannel: 'USB';
  streamingChannel: 'Wi-Fi';
  streamEndpointUrl: string | null;
  captureEndpointUrl: string | null;
  defaultResolution: CameraResolutionOption;
  defaultQuality: number;
}

export interface NodeMcuHardwareConfig extends BaseDeviceHardwareProfile {
  id: 'nodemcu-esp8266';
  mcu: 'ESP8266';
  pinReferenceTable: BoardPinReference[];
  pins: {
    dht11: SymbolicPinAssignment;
    analogA0: SymbolicPinAssignment;
    digitalInput: SymbolicPinAssignment;
    digitalOutput: SymbolicPinAssignment;
    relay: SymbolicPinAssignment;
    lighting: SymbolicPinAssignment;
  };
  relayConfig: {
    polarity: RelayActivePolarity;
    safeInitialState: {
      relay: 'OFF';
      lighting: 'OFF';
      digitalOutput: 'LOW';
    };
  };
}

export interface HardwareValidationIssue {
  code:
    | 'ANALOG_INPUTS_EXCEEDED'
    | 'UNSUPPORTED_CAMERA_ON_DEVICE'
    | 'UNSUPPORTED_ACTUATOR_ON_DEVICE';
  severity: 'warning' | 'error';
  title: string;
  message: string;
  pedagogicalExplanation: string;
  affectedSensorsOrBlocks: string[];
}
