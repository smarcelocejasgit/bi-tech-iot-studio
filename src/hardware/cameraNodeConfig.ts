import { CameraNodeHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo Camera Node Bi-Tech (ESP32-CAM).
 *
 * IMPORTANTE:
 * - Programación vía USB; comunicación y streaming vía Wi-Fi.
 * - No se asume streaming por USB.
 * - Las URLs de streaming y captura no se inventan: quedan configurables hasta verificar el firmware real.
 */
export const CAMERA_NODE_CONFIG: CameraNodeHardwareConfig = {
  id: 'camera-node',
  name: 'Camera Node Bi-Tech',
  shortBadge: 'Camera Node Bi-Tech — ESP32-CAM',
  mcu: 'ESP32-CAM',
  simulatorKind: 'camera-system',
  sensor: 'OV2640',
  programmingChannel: 'USB',
  streamingChannel: 'Wi-Fi',
  streamEndpointUrl: null,
  captureEndpointUrl: null,
  defaultResolution: 'SVGA (800x600)',
  defaultQuality: 10,
  capabilities: {
    digitalInputs: 1,
    digitalOutputs: 1,
    analogInputs: 0, // Pines ocupados por cámara OV2640 y Wi-Fi
    analogResolutionBits: 12,
    analogMaxValue: 4095,
    pwmChannels: 1,
    wifi: true,
    camera: true,
    relayChannels: 0,
    compatibleSensors: [],
    compatibleActuators: ['camera_ov2640'],
    pedagogicalResourceNote:
      'La ESP32-CAM dedica casi todos sus pines físicos al bus paralelo de la cámara OV2640. Se programa por USB y transmite video/capturas por Wi-Fi.',
  },
};
