import { describe, expect, it } from 'vitest';
import {
  buildAssistantRequestContext,
  buildBiTechAssistantContext,
} from '../assistant/bitechAssistantContext';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { ParsedProgram } from '../types/studio';

describe('contexto mínimo y seguro del Asistente Bi-Tech', () => {
  it('describe el GPIO faltante del sensor de suelo como decisión pendiente ADC', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [],
      usedSensors: ['humedadSuelo'],
      pinSelections: [
        {
          sensor: 'humedadSuelo',
          blockId: 'soil-read',
        },
      ],
    };
    const internalContext = buildBiTechAssistantContext({
      activeDevice: 'garden-node',
      mode: 'program',
      projectName: 'Prueba pedagógica',
      parsedProgram: program,
      generatedCode: generateArduinoCode(program),
    });
    const requestContext = buildAssistantRequestContext(internalContext);

    expect(requestContext.selectedBlocks).toEqual([
      expect.objectContaining({
        component: 'humedad de suelo',
        signalType: 'señal analógica',
        requiredCapability: 'ADC',
        pin: null,
        selectionState: 'missing',
        physicalEvidence: 'not-validated',
      }),
    ]);
    expect(requestContext.programSummary).toContain('GPIO pendiente');
    expect(JSON.stringify(requestContext)).not.toContain('GPIO34');
  });

  it('no incluye sketch, XML, SSID ni contraseña en el contrato de red', () => {
    const program: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_wifi', ssid: 'AulaPrivada', password: 'clave-super-secreta' },
      ],
      loopStatements: [],
    };
    const internalContext = buildBiTechAssistantContext({
      activeDevice: 'camera-node',
      projectName: 'WiFi',
      parsedProgram: program,
      generatedCode: generateArduinoCode(program),
    });
    const serialized = JSON.stringify(buildAssistantRequestContext(internalContext));

    expect(serialized).not.toContain('AulaPrivada');
    expect(serialized).not.toContain('clave-super-secreta');
    expect(serialized).not.toContain('WIFI_PASSWORD');
    expect(serialized).not.toContain('workspaceXml');
  });
});
