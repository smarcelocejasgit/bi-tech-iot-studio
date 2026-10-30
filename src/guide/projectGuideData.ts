import { DeviceProfileId } from '../types/hardware';
import { GUIDE_ASSETS } from './guideAssets';

export interface ProjectGuideProfile {
  name: string;
  purpose: string;
  question: string;
  build: string;
  observe: string;
  heroImage: string;
}

export const PROJECT_GUIDE_PROFILES: Record<
  DeviceProfileId,
  ProjectGuideProfile
> = {
  'garden-node': {
    name: 'Garden Node Bi-Tech — ESP32',
    purpose: 'Construir un sistema capaz de observar condiciones ambientales, interpretar datos y actuar sobre el entorno.',
    question: '¿Cómo puede un sistema tomar decisiones de cuidado a partir de datos reales del ambiente?',
    build: 'Un nodo ambiental programable que combina sensores, decisiones y acciones de riego u observación.',
    observe: 'Temperatura, humedad ambiente y, cuando se validen, suelo, luminosidad y acciones del prototipo.',
    heroImage: GUIDE_ASSETS.project.gardenNode,
  },
  'camera-node': {
    name: 'Camera Node Bi-Tech — ESP32-CAM',
    purpose: 'Observar visualmente el prototipo y comunicar imágenes mediante Wi-Fi.',
    question: '¿Qué cambios del ambiente pueden descubrirse al observar imágenes a lo largo del tiempo?',
    build: 'Una cámara programable capaz de capturar imágenes y transmitir una vista continua.',
    observe: 'La imagen real, capturas y estado de conexión de Camera Node.',
    heroImage: '/resources/components/camera-project.svg',
  },
  'nodemcu-esp8266': {
    name: 'Placa compatible — NodeMCU ESP8266',
    purpose: 'Explorar sensores, decisiones y salidas con una placa compatible de validación técnica.',
    question: '¿Cómo puede una placa pequeña convertir una medición en una acción observable?',
    build: 'Un prototipo conectado con DHT11, una entrada analógica y salidas digitales.',
    observe: 'Datos ambientales y estados producidos por el programa.',
    heroImage: '/resources/components/nodemcu.svg',
  },
};
