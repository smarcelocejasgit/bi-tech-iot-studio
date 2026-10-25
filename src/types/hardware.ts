/**
 * Contratos tipados para los perfiles y capacidades de hardware de Bi-Tech IoT Studio.
 * IMPORTANTE: No se inventan números de GPIO ni URLs de streaming no verificadas.
 */

export type DeviceProfileId = 'garden-node' | 'camera-node' | 'nodemcu-esp8266';

export type WorkMode = 'program' | 'simulate' | 'board';

export type RelayActivePolarity = 'ACTIVE_LOW' | 'ACTIVE_HIGH' | 'PENDING_VERIFICATION';

export type SimulatorSystemKind = 'garden-system' | 'camera-system' | 'nodemcu-system';

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

export interface SymbolicPinAssignment {
  /** Identificador simbólico utilizado en el código C/C++ educativo (ej. BOMBA_PIN, ANALOG_A0_PIN) */
  symbolicName: string;
  /** Pin físico GPIO en la placa (null hasta que se verifique en laboratorio) */
  verifiedGpio: number | string | null;
  /** Rol eléctrico del pin */
  mode: 'INPUT' | 'OUTPUT' | 'ADC';
  /** Descripción del componente conectado */
  component: string;
  /** Nota técnica o supuesto pendiente */
  verificationNote: string;
}

/**
 * Declaración explícita de las capacidades físicas de cada perfil de hardware.
 * Permite al editor, al generador de código, al validador y al simulador adaptarse
 * sin condicionales dispersos por la interfaz.
 */
export interface HardwareCapabilities {
  digitalInputs: number;
  digitalOutputs: number;
  analogInputs: number;
  analogResolutionBits: number;
  analogMaxValue: number;
  pwmChannels: number;
  wifi: boolean;
  camera: boolean;
  relayChannels: number;
  compatibleSensors: CompatibleSensorId[];
  compatibleActuators: CompatibleActuatorId[];
  pedagogicalResourceNote: string;
}

export interface BaseDeviceHardwareProfile {
  id: DeviceProfileId;
  name: string;
  shortBadge: string;
  mcu: 'ESP32' | 'ESP32-CAM' | 'ESP8266';
  simulatorKind: SimulatorSystemKind;
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
  programmingChannel: 'USB';
  streamingChannel: 'Wi-Fi';
  /** Endpoint configurable. null hasta verificar el firmware real en laboratorio */
  streamEndpointUrl: string | null;
  captureEndpointUrl: string | null;
  defaultResolution: CameraResolutionOption;
  defaultQuality: number;
}

export interface NodeMcuHardwareConfig extends BaseDeviceHardwareProfile {
  id: 'nodemcu-esp8266';
  mcu: 'ESP8266';
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
