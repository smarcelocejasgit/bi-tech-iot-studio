import { DeviceProfileId } from '../types/hardware';

export interface DidacticAlgorithm {
  id: string;
  profiles: DeviceProfileId[];
  title: string;
  purpose: string;
  flow: string[];
  pseudocode: string[];
  blockTypes: string[];
  image: string;
}

export const ALGORITHMS_CATALOG: DidacticAlgorithm[] = [
  {
    id: 'environment-monitoring',
    profiles: ['garden-node', 'nodemcu-esp8266'],
    title: 'Monitoreo ambiental',
    purpose: 'Observar cómo cambian la temperatura y la humedad del aire.',
    flow: ['leer ambiente', 'registrar datos', 'esperar', 'volver a medir'],
    pseudocode: ['repetir siempre', '  leer temperatura y humedad', '  registrar los valores', '  esperar antes de repetir'],
    blockTypes: ['repetir siempre', 'leer temperatura', 'leer humedad ambiente', 'registrar dato', 'esperar'],
    image: '/resources/algorithms/environment-monitoring.svg',
  },
  {
    id: 'automatic-irrigation',
    profiles: ['garden-node'],
    title: 'Riego automático',
    purpose: 'Tomar una decisión de riego a partir de una medición.',
    flow: ['leer humedad', 'comparar con umbral', 'decidir', 'activar bomba', 'esperar', 'apagar', 'volver a medir'],
    pseudocode: ['repetir siempre', '  leer humedad del suelo', '  si humedad < umbral', '    encender bomba', '    esperar', '    apagar bomba'],
    blockTypes: ['repetir siempre', 'humedad del suelo', 'si... entonces', 'encender bomba', 'esperar', 'apagar bomba'],
    image: '/resources/algorithms/automatic-irrigation.svg',
  },
  {
    id: 'observation-light',
    profiles: ['garden-node'],
    title: 'Luz de observación',
    purpose: 'Usar la luz como una acción visible del programa.',
    flow: ['leer luminosidad', 'comparar', 'decidir', 'encender o apagar luz'],
    pseudocode: ['leer nivel de luz', 'si el ambiente está oscuro', '  encender iluminación', 'si no', '  apagar iluminación'],
    blockTypes: ['nivel de luz', 'si... si no', 'encender iluminación', 'apagar iluminación'],
    image: '/resources/algorithms/observation-light.svg',
  },
  {
    id: 'bitech-channel',
    profiles: ['garden-node', 'camera-node', 'nodemcu-esp8266'],
    title: 'Canal Bi-Tech',
    purpose: 'Reunir en Smart Garden Lab los dispositivos que forman parte del mismo proyecto.',
    flow: ['elegir canal', 'programar dispositivos del prototipo', 'enviar datos', 'abrir el mismo canal en el Lab'],
    pseudocode: ['elegir un canal del 1 al 9', 'usar el mismo canal en los dispositivos del proyecto', 'abrir ese canal en Smart Garden Lab'],
    blockTypes: ['conectar a Smart Garden Lab — canal [1–9]'],
    image: '/resources/algorithms/bitech-channel.svg',
  },
  {
    id: 'camera-observation',
    profiles: ['camera-node'],
    title: 'Observación con cámara',
    purpose: 'Capturar una imagen o iniciar una observación continua.',
    flow: ['preparar cámara', 'conectar Wi-Fi', 'capturar o transmitir', 'observar en el Lab'],
    pseudocode: ['al iniciar', '  configurar cámara', '  conectar Wi-Fi', '  iniciar streaming'],
    blockTypes: ['configurar cámara', 'conectar a Wi-Fi', 'iniciar streaming', 'capturar foto'],
    image: '/resources/algorithms/camera-observation.svg',
  },
];

export function getAlgorithmsForProfile(
  profile: DeviceProfileId
): DidacticAlgorithm[] {
  return ALGORITHMS_CATALOG.filter((algorithm) =>
    algorithm.profiles.includes(profile)
  );
}
