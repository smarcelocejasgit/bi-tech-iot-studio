import {
  DEFAULT_CAMERA_WORKSPACE_XML,
  DEFAULT_GARDEN_WORKSPACE_XML,
  DEFAULT_NODEMCU_WORKSPACE_XML,
} from '../blocks/bitechBlocks';
import { DeviceProfileId } from '../types/hardware';
import { GardenSensorState, NodeMcuSensorState } from '../types/studio';

const STORAGE_KEYS = {
  projectName: 'bitech_studio_v012_project_name',
  activeDevice: 'bitech_studio_v012_active_device',
  gardenXml: 'bitech_studio_v012_garden_xml',
  cameraXml: 'bitech_studio_v012_camera_xml',
  nodemcuXml: 'bitech_studio_v03_nodemcu_xml',
};

export const INITIAL_GARDEN_SENSORS: GardenSensorState = {
  temperatura: 24,
  humedadAmbiente: 60,
  humedadSuelo: 25,
  nivelLuz: 720,
};

export const INITIAL_NODEMCU_SENSORS: NodeMcuSensorState = {
  temperatura: 25,
  humedadAmbiente: 58,
  entradaAnalogicaA0: 280,
  analogSensorLabel: 'LDR (Luz)',
  entradaDigital: 1,
};

export function loadProjectName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.projectName) || 'Riego inteligente';
  } catch {
    return 'Riego inteligente';
  }
}

export function saveProjectName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.projectName, name);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadActiveDevice(): DeviceProfileId {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.activeDevice);
    if (
      val === 'camera-node' ||
      val === 'garden-node' ||
      val === 'nodemcu-esp8266'
    ) {
      return val;
    }
    return 'garden-node';
  } catch {
    return 'garden-node';
  }
}

export function saveActiveDevice(device: DeviceProfileId): void {
  try {
    localStorage.setItem(STORAGE_KEYS.activeDevice, device);
  } catch {
    // Ignore
  }
}

function getStorageKeyForDevice(device: DeviceProfileId): string {
  switch (device) {
    case 'garden-node':
      return STORAGE_KEYS.gardenXml;
    case 'camera-node':
      return STORAGE_KEYS.cameraXml;
    case 'nodemcu-esp8266':
      return STORAGE_KEYS.nodemcuXml;
  }
}

function getDefaultXmlForDevice(device: DeviceProfileId): string {
  switch (device) {
    case 'garden-node':
      return DEFAULT_GARDEN_WORKSPACE_XML;
    case 'camera-node':
      return DEFAULT_CAMERA_WORKSPACE_XML;
    case 'nodemcu-esp8266':
      return DEFAULT_NODEMCU_WORKSPACE_XML;
  }
}

export function loadWorkspaceXml(device: DeviceProfileId): string {
  try {
    const key = getStorageKeyForDevice(device);
    const saved = localStorage.getItem(key);
    if (saved && saved.includes('<xml')) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return getDefaultXmlForDevice(device);
}

export function saveWorkspaceXml(device: DeviceProfileId, xml: string): void {
  try {
    const key = getStorageKeyForDevice(device);
    localStorage.setItem(key, xml);
  } catch {
    // Ignore
  }
}

export function resetWorkspaceXmlToDefault(device: DeviceProfileId): string {
  const defaultXml = getDefaultXmlForDevice(device);
  saveWorkspaceXml(device, defaultXml);
  return defaultXml;
}
