import * as Blockly from 'blockly';
import { describe, expect, it } from 'vitest';
import {
  getCatalogForDevice,
  parseWorkspaceToProgram,
  registerBiTechBlocks,
  setWorkspaceDeviceProfile,
} from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import {
  getInputPinOptions,
  getPinOptionsForSensor,
} from '../hardware/hardwareCapabilities';
import {
  bindingsFromPin,
  evaluatePinSelection,
  getSelectedPinId,
  getSignalRequirement,
  UNSELECTED_PIN_ID,
} from '../hardware/pinModel';
import {
  getSelectedBlockPinFeedback,
  validateProgramAgainstCapabilities,
} from '../hardware/hardwareValidator';
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
      'GPIO34',
      'GPIO35',
      'GPIO4',
      'GPIO21',
      'GPIO26',
      'GPIO27',
    ]);
    expect(
      getPinOptionsForSensor('garden-node', 'temperatura').map((pin) => pin.id)
    ).toEqual(['GPIO4', 'GPIO21', 'GPIO26', 'GPIO27']);
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

  it('no decide un pin y conserva el estado vacío al cambiar de perfil', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    const analog = workspace.newBlock('bitech_sensor_analog_a0');
    const digital = workspace.newBlock('bitech_sensor_digital_in');

    expect(analog.getFieldValue('PIN')).toBe(UNSELECTED_PIN_ID);
    expect(digital.getFieldValue('PIN')).toBe(UNSELECTED_PIN_ID);

    setWorkspaceDeviceProfile(workspace, 'nodemcu-esp8266');
    expect(analog.getFieldValue('PIN')).toBe(UNSELECTED_PIN_ID);
    expect(digital.getFieldValue('PIN')).toBe(UNSELECTED_PIN_ID);
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
        bindings: [{ role: 'AO', pinId: 'GPIO35' }],
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
          bindings: [{ role: 'AO', pinId: 'GPIO35' }],
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
    expect(text).toContain('señal analógica');
    expect(text).toContain('Elegiste GPIO34, que admite lectura ADC');
    expect(text).toContain('señal digital simple');
    expect(text).toContain('Elegiste GPIO27');
  });

  it('representa tipo, pin y valor simulado en cada perfil', () => {
    const garden = evaluateGardenProgram(gpioProgram('garden-node'), {
      temperatura: 24,
      humedadAmbiente: 55,
      humedadSuelo: 620,
      nivelLuz: 700,
    });
    expect(garden.inputReadings).toEqual([
      expect.objectContaining({
        component: 'Entrada analógica',
        signalType: 'analog',
        role: 'AO',
        pin: 'GPIO34',
        value: 620,
      }),
      expect.objectContaining({
        component: 'Entrada digital',
        signalType: 'digital-simple',
        role: 'DATA',
        pin: 'GPIO27',
        value: 0,
      }),
    ]);

    const node = evaluateNodeMcuProgram(gpioProgram('nodemcu-esp8266'), {
      temperatura: 23,
      humedadAmbiente: 50,
      entradaAnalogicaA0: 512,
      analogSensorLabel: 'Potenciómetro / Genérico',
      entradaDigital: 1,
    });
    expect(node.inputReadings).toEqual([
      expect.objectContaining({ pin: 'A0', value: 512 }),
      expect.objectContaining({ pin: 'D6', value: 1 }),
    ]);
  });
});

