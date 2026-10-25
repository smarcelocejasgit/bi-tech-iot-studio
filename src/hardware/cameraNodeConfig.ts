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
  mcu: 'ESP32-CAM',
  sensor: 'OV2640',
  programmingChannel: 'USB',
  streamingChannel: 'Wi-Fi',
  streamEndpointUrl: null,
  captureEndpointUrl: null,
  defaultResolution: 'SVGA (800x600)',
  defaultQuality: 10,
};
