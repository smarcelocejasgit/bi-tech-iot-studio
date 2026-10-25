import { describe, expect, it } from 'vitest';
import { getCatalogForDevice } from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import { sanitizeHardwareLog } from '../hardware/hardwareBridge';
import { getDeviceCapabilities } from '../hardware/hardwareCapabilities';
import { validateProgramAgainstCapabilities } from '../hardware/hardwareValidator';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';
import {
  CONTEXTUAL_MANUAL_ENTRIES,
  getManualEntryForDevice,
} from '../manual/contextualManualData';
import {
  evaluateCameraProgram,
  evaluateGardenProgram,
  evaluateNodeMcuProgram,
} from '../simulator/programEvaluator';
import { ParsedProgram } from '../types/studio';

describe('Bi-Tech IoT Studio V0.1.1 — Capacidades de Hardware y Perfiles', () => {
  it('mantiene los pines GPIO físicos sin inventar (null) en los 3 perfiles y estados iniciales seguros OFF', () => {
    expect(GARDEN_NODE_CONFIG.pins.dht11.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.soilMoisture.verifiedGpio).toBeNull();
    expect(NODEMCU_ESP8266_CONFIG.pins.dht11.boardLabel).toBe('D5');
    expect(NODEMCU_ESP8266_CONFIG.pins.dht11.verifiedGpio).toBe(14);
    expect(NODEMCU_ESP8266_CONFIG.pins.analogA0.boardLabel).toBe('A0');
    expect(NODEMCU_ESP8266_CONFIG.pins.analogA0.verifiedGpio).toBe('A0');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.boardLabel).toBe('D1');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.verifiedGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.relayConfig.polarity).toBe('PENDING_VERIFICATION');
    expect(NODEMCU_ESP8266_CONFIG.relayConfig.safeInitialState).toEqual({
      relay: 'OFF',
      lighting: 'OFF',
      digitalOutput: 'LOW',
    });
    expect(CAMERA_NODE_CONFIG.streamEndpointUrl).toBeNull();
  });

  it('declara correctamente las capacidades diferenciadas de ESP32, ESP32-CAM y NodeMCU ESP8266', () => {
    const gardenCaps = getDeviceCapabilities('garden-node');
    const camCaps = getDeviceCapabilities('camera-node');
    const nodemcuCaps = getDeviceCapabilities('nodemcu-esp8266');

    expect(gardenCaps.analogInputs).toBeGreaterThan(1);
    expect(nodemcuCaps.analogInputs).toBe(1);
    expect(camCaps.camera).toBe(true);
    expect(nodemcuCaps.camera).toBe(false);
    expect(nodemcuCaps.compatibleActuators).toContain('single_relay');
    expect(nodemcuCaps.compatibleActuators).toContain('digital_output');
  });

  it('filtra categorías y bloques según las capacidades del dispositivo sin condicionales dispersos', () => {
    const nodemcuCatalog = getCatalogForDevice('nodemcu-esp8266');
    const categoryIds = nodemcuCatalog.map((c) => c.id);
    expect(categoryIds).not.toContain('camara');
    expect(categoryIds).toContain('sensores');
    expect(categoryIds).toContain('actuadores');

    const actuatorBlocks =
      nodemcuCatalog.find((c) => c.id === 'actuadores')?.blocks.map((b) => b.type) ?? [];
    expect(actuatorBlocks).toContain('bitech_actuator_relay_on');
    expect(actuatorBlocks).toContain('bitech_actuator_digital_out_on');
    expect(actuatorBlocks).not.toContain('bitech_actuator_pump_on');
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Restricciones de Hardware (NodeMCU A0)', () => {
  it('emite advertencia pedagógica cuando un proyecto en NodeMCU intenta usar más de 1 entrada analógica', () => {
    const invalidNodeMcuProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [{ kind: 'relay_on' }],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'luz_on' }],
        },
      ],
    };

    const issues = validateProgramAgainstCapabilities(invalidNodeMcuProgram);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('ANALOG_INPUTS_EXCEEDED');
    expect(issues[0].message).toContain(
      'Este proyecto requiere más entradas analógicas'
    );

    const codeOut = generateArduinoCode(invalidNodeMcuProgram);
    expect(codeOut.validationIssues).toHaveLength(1);
    expect(codeOut.compactCode).toContain('ADVERTENCIA PEDAGÓGICA DE HARDWARE');
  });

  it('permite usar múltiples sensores analógicos en Garden Node (ESP32) sin advertencias', () => {
    const validEsp32Program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on' }],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'nivelLuz',
            operator: '<',
            rightNumber: 300,
          },
          thenBranch: [{ kind: 'luz_on' }],
        },
      ],
    };

    const issues = validateProgramAgainstCapabilities(validEsp32Program);
    expect(issues).toHaveLength(0);
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Generador Arduino C/C++ y Simuladores', () => {
  it('genera código Arduino C/C++ educativo para NodeMCU ESP8266', () => {
    const nodemcuProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [
            { kind: 'relay_on' },
            { kind: 'luz_on' },
            { kind: 'wait', seconds: 3 },
            { kind: 'relay_off' },
          ],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaDigital',
            operator: '==',
            rightNumber: 1,
          },
          thenBranch: [{ kind: 'digital_out_on' }],
        },
      ],
    };

    const out = generateArduinoCode(nodemcuProgram);
    expect(out.validationIssues).toHaveLength(0);
    expect(out.compactCode).toContain('pinMode(RELAY_PIN, OUTPUT);');
    expect(out.compactCode).toContain('pinMode(ENTRADA_DIG_PIN, INPUT);');
    expect(out.compactCode).toContain('int valorA0 = leerEntradaAnalogicaA0();');
    expect(out.compactCode).toContain('int estadoDigital = leerEntradaDigital();');
    expect(out.compactCode).toContain('relayOn();');
    expect(out.compactCode).toContain('activarSalidaDigital();');

    const simActive = evaluateNodeMcuProgram(nodemcuProgram, {
      temperatura: 25,
      humedadAmbiente: 58,
      entradaAnalogicaA0: 280,
      analogSensorLabel: 'LDR (Luz)',
      entradaDigital: 1,
    });
    expect(simActive.relay).toBe(true);
    expect(simActive.iluminacion).toBe(true);
    expect(simActive.salidaDigital).toBe(true);

    const simInactive = evaluateNodeMcuProgram(nodemcuProgram, {
      temperatura: 25,
      humedadAmbiente: 58,
      entradaAnalogicaA0: 650,
      analogSensorLabel: 'LDR (Luz)',
      entradaDigital: 0,
    });
    expect(simInactive.relay).toBe(false);
    expect(simInactive.iluminacion).toBe(false);
    expect(simInactive.salidaDigital).toBe(false);
  });

  it('conserva intacto el funcionamiento de Garden Node y Camera Node', () => {
    const gardenProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [
            { kind: 'bomba_on' },
            { kind: 'wait', seconds: 5 },
            { kind: 'bomba_off' },
          ],
        },
      ],
    };

    const res = evaluateGardenProgram(gardenProgram, {
      temperatura: 24,
      humedadAmbiente: 60,
      humedadSuelo: 25,
      nivelLuz: 720,
    });
    expect(res.bomba).toBe(true);

    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_init' },
        { kind: 'cam_stream_start' },
      ],
      loopStatements: [{ kind: 'cam_capture' }],
    };
    const camSim = evaluateCameraProgram(camProgram, 2, '14:32:15');
    expect(camSim.activa).toBe(true);
    expect(camSim.streaming).toBe(true);
    expect(camSim.capturas).toBe(3);
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Manual Contextual Adaptativo', () => {
  it('incluye explicaciones de limitaciones del ESP8266 cuando se selecciona NodeMCU', () => {
    expect(CONTEXTUAL_MANUAL_ENTRIES.bitech_sensor_analog_a0).toBeDefined();
    const entryOnNodeMcu = getManualEntryForDevice(
      'bitech_if_sensor_compare',
      'nodemcu-esp8266'
    );
    expect(entryOnNodeMcu.technicalNotes).toContain('NodeMCU');
  });
});

