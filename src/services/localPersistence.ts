import {
  DEFAULT_CAMERA_WORKSPACE_XML,
  DEFAULT_GARDEN_WORKSPACE_XML,
  DEFAULT_NODEMCU_WORKSPACE_XML,
  EMPTY_WORKSPACE_XML,
} from '../blocks/bitechBlocks';
import { DeviceProfileId } from '../types/hardware';
import {
  GardenSensorState,
  NodeMcuSensorState,
  StudioProject,
} from '../types/studio';

export const STORAGE_KEYS = {
  // Claves históricas (se conservan intactas para migración sin pérdida)
  projectName: 'bitech_studio_v012_project_name',
  activeDevice: 'bitech_studio_v012_active_device',
  gardenXml: 'bitech_studio_v012_garden_xml',
  cameraXml: 'bitech_studio_v04a_camera_xml',
  nodemcuXml: 'bitech_studio_v03_nodemcu_xml',
  // Claves multi-proyecto locales
  projectsList: 'bitech_studio_v05_projects',
  activeProjectId: 'bitech_studio_v05_active_project_id',
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
    return (
      localStorage.getItem(STORAGE_KEYS.projectName) || 'Riego inteligente'
    );
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

export function getDefaultXmlForDevice(device: DeviceProfileId): string {
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

/**
 * Carga la lista de proyectos locales (`StudioProject[]`).
 * Si aún no existe la lista multi-proyecto, migra sin borrar datos previos
 * el proyecto existente (`Riego inteligente` o el que tuviera el usuario)
 * como primer `StudioProject`.
 */
export function loadStudioProjects(): StudioProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projectsList);
    if (raw) {
      const parsed = JSON.parse(raw) as StudioProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback a migración
  }

  const nowIso = new Date().toISOString();
  const legacyDevice = loadActiveDevice();
  const legacyName = loadProjectName();
  const legacyXml = loadWorkspaceXml(legacyDevice);

  const migratedProject: StudioProject = {
    id: 'proj-migrated-initial',
    name: legacyName,
    device: legacyDevice,
    workspaceXml: legacyXml,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const initialList = [migratedProject];
  saveStudioProjects(initialList);
  saveActiveProjectId(migratedProject.id);
  return initialList;
}

export function saveStudioProjects(projects: StudioProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.projectsList, JSON.stringify(projects));
  } catch {
    // Ignore quota errors
  }
}

export function loadActiveProjectId(projects?: StudioProject[]): string {
  const list = projects ?? loadStudioProjects();
  try {
    const savedId = localStorage.getItem(STORAGE_KEYS.activeProjectId);
    if (savedId && list.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch {
    // Ignore
  }
  return list[0].id;
}

export function saveActiveProjectId(projectId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.activeProjectId, projectId);
  } catch {
    // Ignore
  }
}

/**
 * Crea un proyecto nuevo con el lienzo Blockly vacío (`EMPTY_WORKSPACE_XML`),
 * sin sobrescribir ni perder los proyectos anteriores.
 */
export function createStudioProject(
  name: string,
  device: DeviceProfileId,
  existingProjects?: StudioProject[]
): { projects: StudioProject[]; created: StudioProject } {
  const currentList = existingProjects ?? loadStudioProjects();
  const nowIso = new Date().toISOString();
  const trimmedName = name.trim() || 'Proyecto sin título';

  const created: StudioProject = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    device,
    workspaceXml: EMPTY_WORKSPACE_XML,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const nextProjects = [...currentList, created];
  saveStudioProjects(nextProjects);
  saveActiveProjectId(created.id);
  return { projects: nextProjects, created };
}

/**
 * Actualiza únicamente el proyecto indicado (`projectId`) manteniendo intactos
 * todos los demás proyectos de `Mis proyectos`.
 */
export function updateStudioProjectInList(
  projects: StudioProject[],
  projectId: string,
  patch: Partial<Pick<StudioProject, 'name' | 'device' | 'workspaceXml'>>
): StudioProject[] {
  const nowIso = new Date().toISOString();
  const nextProjects = projects.map((proj) =>
    proj.id === projectId
      ? {
          ...proj,
          ...patch,
          updatedAt: nowIso,
        }
      : proj
  );
  saveStudioProjects(nextProjects);
  return nextProjects;
}

/**
 * Elimina un proyecto local por ID (conservando siempre al menos un proyecto).
 */
export function deleteStudioProjectFromList(
  projects: StudioProject[],
  projectId: string,
  currentActiveId: string
): { projects: StudioProject[]; nextActiveId: string } {
  if (projects.length <= 1) {
    return { projects, nextActiveId: currentActiveId };
  }
  const remaining = projects.filter((p) => p.id !== projectId);
  const nextActiveId =
    currentActiveId === projectId ? remaining[0].id : currentActiveId;
  saveStudioProjects(remaining);
  saveActiveProjectId(nextActiveId);
  return { projects: remaining, nextActiveId };
}
