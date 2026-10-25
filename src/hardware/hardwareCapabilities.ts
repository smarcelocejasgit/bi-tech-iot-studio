import {
  BaseDeviceHardwareProfile,
  DeviceProfileId,
  HardwareCapabilities,
} from '../types/hardware';
import { BlockCategoryId, SensorKey } from '../types/studio';
import { CAMERA_NODE_CONFIG } from './cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from './gardenNodeConfig';
import { NODEMCU_ESP8266_CONFIG } from './nodeMcuConfig';

/**
 * Registro centralizado de perfiles de hardware.
 * Evita condicionales dispersos (ej. `if device === 'nodemcu'`) en la interfaz:
 * toda consulta sobre qué categorías, sensores, actuadores o límites aplican
 * se resuelve consultando las capacidades declaradas por el perfil activo.
 */
export const HARDWARE_PROFILES_REGISTRY: Record<
  DeviceProfileId,
  BaseDeviceHardwareProfile
> = {
  'garden-node': GARDEN_NODE_CONFIG,
  'camera-node': CAMERA_NODE_CONFIG,
  'nodemcu-esp8266': NODEMCU_ESP8266_CONFIG,
};

export const ALL_DEVICE_PROFILES: BaseDeviceHardwareProfile[] = [
  GARDEN_NODE_CONFIG,
  CAMERA_NODE_CONFIG,
  NODEMCU_ESP8266_CONFIG,
];

export function getDeviceProfile(
  deviceId: DeviceProfileId
): BaseDeviceHardwareProfile {
  return HARDWARE_PROFILES_REGISTRY[deviceId] ?? GARDEN_NODE_CONFIG;
}

export function getDeviceCapabilities(
  deviceId: DeviceProfileId
): HardwareCapabilities {
  return getDeviceProfile(deviceId).capabilities;
}

/**
 * Determina si una categoría de bloques está habilitada según las capacidades
 * declaradas por el dispositivo.
 */
export function isCategorySupportedByCapabilities(
  categoryId: BlockCategoryId,
  capabilities: HardwareCapabilities
): boolean {
  switch (categoryId) {
    case 'inicio':
    case 'control':
    case 'datos':
    case 'iot':
      return true;
    case 'camara':
      return capabilities.camera;
    case 'sensores':
      return capabilities.compatibleSensors.length > 0;
    case 'actuadores':
      return (
        capabilities.compatibleActuators.filter((a) => a !== 'camera_ov2640')
          .length > 0
      );
  }
}

/**
 * Identifica cuáles sensores del modelo utilizan un canal de entrada analógica (ADC).
 * En NodeMCU (ESP8266), `analogInputs === 1`, por lo que usar más de un tipo
 * de sensor analógico distinto en el mismo programa excede la capacidad física de A0.
 */
export const ANALOG_SENSOR_KEYS: ReadonlySet<SensorKey> = new Set<SensorKey>([
  'humedadSuelo',
  'nivelLuz',
  'entradaAnalogicaA0',
]);

export function isAnalogSensorKey(sensor: SensorKey): boolean {
  return ANALOG_SENSOR_KEYS.has(sensor);
}
