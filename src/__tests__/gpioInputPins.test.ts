import * as Blockly from 'blockly';
import { describe, expect, it } from 'vitest';
import {
  getCatalogForDevice,
  parseWorkspaceToProgram,
  registerBiTechBlocks,
  setWorkspaceDeviceProfile,
} from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { getInputPinOptions } from '../hardware/hardwareCapabilities';
import { interpretProgram } from '../interpreter/programInterpreter';
import {
  evaluateGardenProgram,
  evaluateNodeMcuProgram,
} from '../simulator/programEvaluator';
import { ParsedProgram } from '../types/studio';

registerBiTechBlocks();

function gpioProgram(device: ParsedProgram['device']): ParsedProgram {
  return {
    device,
    setupStatements: [],
    loopStatements: [
      {
        kind: 'iot_publish',
        topic: 'aula/analogico',
        sensor: 'entradaAnalogicaA0',
        pin: device === 'nodemcu-esp8266' ? 'A0' : 'GPIO34',
        blockId: 'analog-input',
      },
      {
        kind: 'data_log',
        label: 'digital',
        sensor: 'entradaDigital',
        pin: device === 'nodemcu-esp8266' ? 'D6' : 'GPIO27',
        blockId: 'digital-input',
      },
    ],
  };
}

describe('selectores GPIO dependientes del perfil', () => {
  it('separa entradas analógicas y digitales del ESP32 usando la metadata del perfil', () => {
    expect(getInputPinOptions('garden-node', 'analog').map((pin) => pin.id)).toEqual([
      'GPIO34',
      'GPIO35',
    ]);
    expect(getInputPinOptions('garden-node', 'digital').map((pin) => pin.id)).toEqual([
      'GPIO4',
      'GPIO26',
      'GPIO27',
    ]);
  });

  it('mantiene A0 y la nomenclatura Dn segura en NodeMCU', () => {
    expect(getInputPinOptions('nodemcu-esp8266', 'analog').map((pin) => pin.id)).toEqual([
      'A0',
    ]);
    expect(getInputPinOptions('nodemcu-esp8266', 'digital').map((pin) => pin.id)).toEqual([
      'D1',
      'D2',
      'D5',
      'D6',
      'D7',
    ]);
  });

  it('no expone entradas genéricas ni GPIO internos de Camera Node', () => {
    expect(getInputPinOptions('camera-node', 'analog')).toEqual([]);
    expect(getInputPinOptions('camera-node', 'digital')).toEqual([]);
    const cameraBlockTypes = getCatalogForDevice('camera-node').flatMap((category) =>
      category.blocks.map((block) => block.type)
    );
    expect(cameraBlockTypes).not.toContain('bitech_sensor_analog_a0');
    expect(cameraBlockTypes).not.toContain('bitech_sensor_digital_in');
    expect(cameraBlockTypes).not.toContain('bitech_iot_send_event');
  });

  it('actualiza y normaliza el pin al cambiar el perfil activo', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    const analog = workspace.newBlock('bitech_sensor_analog_a0');
    const digital = workspace.newBlock('bitech_sensor_digital_in');

    expect(analog.getFieldValue('PIN')).toBe('GPIO34');
    expect(digital.getFieldValue('PIN')).toBe('GPIO4');

    setWorkspaceDeviceProfile(workspace, 'nodemcu-esp8266');
    expect(analog.getFieldValue('PIN')).toBe('A0');
    expect(digital.getFieldValue('PIN')).toBe('D1');
    workspace.dispose();
  });

  it('conserva explícitamente el pin al serializar y cargar el workspace', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    const send = workspace.newBlock('bitech_iot_send_event');
    send.setFieldValue('entradaAnalogicaA0', 'SENSOR');
    send.setFieldValue('GPIO35', 'PIN');

    const saved = Blockly.serialization.workspaces.save(workspace);
    const restored = new Blockly.Workspace();
    setWorkspaceDeviceProfile(restored, 'garden-node');
    Blockly.serialization.workspaces.load(saved, restored);

    const program = parseWorkspaceToProgram(restored, 'garden-node');
    expect(program.loopStatements).toEqual([
      expect.objectContaining({
        kind: 'iot_publish',
        sensor: 'entradaAnalogicaA0',
        pin: 'GPIO35',
      }),
    ]);
    workspace.dispose();
    restored.dispose();
  });

  it('persiste el pin dentro de una expresión de lectura conectada', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    const conditional = workspace.newBlock('bitech_if_else');
    const comparison = workspace.newBlock('bitech_compare');
    const analog = workspace.newBlock('bitech_sensor_analog_a0');
    analog.setFieldValue('GPIO35', 'PIN');
    conditional
      .getInput('CONDITION')
      ?.connection?.connect(comparison.outputConnection!);
    comparison.getInput('LEFT')?.connection?.connect(analog.outputConnection!);

    const saved = Blockly.serialization.workspaces.save(workspace);
    const restored = new Blockly.Workspace();
    setWorkspaceDeviceProfile(restored, 'garden-node');
    Blockly.serialization.workspaces.load(saved, restored);
    const condition = parseWorkspaceToProgram(restored, 'garden-node')
      .loopStatements[0];

    expect(condition).toMatchObject({
      kind: 'if',
      condition: {
        kind: 'comparison',
        leftPin: 'GPIO35',
        leftExpr: {
          kind: 'sensor_read',
          sensor: 'entradaAnalogicaA0',
          pin: 'GPIO35',
        },
      },
    });
    workspace.dispose();
    restored.dispose();
  });
});

