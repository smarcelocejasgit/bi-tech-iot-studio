import { DeviceProfileId } from '../types/hardware';
import { ComponentValidationStatus } from './componentsCatalog';
import { GUIDE_ASSETS } from './guideAssets';

export interface ConnectionDiagram {
  id: string;
  profiles: DeviceProfileId[];
  title: string;
  summary: string;
  image: string;
  validationStatus: ComponentValidationStatus;
  validationDetail: string;
  generalConnections: string[];
  prototypeEvidence: string[];
}

export const CONNECTION_DIAGRAMS: ConnectionDiagram[] = [
  {
    id: 'garden-dht11-gpio21',
    profiles: ['garden-node'],
    title: 'Garden Node — conexiones completas',
    summary: 'Requisitos generales, conexión validada del DHT11 y propuestas pendientes del prototipo.',
    image: GUIDE_ASSETS.connections.gardenNode,
    validationStatus: 'pending',
    validationDetail: 'La ficha combina una conexión validada con propuestas que todavía requieren validación física.',
    generalConnections: [
      'VCC → alimentación compatible (3,3 V en el prototipo)',
      'GND → GND',
      'DATA / S → GPIO digital disponible',
      'Humedad de suelo y módulo LDR: AO → GPIO con capacidad ADC',
      'Relay y LED: señal de control → GPIO digital de salida',
      'Bomba: alimentación externa adecuada y control mediante relay',
    ],
    prototypeEvidence: [
      'DHT11: conexión validada en Smart Garden Lab con DATA en GPIO21.',
      'Suelo, LDR, relay y LED: GPIO propuesto por el estudiante y pendiente de validación física.',
    ],
  },
  {
    id: 'garden-energy-system',
    profiles: ['garden-node'],
    title: 'Energía experimental del prototipo',
    summary: 'Vista conceptual de alimentación solar, almacenamiento, regulación y cargas.',
    image: GUIDE_ASSETS.connections.energySystem,
    validationStatus: 'pending',
    validationDetail: 'Es una propuesta experimental: tensión, corriente, polaridad y autonomía deben medirse antes de conectar.',
    generalConnections: [
      'Panel solar → controlador de carga compatible',
      'Controlador → batería o powerbank adecuado',
      'Regulador → ESP32 y cargas con la tensión requerida',
    ],
    prototypeEvidence: ['Sistema energético pendiente de validación física completa.'],
  },
  {
    id: 'camera-module',
    profiles: ['camera-node'],
    title: 'Camera Node — conexiones completas',
    summary: 'El sensor se integra mediante su conector flexible; no se cablea como un sensor GPIO simple.',
    image: GUIDE_ASSETS.connections.cameraNode,
    validationStatus: 'validated',
    validationDetail: 'OV3660 y PSRAM validadas físicamente en la Camera Node actual.',
    generalConnections: ['Sensor OV3660 → conector FPC de cámara', 'ESP32-CAM → programador USB', 'Imágenes → Wi-Fi'],
    prototypeEvidence: ['OV3660 y PSRAM validadas en la Camera Node actual.'],
  },
  {
    id: 'nodemcu-dht11',
    profiles: ['nodemcu-esp8266'],
    title: 'DHT11 → NodeMCU',
    summary: 'Conexión del sensor ambiental en la placa compatible.',
    image: '/resources/diagrams/nodemcu-dht11.svg',
    validationStatus: 'validated',
    validationDetail: 'Perfil compatible validado en D5 / GPIO14.',
    generalConnections: [
      'VCC → alimentación compatible',
      'GND → GND',
      'DATA → pin digital disponible',
    ],
    prototypeEvidence: [
      'Conexión validada en el prototipo NodeMCU: D5 / GPIO14',
    ],
  },
];

export function getConnectionDiagramsForProfile(
  profile: DeviceProfileId
): ConnectionDiagram[] {
  return CONNECTION_DIAGRAMS.filter((diagram) =>
    diagram.profiles.includes(profile)
  );
}
