import { describe, expect, it } from 'vitest';
import { buildBiTechAssistantContext } from '../assistant/bitechAssistantContext';
import { WifiPasswordField } from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import {
  interpretProgram,
  WIFI_INTERPRETER_EXPLANATION,
} from '../interpreter/programInterpreter';
import {
  HIDDEN_WIFI_PASSWORD,
  redactWifiCredentials,
} from '../security/wifiCredentials';
import { evaluateCameraProgram } from '../simulator/programEvaluator';
import { ParsedProgram } from '../types/studio';

const TEST_PASSWORD = 'PASSWORD_PRUEBA_NO_REAL';

function wifiProgram(): ParsedProgram {
  return {
    device: 'camera-node',
    setupStatements: [
      {
        kind: 'cam_wifi',
        ssid: 'SSID_PRUEBA_"AULA"',
        password: TEST_PASSWORD,
        blockId: 'wifi-test',
      },
    ],
    loopStatements: [],
  };
}

describe('credenciales Wi-Fi del bloque', () => {
  it('mantiene la contraseña enmascarada salvo acción explícita', () => {
    const field = new WifiPasswordField(TEST_PASSWORD);

    expect(field.getValue()).toBe(TEST_PASSWORD);
    expect(field.getText()).toBe(HIDDEN_WIFI_PASSWORD);

    field.setRevealed(true);
    expect(field.getText()).toBe(TEST_PASSWORD);

    field.setRevealed(false);
    expect(field.getText()).toBe(HIDDEN_WIFI_PASSWORD);
  });

  it('genera WIFI_SSID y WIFI_PASSWORD desde el bloque con escape Arduino', () => {
    const output = generateArduinoCode(wifiProgram());

    expect(output.compilableSketch).toContain(
      'const char* WIFI_SSID = "SSID_PRUEBA_\\"AULA\\"";'
    );
    expect(output.compilableSketch).toContain(
      `const char* WIFI_PASSWORD = "${TEST_PASSWORD}";`
    );
    expect(output.compactCode).toContain(
      'conectarWiFi(WIFI_SSID, WIFI_PASSWORD);'
    );
  });

  it('no filtra la contraseña al intérprete, simulador, asistente ni vista redactada', () => {
    const program = wifiProgram();
    const generatedCode = generateArduinoCode(program);
    const interpretation = interpretProgram(program);
    const simulation = evaluateCameraProgram(program);
    const assistantContext = buildBiTechAssistantContext({
      activeDevice: 'camera-node',
      projectName: 'Prueba Wi-Fi',
      parsedProgram: program,
      generatedCode,
    });
    const redactedSketch = redactWifiCredentials(
      generatedCode.compilableSketch
    );

    expect(interpretation.narrativeSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockId: 'wifi-test',
          explanation: WIFI_INTERPRETER_EXPLANATION,
        }),
      ])
    );
    expect(JSON.stringify(interpretation)).not.toContain(TEST_PASSWORD);
    expect(simulation.wifiSsid).toBe('SSID_PRUEBA_"AULA"');
    expect(JSON.stringify(simulation)).not.toContain(TEST_PASSWORD);
    expect(JSON.stringify(assistantContext)).not.toContain(TEST_PASSWORD);
    expect(redactedSketch).not.toContain(TEST_PASSWORD);
    expect(redactedSketch).toContain(
      `const char* WIFI_PASSWORD = "${HIDDEN_WIFI_PASSWORD}";`
    );
  });

  it('usa solamente placeholders cuando los campos están vacíos', () => {
    const program = wifiProgram();
    program.setupStatements = [
      { kind: 'cam_wifi', ssid: '', password: '' },
    ];

    const sketch = generateArduinoCode(program).compilableSketch;
    expect(sketch).toContain(
      'const char* WIFI_SSID = "SSID_PENDIENTE_CONFIGURACION";'
    );
    expect(sketch).toContain(
      'const char* WIFI_PASSWORD = "PASSWORD_PENDIENTE_CONFIGURACION";'
    );
  });
});