describe('GPIO seleccionados en Arduino, intérprete y simulador', () => {
  it('genera analogRead, digitalRead y pinMode INPUT para ESP32', () => {
    const sketch = generateArduinoCode(gpioProgram('garden-node')).compilableSketch;
    expect(sketch).toContain('pinMode(34, INPUT);');
    expect(sketch).toContain('pinMode(27, INPUT);');
    expect(sketch).toContain('analogRead(34)');
    expect(sketch).toContain('digitalRead(27)');
  });

  it('genera A0 y etiquetas Dn consistentes para NodeMCU', () => {
    const sketch = generateArduinoCode(
      gpioProgram('nodemcu-esp8266')
    ).compilableSketch;
    expect(sketch).toContain('pinMode(A0, INPUT);');
    expect(sketch).toContain('pinMode(D6, INPUT);');
    expect(sketch).toContain('analogRead(A0)');
    expect(sketch).toContain('digitalRead(D6)');
  });

  it('explica el GPIO físico sin ocultarlo en el intérprete', () => {
    const interpretation = interpretProgram(gpioProgram('garden-node'));
    const text = interpretation.narrativeSteps
      .map((step) => step.explanation)
      .join(' ');
    expect(text).toContain('señal analógica conectada al GPIO34');
    expect(text).toContain('estado digital del GPIO27');
  });

  it('representa tipo, pin y valor simulado en cada perfil', () => {
    const garden = evaluateGardenProgram(gpioProgram('garden-node'), {
      temperatura: 24,
      humedadAmbiente: 55,
      humedadSuelo: 620,
      nivelLuz: 700,
    });
    expect(garden.inputReadings).toEqual([
      { type: 'analog', pin: 'GPIO34', value: 620 },
      { type: 'digital', pin: 'GPIO27', value: 0 },
    ]);

    const node = evaluateNodeMcuProgram(gpioProgram('nodemcu-esp8266'), {
      temperatura: 23,
      humedadAmbiente: 50,
      entradaAnalogicaA0: 512,
      analogSensorLabel: 'Potenciómetro / Genérico',
      entradaDigital: 1,
    });
    expect(node.inputReadings).toEqual([
      { type: 'analog', pin: 'A0', value: 512 },
      { type: 'digital', pin: 'D6', value: 1 },
    ]);
  });
});
