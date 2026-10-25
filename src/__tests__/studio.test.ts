import { describe, expect, it } from 'vitest';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import { CONTEXTUAL_MANUAL_ENTRIES } from '../manual/contextualManualData';
import {
  evaluateCameraProgram,
  evaluateGardenProgram,
} from '../simulator/programEvaluator';
import { ParsedProgram } from '../types/studio';

describe('Bi-Tech IoT Studio V0.1 — Hardware & Seguridad', () => {
  it('mantiene los pines GPIO físicos sin inventar (null) y estado inicial seguro OFF', () => {
    expect(GARDEN_NODE_CONFIG.pins.dht11.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.soilMoisture.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.ldr.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.relayChannel1Pump.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.relayChannel2Light.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.relayConfig.safeInitialState).toEqual({
      pump: 'OFF',
      light: 'OFF',
    });
  });

  it('mantiene Camera Node con programación USB, streaming Wi-Fi y URL sin inventar', () => {
    expect(CAMERA_NODE_CONFIG.programmingChannel).toBe('USB');
    expect(CAMERA_NODE_CONFIG.streamingChannel).toBe('Wi-Fi');
    expect(CAMERA_NODE_CONFIG.streamEndpointUrl).toBeNull();
  });
});

describe('Bi-Tech IoT Studio V0.1 — Generador Arduino C/C++', () => {
  const gardenProgram: ParsedProgram = {
    device: 'garden-node',
    setupStatements: [],
    loopStatements: [
      {
        kind: 'if',
        blockId: 'b1',
        condition: {
          kind: 'comparison',
          leftSensor: 'humedadSuelo',
          operator: '<',
          rightNumber: 30,
        },
        thenBranch: [
          { kind: 'bomba_on', blockId: 'b2' },
          { kind: 'wait', seconds: 5, blockId: 'b3' },
          { kind: 'bomba_off', blockId: 'b4' },
        ],
      },
    ],
  };

  it('genera código Arduino C/C++ educativo para Garden Node', () => {
    const out = generateArduinoCode(gardenProgram);
    expect(out.compactCode).toContain('pinMode(BOMBA_PIN, OUTPUT);');
    expect(out.compactCode).toContain('pinMode(LUZ_PIN, OUTPUT);');
    expect(out.compactCode).toContain('int suelo = leerHumedadSuelo();');
    expect(out.compactCode).toContain('if (suelo < 30) {');
    expect(out.compactCode).toContain('bombaOn();');
    expect(out.compactCode).toContain('delay(5000);');
    expect(out.compactCode).toContain('bombaOff();');
  });

  it('genera código Arduino C/C++ educativo para Camera Node', () => {
    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_resolution', resolution: 'SVGA (800x600)' },
        { kind: 'cam_quality', quality: 10 },
        { kind: 'cam_init' },
        { kind: 'cam_stream_start' },
      ],
      loopStatements: [{ kind: 'cam_capture' }],
    };

    const out = generateArduinoCode(camProgram);
    expect(out.compactCode).toContain('configurarCamara();');
    expect(out.compactCode).toContain('seleccionarResolucion("SVGA (800x600)");');
    expect(out.compactCode).toContain('configurarCalidad(10);');
    expect(out.compactCode).toContain('iniciarCamara();');
    expect(out.compactCode).toContain('iniciarStreaming();');
    expect(out.compactCode).toContain('tomarCaptura();');
  });
});

describe('Bi-Tech IoT Studio V0.1 — Simulador Pedagógico Reactivo', () => {
  const sampleProgram: ParsedProgram = {
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
      {
        kind: 'if',
        condition: {
          kind: 'comparison',
          leftSensor: 'nivelLuz',
          operator: '<',
          rightNumber: 300,
        },
        thenBranch: [{ kind: 'luz_on' }],
        elseBranch: [{ kind: 'luz_off' }],
      },
    ],
  };

  it('activa la bomba cuando humedad del suelo es 25 (< 30) y explica el comportamiento', () => {
    const res = evaluateGardenProgram(sampleProgram, {
      temperatura: 24,
      humedadAmbiente: 60,
      humedadSuelo: 25,
      nivelLuz: 720,
    });
    expect(res.bomba).toBe(true);
    expect(res.iluminacion).toBe(false);
    expect(res.explanation).toBe(
      'El suelo está por debajo de 30: el programa activa la bomba.'
    );
  });

  it('apaga la bomba cuando humedad del suelo sube a 50 y enciende la luz si nivelLuz baja a 200', () => {
    const res = evaluateGardenProgram(sampleProgram, {
      temperatura: 24,
      humedadAmbiente: 60,
      humedadSuelo: 50,
      nivelLuz: 200,
    });
    expect(res.bomba).toBe(false);
    expect(res.iluminacion).toBe(true);
  });

  it('simula correctamente los estados de Camera Node según los bloques del programa', () => {
    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_resolution', resolution: 'SVGA (800x600)' },
        { kind: 'cam_quality', quality: 10 },
        { kind: 'cam_init' },
        { kind: 'cam_wifi', ssid: 'Red_Escolar' },
        { kind: 'cam_stream_start' },
      ],
      loopStatements: [{ kind: 'cam_capture' }],
    };

    const sim = evaluateCameraProgram(camProgram, 3, '14:32:15');
    expect(sim.activa).toBe(true);
    expect(sim.resolucion).toBe('SVGA (800x600)');
    expect(sim.calidad).toBe(10);
    expect(sim.streaming).toBe(true);
    expect(sim.capturas).toBe(4);
    expect(sim.ultimaCaptura).toBe('14:32:15');
  });
});

describe('Bi-Tech IoT Studio V0.1 — Manual Contextual', () => {
  it('incluye fichas pedagógicas completas para bloques de Garden Node y Camera Node', () => {
    expect(CONTEXTUAL_MANUAL_ENTRIES.bitech_if_sensor_compare).toBeDefined();
    expect(CONTEXTUAL_MANUAL_ENTRIES.bitech_sensor_soil.technicalNotes).toContain(
      'porcentaje'
    );
    expect(CONTEXTUAL_MANUAL_ENTRIES.bitech_cam_stream_start.arduinoCode).toBe(
      'iniciarStreaming();'
    );
  });
});
