import { GardenNodeHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo Garden Node Bi-Tech (ESP32).
 *
 * IMPORTANTE:
 * - Los números de GPIO físicos permanecen en `null` (pendientes de verificación en laboratorio).
 * - El generador de código utiliza las constantes simbólicas (`BOMBA_PIN`, `LUZ_PIN`, etc.).
 * - El estado seguro inicial al arrancar el sistema es siempre OFF para ambos canales del relay.
 */
export const GARDEN_NODE_CONFIG: GardenNodeHardwareConfig = {
  id: 'garden-node',
  name: 'Garden Node Bi-Tech',
  shortBadge: 'Garden Node Bi-Tech — ESP32',
  mcu: 'ESP32',
  simulatorKind: 'garden-system',
  capabilities: {
    digitalInputs: 6,
    digitalOutputs: 6,
    analogInputs: 4, // Múltiples canales en ADC1 compatibles con Wi-Fi
    analogResolutionBits: 12,
    analogMaxValue: 4095,
    pwmChannels: 8,
    wifi: true,
    camera: false,
    relayChannels: 2,
    compatibleSensors: [
      'temperatura',
      'humedadAmbiente',
      'humedadSuelo',
      'nivelLuz',
    ],
    compatibleActuators: ['water_pump', 'led_lighting'],
    pedagogicalResourceNote:
      'El ESP32 del Garden Node dispone de múltiples canales analógicos (ADC1) que permiten leer humedad del suelo y nivel de luz simultáneamente, además de controlar un relay de 2 canales.',
  },
  pins: {
    dht11: {
      symbolicName: 'DHT_PIN',
      verifiedGpio: null,
      mode: 'INPUT',
      component: 'Sensor DHT11 (Temperatura y Humedad Ambiente)',
      verificationNote: 'Pendiente verificar GPIO digital asignado en placa física (SP-01).',
    },
    soilMoisture: {
      symbolicName: 'SUELO_PIN',
      verifiedGpio: null,
      mode: 'ADC',
      component: 'Sensor de Humedad del Suelo',
      verificationNote:
        'Pendiente verificar canal ADC1 compatible con Wi-Fi y calibración en seco/húmedo (SP-02, SP-06).',
    },
    ldr: {
      symbolicName: 'LDR_PIN',
      verifiedGpio: null,
      mode: 'ADC',
      component: 'Sensor de Luz (LDR)',
      verificationNote: 'Pendiente verificar canal ADC1 asignado en placa física (SP-03).',
    },
    relayChannel1Pump: {
      symbolicName: 'BOMBA_PIN',
      verifiedGpio: null,
      mode: 'OUTPUT',
      component: 'Relay Canal 1 -> Bomba de Agua',
      verificationNote: 'Pendiente verificar GPIO de salida seguro en arranque (SP-04).',
    },
    relayChannel2Light: {
      symbolicName: 'LUZ_PIN',
      verifiedGpio: null,
      mode: 'OUTPUT',
      component: 'Relay Canal 2 -> Iluminación LED',
      verificationNote: 'Pendiente verificar GPIO de salida seguro en arranque (SP-04).',
    },
  },
  relayConfig: {
    polarity: 'PENDING_VERIFICATION',
    safeInitialState: {
      pump: 'OFF',
      light: 'OFF',
    },
  },
};
