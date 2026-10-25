import { NodeMcuHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo NodeMCU — ESP8266.
 *
 * IMPORTANTE:
 * - NodeMCU ESP8266 posee únicamente UNA entrada analógica (A0, 10 bits: 0 a 1023).
 * - Los GPIO digitales definitivos (D1, D2, D5, etc.) permanecen en `null` hasta validar el conexionado físico en laboratorio.
 * - Si un estudiante intenta utilizar dos sensores analógicos simultáneos en NodeMCU, el validador de capacidades emite una advertencia pedagógica explícita.
 */
export const NODEMCU_ESP8266_CONFIG: NodeMcuHardwareConfig = {
  id: 'nodemcu-esp8266',
  name: 'NodeMCU',
  shortBadge: 'NodeMCU — ESP8266',
  mcu: 'ESP8266',
  simulatorKind: 'nodemcu-system',
  capabilities: {
    digitalInputs: 4,
    digitalOutputs: 4,
    analogInputs: 1, // Restricción física real del ESP8266: solo 1 canal ADC (A0)
    analogResolutionBits: 10,
    analogMaxValue: 1023,
    pwmChannels: 4,
    wifi: true,
    camera: false,
    relayChannels: 1,
    compatibleSensors: [
      'temperatura',
      'humedadAmbiente',
      'entradaAnalogicaA0',
      'entradaDigital',
      'humedadSuelo',
      'nivelLuz',
    ],
    compatibleActuators: [
      'digital_output',
      'single_relay',
      'led_lighting',
    ],
    pedagogicalResourceNote:
      'NodeMCU (ESP8266) dispone de una única entrada analógica (A0). Puede leer un sensor digital DHT11 más un único sensor analógico a la vez (por ejemplo, LDR o humedad de suelo), pero no dos sensores analógicos simultáneos sin hardware adicional.',
  },
  pins: {
    dht11: {
      symbolicName: 'DHT_PIN',
      verifiedGpio: null,
      mode: 'INPUT',
      component: 'Sensor DHT11 (Temperatura y Humedad Ambiente)',
      verificationNote: 'Pendiente verificar pin digital en NodeMCU (ej. D4/GPIO2) en placa física (SP-09).',
    },
    analogA0: {
      symbolicName: 'ANALOG_A0_PIN',
      verifiedGpio: null,
      mode: 'ADC',
      component: 'Única Entrada Analógica (A0 · 0 a 1023)',
      verificationNote: 'Canal analógico único A0 del ESP8266 para sensor analógico (LDR o humedad de suelo) (SP-10).',
    },
    digitalInput: {
      symbolicName: 'ENTRADA_DIG_PIN',
      verifiedGpio: null,
      mode: 'INPUT',
      component: 'Entrada Digital (Pulsador / Sensor de nivel / Fin de carrera)',
      verificationNote: 'Pendiente verificar pin de entrada digital en NodeMCU (SP-11).',
    },
    digitalOutput: {
      symbolicName: 'SALIDA_DIG_PIN',
      verifiedGpio: null,
      mode: 'OUTPUT',
      component: 'Salida Digital de Propósito General (LED / Indicador)',
      verificationNote: 'Pendiente verificar pin de salida digital en NodeMCU (SP-12).',
    },
    relay: {
      symbolicName: 'RELAY_PIN',
      verifiedGpio: null,
      mode: 'OUTPUT',
      component: 'Módulo Relay (1 canal)',
      verificationNote: 'Pendiente verificar pin de salida y polaridad activa LOW/HIGH en NodeMCU (SP-13).',
    },
    lighting: {
      symbolicName: 'LUZ_PIN',
      verifiedGpio: null,
      mode: 'OUTPUT',
      component: 'Iluminación LED',
      verificationNote: 'Pendiente verificar pin de control de iluminación en NodeMCU (SP-14).',
    },
  },
  relayConfig: {
    polarity: 'PENDING_VERIFICATION',
    safeInitialState: {
      relay: 'OFF',
      lighting: 'OFF',
      digitalOutput: 'LOW',
    },
  },
};
