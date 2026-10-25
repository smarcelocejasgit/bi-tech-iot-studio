import { describe, expect, it } from 'vitest';
import { getCatalogForDevice } from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
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
    expect(NODEMCU_ESP8266_CONFIG.pins.dht11.verifiedGpio).toBeNull();
    expect(NODEMCU_ESP8266_CONFIG.pins.analogA0.verifiedGpio).toBeNull();
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.verifiedGpio).toBeNull();
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
