import {
  DEFAULT_CAMERA_WORKSPACE_XML,
  DEFAULT_GARDEN_WORKSPACE_XML,
} from '../blocks/bitechBlocks';
import { DeviceProfileId } from '../types/hardware';
import { GardenSensorState } from '../types/studio';

const STORAGE_KEYS = {
  projectName: 'bitech_studio_v01_project_name',
  activeDevice: 'bitech_studio_v01_active_device',
  gardenXml: 'bitech_studio_v01_garden_xml',
  cameraXml: 'bitech_studio_v01_camera_xml',
  gardenSensors: 'bitech_studio_v01_garden_sensors',
};

export const INITIAL_GARDEN_SENSORS: GardenSensorState = {
  temperatura: 24,
  humedadAmbiente: 60,
  humedadSuelo: 25,
  nivelLuz: 720,
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
    if (val === 'camera-node' || val === 'garden-node') {
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

export function loadWorkspaceXml(device: DeviceProfileId): string {
  try {
    const key =
      device === 'garden-node' ? STORAGE_KEYS.gardenXml : STORAGE_KEYS.cameraXml;
    const saved = localStorage.getItem(key);
    if (saved && saved.includes('<xml')) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return device === 'garden-node'
    ? DEFAULT_GARDEN_WORKSPACE_XML
    : DEFAULT_CAMERA_WORKSPACE_XML;
}

export function saveWorkspaceXml(device: DeviceProfileId, xml: string): void {
  try {
    const key =
      device === 'garden-node' ? STORAGE_KEYS.gardenXml : STORAGE_KEYS.cameraXml;
    localStorage.setItem(key, xml);
  } catch {
    // Ignore
  }
}

export function resetWorkspaceXmlToDefault(device: DeviceProfileId): string {
  const defaultXml =
    device === 'garden-node'
      ? DEFAULT_GARDEN_WORKSPACE_XML
      : DEFAULT_CAMERA_WORKSPACE_XML;
  saveWorkspaceXml(device, defaultXml);
  return defaultXml;
}
