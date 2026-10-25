import { NodeMcuHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo NodeMCU — ESP8266 (V0.1.2).
 *
 * DISTINCIÓN ARQUITECTÓNICA CLAVE:
 * 1. `physicalCapabilities`: Recursos físicos reales del módulo ESP-12E / NodeMCU
 *    (9 pines GPIO digitales de propósito general D0–D8 + 1 canal analógico A0 de 10 bits 0–1023).
 * 2. `educationalAllocation`: Subconjunto estructurado que el perfil educativo habilita
 *    para evitar pines de boot-strapping críticos (GPIO0, GPIO2, GPIO15) en el trabajo áulico inicial.
 * 3. `adcInputVoltageRange: 'unverified'`: El ADC nativo del ESP8266 mide 0–1.0V, mientras que las
 *    placas NodeMCU suelen incorporar un divisor resistivo (0–3.2V/3.3V). No se asume una tensión
 *    universal hasta verificar físicamente la placa del laboratorio.
 * 4. Etiquetas de placa (`D1`, `D2`...) vs. GPIO reales (`GPIO5`, `GPIO4`...): se registran ambos
 *    sin fijar aún el cableado definitivo (`verifiedGpio: null`), proveyendo asignaciones candidatas
 *    seguras (`D1 -> GPIO5`, etc.) para generar sketches `.ino` 100 % compilables.
 */
export const NODEMCU_ESP8266_CONFIG: NodeMcuHardwareConfig = {
  id: 'nodemcu-esp8266',
  name: 'NodeMCU',
  shortBadge: 'NodeMCU — ESP8266',
  mcu: 'ESP8266',
  simulatorKind: 'nodemcu-system',
  verifiedFqbn: 'esp8266:esp8266:nodemcuv2',
  capabilities: {
    digitalInputs: 4,
    digitalOutputs: 4,
    analogInputs: 1, // Restricción física real del ESP8266: solo 1 canal ADC (A0)
    analogResolutionBits: 10,
    analogMaxValue: 1023,
    adcInputVoltageRange: 'unverified',
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
      'NodeMCU (ESP8266) posee 1 única entrada analógica física (A0, escala bruta 0–1023, rango de tensión aún no verificado en placa física). En cuanto a pines digitales, la placa ofrece 9 GPIOs utilizables (D0–D8), de los cuales el perfil educativo preconfigura un subconjunto seguro que evita fallos de arranque (boot-strap).',
    physicalCapabilities: {
      mcuModel: 'ESP8266EX (Módulo ESP-12E)',
      operatingVoltage: '3.3V',
      totalUsableGpios: 9, // D0..D8 (GPIO16, 5, 4, 0, 2, 14, 12, 13, 15)
      analogInputs: 1, // Único pin A0 (ADC0)
      analogResolutionBits: 10,
      analogMaxRawValue: 1023,
      adcInputVoltageRange: 'unverified',
      adcVoltageNote:
        'El conversor interno del chip ESP8266 opera de 0 a 1.0V. Muchas placas NodeMCU incluyen un divisor resistivo en placa para admitir hasta ~3.2V/3.3V, pero existen variantes y clones distintos. Debe verificarse en la placa real antes de conectar sensores.',
      pwmCapablePins: 9, // PWM por software en pines digitales D0–D8
      wifi: true,
      cameraInterface: false,
      physicalNotes:
        'Los pines D3 (GPIO0), D4 (GPIO2) y D8 (GPIO15) determinan el modo de arranque (boot) del ESP8266. Los pines D1 (GPIO5), D2 (GPIO4), D5 (GPIO14), D6 (GPIO12) y D7 (GPIO13) son los más seguros para sensores y actuadores en el aula.',
    },
    educationalAllocation: {
      digitalInputsExposed: 1,
      digitalOutputsExposed: 3,
      analogInputsExposed: 1,
      relayChannelsExposed: 1,
      simplificationExplanation:
        'El perfil educativo no limita físicamente la placa a 4 entradas/4 salidas: expone un conjunto didáctico preasignado (DHT11 + Entrada Digital + Relay + Iluminación + Salida Digital + A0) sobre pines seguros para evitar bloqueos de arranque por boot-strapping.',
    },
  },
  pinReferenceTable: [
    {
      boardLabel: 'D0',
      espGpioName: 'GPIO16',
      gpioNumber: 16,
      notes: 'Sin interrupciones ni I2C; alto al arrancar (WAKE).',
      safeForGeneralEducationalUse: false,
    },
    {
      boardLabel: 'D1',
      espGpioName: 'GPIO5',
      gpioNumber: 5,
      notes: 'Pin digital seguro (habitualmente SCL). Excelente para Relay.',
      safeForGeneralEducationalUse: true,
    },
    {
      boardLabel: 'D2',
      espGpioName: 'GPIO4',
      gpioNumber: 4,
      notes: 'Pin digital seguro (habitualmente SDA). Excelente para Iluminación / Relay.',
      safeForGeneralEducationalUse: true,
    },
    {
      boardLabel: 'D3',
      espGpioName: 'GPIO0',
      gpioNumber: 0,
      notes: 'Pin de boot: si está en LOW al encender, la placa entra en modo Flash y no arranca.',
      safeForGeneralEducationalUse: false,
    },
    {
      boardLabel: 'D4',
      espGpioName: 'GPIO2',
      gpioNumber: 2,
      notes: 'Pin de boot (LED integrado activo LOW): no debe forzarse a LOW en el arranque.',
      safeForGeneralEducationalUse: false,
    },
    {
      boardLabel: 'D5',
      espGpioName: 'GPIO14',
      gpioNumber: 14,
      notes: 'Pin digital seguro (SPI SCLK). Ideal para sensor DHT11 o entradas.',
      safeForGeneralEducationalUse: true,
    },
    {
      boardLabel: 'D6',
      espGpioName: 'GPIO12',
      gpioNumber: 12,
      notes: 'Pin digital seguro (SPI MISO). Ideal para Entrada Digital.',
      safeForGeneralEducationalUse: true,
    },
    {
      boardLabel: 'D7',
      espGpioName: 'GPIO13',
      gpioNumber: 13,
      notes: 'Pin digital seguro (SPI MOSI). Ideal para Salida Digital.',
      safeForGeneralEducationalUse: true,
    },
    {
      boardLabel: 'D8',
      espGpioName: 'GPIO15',
      gpioNumber: 15,
      notes: 'Pin de boot: si está en HIGH al encender, impide el arranque del ESP8266.',
      safeForGeneralEducationalUse: false,
    },
    {
      boardLabel: 'A0',
      espGpioName: 'ADC0 (TOUT)',
      gpioNumber: 'A0',
      notes: 'Única entrada analógica (escala bruta 0–1023; divisor de tensión según placa).',
      safeForGeneralEducationalUse: true,
    },
  ],
  pins: {
    dht11: {
      symbolicName: 'DHT_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'D5',
      candidateGpio: 14,
      mode: 'INPUT',
      component: 'Sensor DHT11 (Temperatura y Humedad Ambiente)',
      verificationNote:
        'Cableado definitivo pendiente. Candidato seguro para compilación: D5 → GPIO14 (SP-09).',
    },
    analogA0: {
      symbolicName: 'ANALOG_A0_PIN',
      boardLabel: 'A0',
      verifiedGpio: null,
      candidateBoardLabel: 'A0',
      candidateGpio: 'A0',
      mode: 'ADC',
      component: 'Única Entrada Analógica (A0 · escala bruta 0 a 1023)',
      verificationNote:
        'Canal analógico único A0 del ESP8266. Rango de tensión de entrada: unverified (SP-10).',
    },
    digitalInput: {
      symbolicName: 'ENTRADA_DIG_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'D6',
      candidateGpio: 12,
      mode: 'INPUT',
      component: 'Entrada Digital (Pulsador / Sensor binario)',
      verificationNote:
        'Cableado definitivo pendiente. Candidato seguro para compilación: D6 → GPIO12 (SP-11).',
    },
    digitalOutput: {
      symbolicName: 'SALIDA_DIG_PIN',
      boardLabel: 'LED_BUILTIN',
      verifiedGpio: null,
      candidateBoardLabel: 'LED_BUILTIN',
      candidateGpio: 'LED_BUILTIN',
      mode: 'OUTPUT',
      component: 'Salida Digital / LED Integrado de Placa (LED_BUILTIN)',
      verificationNote:
        'Utiliza la definición oficial de placa LED_BUILTIN para validación física inicial sin inventar GPIO (SP-12).',
    },
    relay: {
      symbolicName: 'RELAY_PIN',
      boardLabel: 'D1',
      verifiedGpio: 5,
      candidateBoardLabel: 'D1',
      candidateGpio: 5,
      mode: 'OUTPUT',
      component: 'Módulo Relay (1 canal)',
      verificationNote:
        'Pin verificado físicamente en V0.2B: D1 → GPIO5. Polaridad absoluta ACTIVE_LOW / ACTIVE_HIGH pendiente de cierre con carga conectada (SP-13).',
    },
    lighting: {
      symbolicName: 'LUZ_PIN',
      boardLabel: null,
      verifiedGpio: null,
      candidateBoardLabel: 'D2',
      candidateGpio: 4,
      mode: 'OUTPUT',
      component: 'Iluminación LED',
      verificationNote:
        'Cableado definitivo pendiente. Candidato seguro para compilación: D2 → GPIO4 (SP-14).',
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
