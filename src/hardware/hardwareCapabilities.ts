import {
  BaseDeviceHardwareProfile,
  DeviceProfileId,
  HardwareInputPinOption,
  HardwareCapabilities,
  InputPinKind,
} from '../types/hardware';
import { BlockCategoryId, SensorKey } from '../types/studio';
import { CAMERA_NODE_CONFIG } from './cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from './gardenNodeConfig';
import { NODEMCU_ESP8266_CONFIG } from './nodeMcuConfig';
import {
  getCompatiblePins,
  getSignalRequirement,
  SENSOR_SIGNAL_REQUIREMENTS,
} from './pinModel';

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
 * Devuelve exclusivamente pines de entrada permitidos por el perfil.
 * Las opciones se derivan de la metadata central de cada placa.
 */
export function getInputPinOptions(
  deviceId: DeviceProfileId,
  kind: InputPinKind
): HardwareInputPinOption[] {
  const requirement =
    kind === 'analog'
      ? SENSOR_SIGNAL_REQUIREMENTS.entradaAnalogicaA0
      : SENSOR_SIGNAL_REQUIREMENTS.entradaDigital;
  return getCompatiblePins(deviceId, requirement).map((pin) => ({
    id: pin.id,
    label: pin.label,
    arduinoExpression: pin.arduinoExpression,
    kind,
    capabilities: pin.capabilities,
  }));
}

export function getPinOptionsForSensor(
  deviceId: DeviceProfileId,
  sensor: SensorKey
): HardwareInputPinOption[] {
  const requirement = getSignalRequirement(sensor);
  const kind: InputPinKind =
    requirement.signalType === 'analog' ? 'analog' : 'digital';
  return getCompatiblePins(deviceId, requirement).map((pin) => ({
    id: pin.id,
    label: pin.label,
    arduinoExpression: pin.arduinoExpression,
    kind,
    capabilities: pin.capabilities,
  }));
}

export function resolveInputPin(
  deviceId: DeviceProfileId,
  kind: InputPinKind,
  pinId?: string
): HardwareInputPinOption | null {
  const options = getInputPinOptions(deviceId, kind);
  return options.find((pin) => pin.id === pinId) ?? null;
}

export function resolveSensorPin(
  deviceId: DeviceProfileId,
  sensor: SensorKey,
  pinId?: string
): HardwareInputPinOption | null {
  return getPinOptionsForSensor(deviceId, sensor).find(
    (pin) => pin.id === pinId
  ) ?? null;
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
