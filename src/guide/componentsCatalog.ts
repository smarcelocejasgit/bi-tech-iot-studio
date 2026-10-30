import { DeviceProfileId } from '../types/hardware';
import { GUIDE_ASSETS } from './guideAssets';

export type ComponentValidationStatus = 'validated' | 'pending';

export interface DidacticComponent {
  id: string;
  profiles: DeviceProfileId[];
  name: string;
  image: string;
  whatIs: string;
  whatDoes: string;
  dataOrAction: string;
  powerInterface: string;
  validationStatus: ComponentValidationStatus;
  validationDetail: string;
}

export const COMPONENTS_CATALOG: DidacticComponent[] = [
  {
    id: 'esp32',
    profiles: ['garden-node'],
    name: 'ESP32 DevKit',
    image: GUIDE_ASSETS.components.esp32Devkit,
    whatIs: 'La placa que ejecuta el programa del Garden Node.',
    whatDoes: 'Lee sensores, toma decisiones y controla salidas.',
    dataOrAction: 'Procesa datos y coordina las acciones del prototipo.',
    powerInterface: 'USB / 5 V; lógica interna de 3,3 V; Wi-Fi integrado.',
    validationStatus: 'validated',
    validationDetail: 'ESP32-D0WD-V3 validada en el banco actual.',
  },
  {
    id: 'dht11',
    profiles: ['garden-node', 'nodemcu-esp8266'],
    name: 'DHT11',
    image: GUIDE_ASSETS.components.dht11,
    whatIs:
      'Un sensor digital que comunica temperatura y humedad mediante un protocolo temporizado sobre una línea DATA.',
    whatDoes: 'Observa dos condiciones ambientales con un único módulo.',
    dataOrAction: 'Produce temperatura en °C y humedad relativa en %.',
    powerInterface:
      'Alimentación compatible · GND · DATA en un GPIO digital disponible.',
    validationStatus: 'validated',
    validationDetail:
      'Garden Node fue validado en GPIO21 y NodeMCU en D5/GPIO14. Son conexiones del prototipo, no las únicas posibles.',
  },
  {
    id: 'soil-moisture',
    profiles: ['garden-node'],
    name: 'Humedad de suelo',
    image: GUIDE_ASSETS.components.soilMoisture,
    whatIs: 'Una sonda que permite estimar cuánta humedad hay en el sustrato.',
    whatDoes: 'Entrega una lectura que puede compararse con un umbral.',
    dataOrAction: 'Produce un valor analógico que requiere calibración.',
    powerInterface:
      'Alimentación · GND · AO hacia un GPIO con capacidad ADC.',
    validationStatus: 'pending',
    validationDetail: 'Pendiente de conexión y calibración física.',
  },
  {
    id: 'ldr',
    profiles: ['garden-node'],
    name: 'Módulo LDR',
    image: GUIDE_ASSETS.components.ldrModule,
    whatIs: 'Un módulo cuya respuesta cambia con la cantidad de luz.',
    whatDoes: 'Permite comparar ambientes más claros u oscuros.',
    dataOrAction: 'Produce un valor analógico de luminosidad relativa.',
    powerInterface:
      'Divisor resistivo · AO hacia un GPIO con capacidad ADC.',
    validationStatus: 'pending',
    validationDetail: 'Pendiente de validación física.',
  },
  {
    id: 'relay',
    profiles: ['garden-node', 'nodemcu-esp8266'],
    name: 'Relay de 1 canal',
    image: GUIDE_ASSETS.components.relayOneChannel,
    whatIs: 'Un interruptor controlado por la placa.',
    whatDoes: 'Separa la señal de control de la carga que se enciende o apaga.',
    dataOrAction: 'Controla una acción: activar o desactivar una salida.',
    powerInterface: 'Entrada digital de control; polaridad y GPIO pendientes.',
    validationStatus: 'pending',
    validationDetail: 'Pendiente de validación física con la carga real.',
  },
  {
    id: 'pump',
    profiles: ['garden-node'],
    name: 'Bomba de agua 5 V',
    image: GUIDE_ASSETS.components.waterPump5v,
    whatIs: 'El actuador que mueve agua en el sistema de riego.',
    whatDoes: 'Convierte una decisión del programa en una acción física.',
    dataOrAction: 'Acción controlada: riego encendido o apagado.',
    powerInterface: 'Fuente externa y relay; conexión final pendiente.',
    validationStatus: 'pending',
    validationDetail: 'Pendiente de validación física del circuito completo.',
  },
  {
    id: 'led',
    profiles: ['garden-node'],
    name: 'LED de observación',
    image: GUIDE_ASSETS.components.observationLed,
    whatIs: 'Una fuente de luz para señalización u observación.',
    whatDoes: 'Hace visible una acción decidida por el programa.',
    dataOrAction: 'Acción controlada: luz encendida o apagada.',
    powerInterface: 'Salida digital con resistencia o relay; GPIO pendiente.',
    validationStatus: 'pending',
    validationDetail: 'Pendiente de validación física.',
  },
  {
    id: 'esp32-cam',
    profiles: ['camera-node'],
    name: 'ESP32-CAM',
    image: GUIDE_ASSETS.components.esp32CamOv3660,
    whatIs: 'Una placa ESP32 preparada para trabajar con una cámara.',
    whatDoes: 'Captura imágenes y las transmite por Wi-Fi.',
    dataOrAction: 'Produce fotografías JPEG y video MJPEG.',
    powerInterface: '5 V por programador USB; lógica de 3,3 V; Wi-Fi.',
    validationStatus: 'validated',
    validationDetail: 'Placa, PSRAM, Wi-Fi y captura validados.',
  },
  {
    id: 'ov2640',
    profiles: ['camera-node'],
    name: 'OV2640',
    image: '/resources/components/ov2640.svg',
    whatIs: 'Un sensor de imagen compatible con muchas placas ESP32-CAM.',
    whatDoes: 'Convierte la luz en una imagen digital.',
    dataOrAction: 'Produce cuadros de imagen; requiere configuración propia.',
    powerInterface: 'Conector flexible de cámara; sin GPIO educativo libre.',
    validationStatus: 'pending',
    validationDetail: 'No validado en la Camera Node del banco actual.',
  },
  {
    id: 'ov3660',
    profiles: ['camera-node'],
    name: 'OV3660',
    image: GUIDE_ASSETS.components.esp32CamOv3660,
    whatIs: 'El sensor de imagen instalado en la Camera Node validada.',
    whatDoes: 'Captura imágenes con ajustes propios de orientación y color.',
    dataOrAction: 'Produce JPEG y streaming MJPEG.',
    powerInterface: 'Conector flexible integrado a ESP32-CAM.',
    validationStatus: 'validated',
    validationDetail: 'PID 0x3660, VGA 640×480 y streaming validados.',
  },
  {
    id: 'wifi',
    profiles: ['camera-node'],
    name: 'Wi-Fi',
    image: '/resources/components/wifi.svg',
    whatIs: 'La comunicación inalámbrica integrada en la placa.',
    whatDoes: 'Permite enviar capturas y video hacia el laboratorio.',
    dataOrAction: 'Comunica imágenes y estado de conexión.',
    powerInterface: 'Interfaz inalámbrica integrada; no requiere cable de datos.',
    validationStatus: 'validated',
    validationDetail: 'Conexión y transmisión local validadas.',
  },
  {
    id: 'nodemcu',
    profiles: ['nodemcu-esp8266'],
    name: 'NodeMCU ESP8266',
    image: '/resources/components/nodemcu.svg',
    whatIs: 'Una placa compatible utilizada como banco técnico educativo.',
    whatDoes: 'Lee entradas, controla salidas y se conecta por Wi-Fi.',
    dataOrAction: 'Procesa sensores y acciones con una sola entrada analógica A0.',
    powerInterface: 'USB / 5 V; lógica interna de 3,3 V.',
    validationStatus: 'validated',
    validationDetail: 'Placa compatible validada para programación básica.',
  },
];

export function getComponentsForProfile(
  profile: DeviceProfileId
): DidacticComponent[] {
  return COMPONENTS_CATALOG.filter((component) =>
    component.profiles.includes(profile)
  );
}