describe('modelo pedagógico de capacidades y señales', () => {
  it('expone selector vacío en todos los bloques de sensores físicos', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    for (const type of [
      'bitech_sensor_soil',
      'bitech_sensor_light',
      'bitech_sensor_analog_a0',
      'bitech_sensor_digital_in',
      'bitech_sensor_temp',
      'bitech_sensor_humidity',
    ]) {
      expect(workspace.newBlock(type).getFieldValue('PIN')).toBe(
        UNSELECTED_PIN_ID
      );
    }
    workspace.dispose();
  });

  it('actualiza el feedback contextual desde la selección persistida del bloque', () => {
    const workspace = new Blockly.Workspace();
    setWorkspaceDeviceProfile(workspace, 'garden-node');
    const block = workspace.newBlock('bitech_sensor_analog_a0');
    block.setFieldValue('GPIO34', 'PIN');
    const program = parseWorkspaceToProgram(workspace, 'garden-node');

    expect(getSelectedBlockPinFeedback(program, block.id)).toEqual([
      '✓ GPIO34 admite lectura analógica mediante ADC.',
      '⚠ GPIO34 es sólo entrada.',
    ]);
    expect(validateProgramAgainstCapabilities(program)).toHaveLength(0);
    workspace.dispose();
  });

  it('evalúa ADC, input-only, incompatibilidad y reserva de cámara', () => {
    const adc = evaluatePinSelection(
      'garden-node',
      getSignalRequirement('humedadSuelo'),
      'GPIO34',
      'humedadSuelo'
    );
    expect(adc.valid).toBe(true);
    expect(adc.feedback.map((item) => item.code)).toEqual([
      'PIN_COMPATIBLE',
      'PIN_INPUT_ONLY',
    ]);

    const incompatible = evaluatePinSelection(
      'garden-node',
      getSignalRequirement('humedadSuelo'),
      'GPIO27',
      'humedadSuelo'
    );
    expect(incompatible.valid).toBe(false);
    expect(incompatible.feedback[0].code).toBe('PIN_CAPABILITY_MISMATCH');

    const inputOnlyAsOutput = evaluatePinSelection(
      'garden-node',
      getSignalRequirement('temperatura'),
      'GPIO34',
      'temperatura'
    );
    expect(inputOnlyAsOutput.valid).toBe(false);
    expect(inputOnlyAsOutput.feedback[0].code).toBe(
      'INPUT_ONLY_PIN_USED_AS_OUTPUT'
    );
    expect(
      validateProgramAgainstCapabilities({
        device: 'garden-node',
        setupStatements: [],
        loopStatements: [
          {
            kind: 'data_log',
            label: 'temperatura',
            sensor: 'temperatura',
            pin: 'GPIO34',
          },
        ],
      }).map((issue) => issue.code)
    ).toContain('INPUT_ONLY_PIN_USED_AS_OUTPUT');

    const reserved = evaluatePinSelection(
      'camera-node',
      getSignalRequirement('entradaDigital'),
      'GPIO21',
      'entradaDigital'
    );
    expect(reserved.feedback[0].code).toBe('PIN_RESERVED');
  });

  it('valida selección faltante, conflictos y DATA inconsistente de DHT11', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'data_log',
          label: 'suelo',
          sensor: 'humedadSuelo',
          blockId: 'soil',
        },
        {
          kind: 'iot_publish',
          topic: 'temp',
          sensor: 'temperatura',
          pin: 'GPIO21',
          blockId: 'temp',
        },
        {
          kind: 'iot_publish',
          topic: 'hum',
          sensor: 'humedadAmbiente',
          pin: 'GPIO27',
          blockId: 'hum',
        },
        {
          kind: 'data_log',
          label: 'digital',
          sensor: 'entradaDigital',
          pin: 'GPIO21',
          blockId: 'digital',
        },
      ],
    };
    const codes = validateProgramAgainstCapabilities(program).map(
      (issue) => issue.code
    );
    expect(codes).toContain('PIN_SELECTION_REQUIRED');
    expect(codes).toContain('PIN_CONFLICT');
    expect(codes).toContain('DHT_DATA_INCONSISTENT');
  });

  it('no inventa un GPIO en Arduino cuando falta la selección', () => {
    const output = generateArduinoCode({
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'data_log',
          label: 'suelo',
          sensor: 'humedadSuelo',
          blockId: 'soil-missing-pin',
        },
      ],
    });

    expect(output.validationIssues.map((issue) => issue.code)).toContain(
      'PIN_SELECTION_REQUIRED'
    );
    expect(output.compilableSketch).toContain('0 /* GPIO pendiente */');
    expect(output.compilableSketch).not.toContain('analogRead(34)');
    expect(output.compilableSketch).not.toContain('analogRead(35)');
  });

  it('genera DHT11 con DATA elegida y conserva evidencia del prototipo', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'data_log',
          label: 'temperatura',
          sensor: 'temperatura',
          bindings: [{ role: 'DATA', pinId: 'GPIO21' }],
        },
      ],
    };
    const output = generateArduinoCode(program);
    expect(output.compilableSketch).toContain('#define DHT_PIN 21');
    expect(output.compilableSketch).toContain('DHT dht(DHT_PIN, DHT_TYPE);');
    expect(output.validationIssues).toHaveLength(0);
    expect(
      evaluatePinSelection(
        'garden-node',
        getSignalRequirement('temperatura'),
        'GPIO21',
        'temperatura'
      ).feedback.map((item) => item.code)
    ).toContain('PROTOTYPE_VALIDATED');
  });

  it('migra pin legado y admite estructura futura TRIG/ECHO', () => {
    expect(getSelectedPinId('entradaDigital', undefined, 'GPIO27')).toBe(
      'GPIO27'
    );
    expect(bindingsFromPin('humedadSuelo', 'GPIO34')).toEqual([
      { role: 'AO', pinId: 'GPIO34' },
    ]);
    const futureBindings = [
      { role: 'TRIG' as const, pinId: 'GPIO26' },
      { role: 'ECHO' as const, pinId: 'GPIO27' },
    ];
    expect(futureBindings.map((binding) => binding.role)).toEqual([
      'TRIG',
      'ECHO',
    ]);
  });
});