describe('Bi-Tech IoT Studio V0.1.2 — Hardware Readiness y Sketch Compilable (.ino)', () => {
  it('distingue explícitamente capacidades físicas (9 GPIO D0-D8) vs asignación educativa en NodeMCU', () => {
    const caps = getDeviceCapabilities('nodemcu-esp8266');
    expect(caps.physicalCapabilities.totalUsableGpios).toBe(9);
    expect(caps.physicalCapabilities.analogInputs).toBe(1);
    expect(caps.physicalCapabilities.analogMaxRawValue).toBe(1023);
    expect(caps.educationalAllocation.digitalInputsExposed).toBe(1);
    expect(caps.educationalAllocation.digitalOutputsExposed).toBe(3);
    expect(caps.educationalAllocation.simplificationExplanation).toContain('boot-strapping');
  });

  it('registra adcInputVoltageRange como unverified y mantiene el mapeo Etiqueta de Placa (Dx) -> GPIO real', () => {
    expect(NODEMCU_ESP8266_CONFIG.capabilities.adcInputVoltageRange).toBe('unverified');
    expect(NODEMCU_ESP8266_CONFIG.verifiedFqbn).toBe('esp8266:esp8266:nodemcuv2');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.candidateBoardLabel).toBe('D1');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.candidateGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.verifiedGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.pinReferenceTable.length).toBeGreaterThanOrEqual(10);
  });

  it('genera de forma separada la Vista educativa y el Sketch compilable (.ino) para el programa mínimo de validación', () => {
    const minValidationProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [{ kind: 'relay_off' }],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            leftExpr: { kind: 'sensor_read', sensor: 'entradaAnalogicaA0' },
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [{ kind: 'relay_on' }],
          elseBranch: [{ kind: 'relay_off' }],
        },
      ],
    };

    const output = generateArduinoCode(minValidationProgram);
    expect(output.validationIssues).toHaveLength(0);

    // 1. Vista educativa limpia y enfocada en setup() + loop()
    expect(output.compactCode).toContain('void setup()');
    expect(output.compactCode).toContain('relayOff();');
    expect(output.compactCode).toContain('if (valorA0 < 400) {');
    expect(output.compactCode).toContain('relayOn();');
    expect(output.compactCode).toContain('} else {');
    expect(output.compactCode).not.toContain('#include <Arduino.h>');

    // 2. Sketch compilable completo (.ino) sin librerías externas innecesarias
    expect(output.compilableSketch).toContain('#include <Arduino.h>');
    expect(output.compilableSketch).not.toContain('#include <ESP8266WiFi.h>');
    expect(output.compilableSketch).not.toContain('#include <DHT.h>');
    expect(output.compilableSketch).toContain('#define RELAY_PIN       5   // D1 -> GPIO5');
    expect(output.compilableSketch).toContain('#define ANALOG_A0_PIN   A0  // A0 -> A0');
    expect(output.compilableSketch).toContain('adcInputVoltageRange: unverified');
    expect(output.compilableSketch).toContain('int leerEntradaAnalogicaA0() {');
    expect(output.compilableSketch).toContain('void relayOn() {');
    expect(output.compilableSketch).toContain('void relayOff() {');

    // 3. Al utilizar bloques de temperatura y humedad ambiente, incluye <DHT.h> y dht.begin()
    const dhtProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        { kind: 'data_log', label: 'Temperatura', sensor: 'temperatura' },
        { kind: 'data_log', label: 'Humedad', sensor: 'humedadAmbiente' },
        { kind: 'wait', seconds: 2 },
      ],
    };
    const dhtOutput = generateArduinoCode(dhtProgram);
    expect(dhtOutput.compilableSketch).toContain('#include <DHT.h>');
    expect(dhtOutput.compilableSketch).toContain('DHT dht(DHT_PIN, DHT_TYPE);');
    expect(dhtOutput.compilableSketch).toContain('dht.begin();');
    expect(dhtOutput.compilableSketch).toContain('return dht.readTemperature();');
    expect(dhtOutput.compilableSketch).toContain('return dht.readHumidity();');
  });
});

describe('Bi-Tech IoT Studio V0.3 — Placa real y HardwareBridge', () => {
  it('sanitiza direcciones MAC y rutas locales en los detalles técnicos de compilación y carga', () => {
    const rawLog =
      'Chip is ESP8266EX\nMAC: 84:f3:eb:e4:13:63\nPath: C:\\Users\\Alumno\\AppData\\Local\\Arduino15\\packages';
    const clean = sanitizeHardwareLog(rawLog);
    expect(clean).toContain('MAC: [REDACTED]');
    expect(clean).not.toContain('84:f3:eb:e4:13:63');
    expect(clean).toContain('<LOCAL_USER_PATH>');
    expect(clean).not.toContain('C:\\Users\\Alumno');
  });
});
