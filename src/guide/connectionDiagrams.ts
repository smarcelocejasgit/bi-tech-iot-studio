import { DeviceProfileId } from '../types/hardware';
import { ComponentValidationStatus } from './componentsCatalog';

export interface ConnectionDiagram {
  id: string;
  profiles: DeviceProfileId[];
  title: string;
  summary: string;
  image: string;
  validationStatus: ComponentValidationStatus;
  validationDetail: string;
  connections: string[];
}

export const CONNECTION_DIAGRAMS: ConnectionDiagram[] = [
  {
    id: 'garden-dht11-gpio21',
    profiles: ['garden-node'],
    title: 'DHT11 → Garden Node',
    summary: 'La primera conexión ambiental validada del banco actual.',
    image: '/resources/diagrams/garden-dht11-gpio21.svg',
    validationStatus: 'validated',
    validationDetail: 'Validado en hardware con un módulo DHT11 de tres pines.',
    connections: ['VCC → 3,3 V', 'GND → GND', 'DATA / S → GPIO21'],
  },
  {
    id: 'garden-analog-sensors',
    profiles: ['garden-node'],
    title: 'Sensores de suelo y luz',
    summary: 'Conexión conceptual para las próximas mediciones analógicas.',
    image: '/resources/diagrams/garden-analog-pending.svg',
    validationStatus: 'pending',
    validationDetail: 'No se fijan GPIO hasta validar el cableado real.',
    connections: ['Humedad de suelo → entrada analógica pendiente', 'LDR → entrada analógica pendiente'],
  },
  {
    id: 'garden-actuators',
    profiles: ['garden-node'],
    title: 'Relay, bomba y LED',
    summary: 'La placa decide; el relay controla la energía de los actuadores.',
    image: '/resources/diagrams/garden-actuators-pending.svg',
    validationStatus: 'pending',
    validationDetail: 'Polaridad, fuente y GPIO deben validarse físicamente.',
    connections: ['ESP32 → entrada de control del relay', 'Relay → bomba / iluminación con fuente adecuada'],
  },
  {
    id: 'camera-module',
    profiles: ['camera-node'],
    title: 'Sensor de imagen → ESP32-CAM',
    summary: 'El sensor se integra mediante su conector flexible; no se cablea como un sensor GPIO simple.',
    image: '/resources/diagrams/camera-module.svg',
    validationStatus: 'validated',
    validationDetail: 'OV3660 y PSRAM validadas físicamente en la Camera Node actual.',
    connections: ['Sensor OV3660 → conector FPC de cámara', 'ESP32-CAM → programador USB', 'Imágenes → Wi-Fi'],
  },
  {
    id: 'nodemcu-dht11',
    profiles: ['nodemcu-esp8266'],
    title: 'DHT11 → NodeMCU',
    summary: 'Conexión del sensor ambiental en la placa compatible.',
    image: '/resources/diagrams/nodemcu-dht11.svg',
    validationStatus: 'validated',
    validationDetail: 'Perfil compatible validado en D5 / GPIO14.',
    connections: ['VCC → 3,3 V', 'GND → GND', 'DATA → D5 / GPIO14'],
  },
];

export function getConnectionDiagramsForProfile(
  profile: DeviceProfileId
): ConnectionDiagram[] {
  return CONNECTION_DIAGRAMS.filter((diagram) =>
    diagram.profiles.includes(profile)
  );
}
