import type { DeviceProfileId } from '../types/hardware';
import type { SerialPortInfo } from './hardwareBridge';

export type DetectedBoardFamily =
  | 'esp32'
  | 'esp32-cam'
  | 'esp8266'
  | 'unknown';

export interface DetectedBoardInfo {
  port: SerialPortInfo;
  family: DetectedBoardFamily;
  familyLabel: string;
  displayName: string;
  usbSerialChip: string | null;
  chipModel: string | null;
  flashSize: string | null;
  suggestedProfileId: DeviceProfileId | null;
  suggestedProfileLabel: string | null;
  recommendedFqbn: string | null;
  requiresProfileSelection: boolean;
}

const PROFILE_LABELS: Record<DeviceProfileId, string> = {
  'garden-node': 'Garden Node Bi-Tech — ESP32',
  'camera-node': 'Camera Node Bi-Tech — ESP32-CAM',
  'nodemcu-esp8266': 'NodeMCU — ESP8266',
};

const PROFILE_FQBNS: Record<DeviceProfileId, string> = {
  'garden-node': 'esp32:esp32:esp32',
  'camera-node': 'esp32:esp32:esp32cam',
  'nodemcu-esp8266': 'esp8266:esp8266:nodemcuv2',
};

export function getProfileFqbn(profile: DeviceProfileId): string {
  return PROFILE_FQBNS[profile];
}

/**
 * Obtiene el nombre del puente USB-Serial únicamente desde descripciones
 * reportadas por el sistema operativo o Arduino CLI. No depende de un VID/PID
 * específico ni conserva números de serie USB.
 */
export function inferUsbSerialChip(port: SerialPortInfo): string | null {
  const source = [
    port.usbProduct,
    port.usbManufacturer,
    port.protocolLabel,
    port.label,
  ]
    .filter(Boolean)
    .join(' ');

  if (/CH9102/i.test(source)) return 'WCH CH9102';
  if (/CH34[01]/i.test(source)) return 'WCH CH340/CH341';
  if (/CP2102/i.test(source)) return 'Silicon Labs CP2102';
  if (/CP210x/i.test(source)) return 'Silicon Labs CP210x';
  if (/FT232/i.test(source)) return 'FTDI FT232';
  if (/FTDI/i.test(source)) return 'FTDI USB-Serial';
  if (/PL2303/i.test(source)) return 'Prolific PL2303';
  if (/WCH|QinHeng/i.test(source)) return 'WCH USB-Serial';
  return null;
}

function detectionText(port: SerialPortInfo): string {
  return [
    port.chipModel,
    port.usbProduct,
    port.usbManufacturer,
    ...(port.matchingBoards ?? []).flatMap((board) => [board.name, board.fqbn]),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Traduce la detección física a los tres perfiles que el Studio ya soporta.
 * ESP32-CAM sólo se selecciona cuando Arduino CLI o la metadata nombran la
 * variante de cámara de forma explícita; un chip ESP32 genérico nunca se
 * convierte en Camera Node por inferencia.
 */
export function identifyCompatibleBoard(
  port: SerialPortInfo
): DetectedBoardInfo {
  const source = detectionText(port);
  const explicitCamera =
    /ESP32[-_ ]?CAM|ESP32CAM|AI[-_ ]?THINKER/i.test(source);
  const esp8266 = /ESP8266|ESP[-_ ]?12|NODEMCU/i.test(source);
  const esp32 = /ESP32/i.test(source);
  const explicitGardenBoard = (port.matchingBoards ?? []).some(
    (board) =>
      board.fqbn.toLowerCase() === PROFILE_FQBNS['garden-node'] ||
      /ESP32 DEV MODULE/i.test(board.name)
  );

  let family: DetectedBoardFamily = 'unknown';
  let suggestedProfileId: DeviceProfileId | null = null;
  let recommendedFqbn: string | null = null;
  let displayName = 'Placa USB detectada — seleccionar perfil';

  if (explicitCamera) {
    family = 'esp32-cam';
    suggestedProfileId = 'camera-node';
    recommendedFqbn = PROFILE_FQBNS['camera-node'];
    displayName = 'Camera Node compatible';
  } else if (esp8266) {
    family = 'esp8266';
    suggestedProfileId = 'nodemcu-esp8266';
    recommendedFqbn = PROFILE_FQBNS['nodemcu-esp8266'];
    displayName = 'NodeMCU ESP8266 compatible';
  } else if (esp32) {
    family = 'esp32';
    if (explicitGardenBoard) {
      suggestedProfileId = 'garden-node';
      recommendedFqbn = PROFILE_FQBNS['garden-node'];
      displayName = 'Garden Node compatible';
    } else {
      displayName = 'Placa ESP32 detectada — seleccioná el perfil';
    }
  }

  const familyLabels: Record<DetectedBoardFamily, string> = {
    esp32: 'ESP32',
    'esp32-cam': 'ESP32-CAM',
    esp8266: 'ESP8266',
    unknown: 'Familia sin identificar',
  };

  return {
    port,
    family,
    familyLabel: familyLabels[family],
    displayName,
    usbSerialChip: inferUsbSerialChip(port),
    chipModel: port.chipModel,
    flashSize: port.flashSize,
    suggestedProfileId,
    suggestedProfileLabel: suggestedProfileId
      ? PROFILE_LABELS[suggestedProfileId]
      : null,
    recommendedFqbn,
    requiresProfileSelection: suggestedProfileId === null,
  };
}

export const SUPPORTED_DETECTION_PROFILES = (
  Object.entries(PROFILE_LABELS) as Array<[DeviceProfileId, string]>
).map(([id, label]) => ({ id, label }));
