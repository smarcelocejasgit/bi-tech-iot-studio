import { DidacticAlgorithm } from './algorithmsCatalog';
import { DidacticComponent } from './componentsCatalog';
import { ConnectionDiagram } from './connectionDiagrams';
import { DeviceProfileId } from '../types/hardware';

export type GuideResourceKind = 'component' | 'diagram' | 'algorithm';
export type GuideResourceDetailKind = 'text' | 'list' | 'flow' | 'code';

export interface GuideResourceDetail {
  title: string;
  content: string | string[];
  kind?: GuideResourceDetailKind;
}

export interface GuideResource {
  id: string;
  kind: GuideResourceKind;
  title: string;
  imageSrc: string;
  imageAlt: string;
  summary: string;
  details: GuideResourceDetail[];
  badges: string[];
  profileScope: DeviceProfileId[];
}

const PROFILE_BADGES: Record<DeviceProfileId, string> = {
  'garden-node': 'Garden Node',
  'camera-node': 'Camera Node',
  'nodemcu-esp8266': 'NodeMCU ESP8266',
};

const profileBadges = (profiles: DeviceProfileId[]): string[] =>
  profiles.map((profile) => PROFILE_BADGES[profile]);

const validationBadge = (status: 'validated' | 'pending'): string =>
  status === 'validated'
    ? 'Validado en hardware'
    : 'Pendiente de validación física';

export function componentToGuideResource(
  component: DidacticComponent
): GuideResource {
  return {
    id: component.id,
    kind: 'component',
    title: component.name,
    imageSrc: component.image,
    imageAlt: `Lámina didáctica del componente ${component.name}`,
    summary: component.whatDoes,
    badges: [
      validationBadge(component.validationStatus),
      ...profileBadges(component.profiles),
    ],
    profileScope: component.profiles,
    details: [
      { title: 'Qué es', content: component.whatIs },
      { title: 'Qué hace', content: component.whatDoes },
      { title: 'Dato o acción', content: component.dataOrAction },
      {
        title: 'Características técnicas',
        content: component.powerInterface,
      },
      {
        title: 'Evidencia de hardware',
        content: component.validationDetail,
      },
    ],
  };
}

export function diagramToGuideResource(
  diagram: ConnectionDiagram
): GuideResource {
  return {
    id: diagram.id,
    kind: 'diagram',
    title: diagram.title,
    imageSrc: diagram.image,
    imageAlt: `Diagrama de conexiones: ${diagram.title}`,
    summary: diagram.summary,
    badges: [
      validationBadge(diagram.validationStatus),
      ...profileBadges(diagram.profiles),
    ],
    profileScope: diagram.profiles,
    details: [
      {
        title: 'Conexiones y referencias',
        content: diagram.connections,
        kind: 'list',
      },
      {
        title: 'Estado de validación',
        content: diagram.validationDetail,
      },
    ],
  };
}

export function algorithmToGuideResource(
  algorithm: DidacticAlgorithm
): GuideResource {
  return {
    id: algorithm.id,
    kind: 'algorithm',
    title: algorithm.title,
    imageSrc: algorithm.image,
    imageAlt: `Lámina del algoritmo ${algorithm.title}`,
    summary: algorithm.purpose,
    badges: ['Algoritmo', ...profileBadges(algorithm.profiles)],
    profileScope: algorithm.profiles,
    details: [
      {
        title: 'Recorrido del algoritmo',
        content: algorithm.flow,
        kind: 'flow',
      },
      {
        title: 'Pseudocódigo sencillo',
        content: algorithm.pseudocode,
        kind: 'code',
      },
      {
        title: 'Relación con Blockly',
        content: algorithm.blockTypes,
        kind: 'list',
      },
    ],
  };
}
