/**
 * Contratos tipados para los perfiles de hardware de Bi-Tech IoT Studio.
 * IMPORTANTE: No se inventan números de GPIO ni URLs de streaming no verificadas.
 */

export type DeviceProfileId = 'garden-node' | 'camera-node';

export type WorkMode = 'program' | 'simulate' | 'board';

export type RelayActivePolarity = 'ACTIVE_LOW' | 'ACTIVE_HIGH' | 'PENDING_VERIFICATION';

export interface SymbolicPinAssignment {
  /** Identificador simbólico utilizado en el código C/C++ educativo (ej. BOMBA_PIN) */
  symbolicName: string;
  /** Pin físico GPIO en el ESP32 (null hasta que se verifique en laboratorio) */
  verifiedGpio: number | null;
  /** Rol eléctrico del pin */
  mode: 'INPUT' | 'OUTPUT' | 'ADC';
  /** Descripción del componente conectado */
  component: string;
  /** Nota técnica o supuesto pendiente */
  verificationNote: string;
}

export interface GardenNodeHardwareConfig {
  id: 'garden-node';
  name: string;
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

export type CameraResolutionOption = 'QVGA (320x240)' | 'CIF (400x296)' | 'VGA (640x480)' | 'SVGA (800x600)' | 'XGA (1024x768)';

export interface CameraNodeHardwareConfig {
  id: 'camera-node';
  name: string;
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
