import { GardenNodeHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo Garden Node Bi-Tech (ESP32).
 */
export const GARDEN_NODE_CONFIG: GardenNodeHardwareConfig = {
  id: 'garden-node',
  name: 'Garden Node Bi-Tech',
  shortBadge: 'Garden Node Bi-Tech — ESP32',
  mcu: 'ESP32',
  simulatorKind: 'garden-system',
  verifiedFqbn: 'esp32:esp32:esp32',
  capabilities: {
    digitalInputs: 6,
    digitalOutputs: 6,
    analogInputs: 4,
    analogResolutionBits: 12,
    analogMaxValue: 4095,
    adcInputVoltageRange: '0-3.3V',
    pwmChannels: 8,
    wifi: true,
    camera: false,
    relayChannels: 2,
    compatibleSensors: [
      'temperatura',
      'humedadAmbiente',
      'humedadSuelo',
      'nivelLuz',
      'entradaAnalogicaA0',
      'entradaDigital',
    ],
    compatibleActuators: ['water_pump', 'led_lighting'],
    pedagogicalResourceNote:
      'El ESP32 del Garden Node dispone de múltiples canales analógicos (ADC1) que permiten leer humedad del suelo y nivel de luz simultáneamente, además de controlar un relay de 2 canales.',
    physicalCapabilities: {
      mcuModel: 'ESP32-WROOM-32',
      operatingVoltage: '3.3V',
      totalUsableGpios: 22,
      analogInputs: 6, // 6 canales en ADC1 compatibles con Wi-Fi activo
      analogResolutionBits: 12,
      analogMaxRawValue: 4095,
      adcInputVoltageRange: '0-3.3V',
      adcVoltageNote: 'ADC1 de 12 bits (0–3.3V con atenuación de 11dB).',
      pwmCapablePins: 16,
      wifi: true,
      cameraInterface: false,
      physicalNotes: 'Múltiples canales ADC1 permiten conectar varios sensores analógicos a la vez.',
    },
    educationalAllocation: {
      digitalInputsExposed: 2,
      digitalOutputsExposed: 2,
      analogInputsExposed: 2,
      relayChannelsExposed: 2,
      simplificationExplanation:
        'El perfil educativo del Smart Garden Lab preasigna DHT11, Humedad de Suelo, LDR y 2 canales de Relay (Bomba e Iluminación).',
    },
  },
  pins: {
    dht11: {
      symbolicName: 'DHT_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'GPIO4',
      candidateGpio: 4,
      mode: 'INPUT',
      component: 'Sensor DHT11 (Temperatura y Humedad Ambiente)',
      verificationNote: 'Pendiente verificar GPIO digital asignado en placa física (SP-01).',
    },
    soilMoisture: {
      symbolicName: 'SUELO_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'GPIO34',
      candidateGpio: 34,
      mode: 'ADC',
      component: 'Sensor de Humedad del Suelo',
      verificationNote:
        'Pendiente verificar canal ADC1 compatible con Wi-Fi y calibración en seco/húmedo (SP-02, SP-06).',
    },
    ldr: {
      symbolicName: 'LDR_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'GPIO35',
      candidateGpio: 35,
      mode: 'ADC',
      component: 'Sensor de Luz (LDR)',
      verificationNote: 'Pendiente verificar canal ADC1 asignado en placa física (SP-03).',
    },
    relayChannel1Pump: {
      symbolicName: 'BOMBA_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'GPIO26',
      candidateGpio: 26,
      mode: 'OUTPUT',
      component: 'Relay Canal 1 -> Bomba de Agua',
      verificationNote: 'Pendiente verificar GPIO de salida seguro en arranque (SP-04).',
    },
    relayChannel2Light: {
      symbolicName: 'LUZ_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'GPIO27',
      candidateGpio: 27,
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
