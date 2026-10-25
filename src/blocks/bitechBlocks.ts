import * as Blockly from 'blockly';
import { CameraResolutionOption, DeviceProfileId } from '../types/hardware';
import {
  BlockCategoryId,
  ComparisonOperator,
  ConditionNode,
  LogicalOperator,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';

let blocksRegistered = false;

const SENSOR_DROPDOWN_OPTIONS: [string, SensorKey][] = [
  ['💧 humedad del suelo', 'humedadSuelo'],
  ['🌡️ temperatura', 'temperatura'],
  ['💨 humedad ambiente', 'humedadAmbiente'],
  ['☀️ nivel de luz', 'nivelLuz'],
];

const OPERATOR_DROPDOWN_OPTIONS: [string, ComparisonOperator][] = [
  ['<', '<'],
  ['<=', '<='],
  ['>', '>'],
  ['>=', '>='],
  ['==', '=='],
  ['!=', '!='],
];

const RESOLUTION_DROPDOWN_OPTIONS: [string, CameraResolutionOption][] = [
  ['SVGA (800x600)', 'SVGA (800x600)'],
  ['VGA (640x480)', 'VGA (640x480)'],
  ['CIF (400x296)', 'CIF (400x296)'],
  ['QVGA (320x240)', 'QVGA (320x240)'],
  ['XGA (1024x768)', 'XGA (1024x768)'],
];

export function registerBiTechBlocks(): void {
  if (blocksRegistered) return;
  blocksRegistered = true;

  // ==================== CATEGORÍA: INICIO ====================
  Blockly.Blocks['bitech_on_start'] = {
    init: function () {
      this.appendDummyInput().appendField('▶  al iniciar');
      this.setNextStatement(true, null);
      this.setColour('#109856');
      this.setTooltip('Se ejecuta una vez al encender o reiniciar la placa ESP32.');
    },
  };

  Blockly.Blocks['bitech_forever'] = {
    init: function () {
      this.appendDummyInput().appendField('↻  repetir siempre');
      this.appendStatementInput('LOOP_DO').setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9b3df5');
      this.setTooltip('Repite continuamente las instrucciones mientras la placa está encendida.');
    },
  };

  Blockly.Blocks['bitech_wait'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🕒  esperar')
        .appendField(new Blockly.FieldNumber(5, 1, 3600, 1), 'SECONDS')
        .appendField('segundos');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2573e8');
      this.setTooltip('Pausa el programa la cantidad de segundos indicada (delay).');
    },
  };

  // ==================== CATEGORÍA: SENSORES ====================
  Blockly.Blocks['bitech_sensor_soil'] = {
    init: function () {
      this.appendDummyInput().appendField('🌱 humedad del suelo');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip('Lee el valor numérico del sensor de humedad del suelo.');
    },
  };

  Blockly.Blocks['bitech_sensor_temp'] = {
    init: function () {
      this.appendDummyInput().appendField('🌡️ temperatura (°C)');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip('Lee la temperatura ambiente en °C desde el sensor DHT11.');
    },
  };

  Blockly.Blocks['bitech_sensor_humidity'] = {
    init: function () {
      this.appendDummyInput().appendField('💧 humedad ambiente (%)');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip('Lee el porcentaje de humedad ambiente desde el sensor DHT11.');
    },
  };

  Blockly.Blocks['bitech_sensor_light'] = {
    init: function () {
      this.appendDummyInput().appendField('☀️ nivel de luz');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip('Lee el nivel de luz ambiental desde el sensor LDR.');
    },
  };

  Blockly.Blocks['bitech_number'] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(30, -1000, 5000, 1), 'NUM');
      this.setOutput(true, 'Number');
      this.setColour('#475569');
      this.setTooltip('Valor numérico constante para comparaciones.');
    },
  };

  // ==================== CATEGORÍA: CONTROL ====================
  Blockly.Blocks['bitech_if_sensor_compare'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('si')
        .appendField(new Blockly.FieldDropdown(SENSOR_DROPDOWN_OPTIONS), 'SENSOR')
        .appendField(new Blockly.FieldDropdown(OPERATOR_DROPDOWN_OPTIONS), 'OP')
        .appendField(new Blockly.FieldNumber(30, 0, 2000, 1), 'THRESHOLD')
        .appendField('entonces');
      this.appendStatementInput('DO').setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2e8af7');
      this.setTooltip('Evalúa si la lectura del sensor cumple la condición numérica.');
    },
  };

  Blockly.Blocks['bitech_if_else'] = {
    init: function () {
      this.appendValueInput('CONDITION').setCheck('Boolean').appendField('🔀 si');
      this.appendDummyInput().appendField('entonces');
      this.appendStatementInput('DO').setCheck(null);
      this.appendDummyInput().appendField('si no');
      this.appendStatementInput('ELSE').setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2e8af7');
      this.setTooltip('Ejecuta el primer bloque si la condición se cumple, o el bloque "si no" en caso contrario.');
    },
  };

  Blockly.Blocks['bitech_compare'] = {
    init: function () {
      this.appendValueInput('LEFT').setCheck('Number');
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(OPERATOR_DROPDOWN_OPTIONS), 'OP')
        .appendField(new Blockly.FieldNumber(30, -1000, 5000, 1), 'RIGHT_NUM');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour('#d97706');
      this.setTooltip('Compara un sensor con un valor numérico umbral.');
    },
  };

  Blockly.Blocks['bitech_logic_op'] = {
    init: function () {
      this.appendValueInput('A').setCheck('Boolean');
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['Y (&&)', 'AND'],
          ['O (||)', 'OR'],
        ]),
        'OP'
      );
      this.appendValueInput('B').setCheck('Boolean');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour('#d97706');
      this.setTooltip('Combina dos condiciones lógicas mediante Y (ambas) u O (al menos una).');
    },
  };

  // ==================== CATEGORÍA: ACTUADORES ====================
  Blockly.Blocks['bitech_actuator_pump_on'] = {
    init: function () {
      this.appendDummyInput().appendField('⚙️  encender bomba');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d8a52');
      this.setTooltip('Enciende la bomba de riego (Canal 1 del relay).');
    },
  };

  Blockly.Blocks['bitech_actuator_pump_off'] = {
    init: function () {
      this.appendDummyInput().appendField('⚙️  apagar bomba');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d8a52');
      this.setTooltip('Apaga la bomba de riego (Canal 1 del relay).');
    },
  };

  Blockly.Blocks['bitech_actuator_light_on'] = {
    init: function () {
      this.appendDummyInput().appendField('💡  encender iluminación');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Enciende la iluminación LED de cultivo (Canal 2 del relay).');
    },
  };

  Blockly.Blocks['bitech_actuator_light_off'] = {
    init: function () {
      this.appendDummyInput().appendField('💡  apagar iluminación');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Apaga la iluminación LED de cultivo (Canal 2 del relay).');
    },
  };

  // ==================== CATEGORÍA: CÁMARA (CAMERA NODE) ====================
  Blockly.Blocks['bitech_cam_config'] = {
    init: function () {
      this.appendDummyInput().appendField('📷  configurar cámara OV2640');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip('Inicializa la estructura de configuración de la cámara ESP32-CAM.');
    },
  };

  Blockly.Blocks['bitech_cam_resolution'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🖼️  seleccionar resolución')
        .appendField(new Blockly.FieldDropdown(RESOLUTION_DROPDOWN_OPTIONS), 'RESOLUTION');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip('Establece la resolución de captura y streaming de la cámara.');
    },
  };

  Blockly.Blocks['bitech_cam_quality'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('✨  configurar calidad JPEG')
        .appendField(new Blockly.FieldNumber(10, 10, 63, 1), 'QUALITY');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip('Define la calidad JPEG (10 = máxima calidad, 63 = mayor compresión).');
    },
  };

  Blockly.Blocks['bitech_cam_init'] = {
    init: function () {
      this.appendDummyInput().appendField('⚡  iniciar cámara');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#059669');
      this.setTooltip('Activa el sensor OV2640 con los parámetros configurados.');
    },
  };

  Blockly.Blocks['bitech_cam_wifi'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📶  conectar a Wi-Fi')
        .appendField(new Blockly.FieldTextInput('Red_Escolar_BiTech'), 'SSID');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2563eb');
      this.setTooltip('Conecta la ESP32-CAM a la red Wi-Fi para habilitar el streaming.');
    },
  };

  Blockly.Blocks['bitech_cam_stream_start'] = {
    init: function () {
      this.appendDummyInput().appendField('▶️  iniciar streaming');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d9488');
      this.setTooltip('Inicia la transmisión de video MJPEG por Wi-Fi.');
    },
  };

  Blockly.Blocks['bitech_cam_stream_stop'] = {
    init: function () {
      this.appendDummyInput().appendField('⏹️  detener streaming');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#64748b');
      this.setTooltip('Detiene la transmisión de video por Wi-Fi.');
    },
  };

  Blockly.Blocks['bitech_cam_capture'] = {
    init: function () {
      this.appendDummyInput().appendField('📸  tomar captura');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Toma una fotografía con la cámara y actualiza el contador de capturas.');
    },
  };

  // ==================== CATEGORÍA: DATOS ====================
  Blockly.Blocks['bitech_data_serial_log'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📊  registrar dato')
        .appendField(new Blockly.FieldTextInput('Humedad suelo'), 'LABEL')
        .appendField('de')
        .appendField(new Blockly.FieldDropdown(SENSOR_DROPDOWN_OPTIONS), 'SENSOR');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#db2777');
      this.setTooltip('Registra en el monitor serie el valor actual del sensor seleccionado.');
    },
  };

  // ==================== CATEGORÍA: IoT ====================
  Blockly.Blocks['bitech_iot_send_event'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('☁️  enviar a IoT')
        .appendField(new Blockly.FieldTextInput('huerta/suelo'), 'TOPIC')
        .appendField('valor de')
        .appendField(new Blockly.FieldDropdown(SENSOR_DROPDOWN_OPTIONS), 'SENSOR');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0284c7');
      this.setTooltip('Publica conceptualmente el dato del sensor en un tópico IoT.');
    },
  };
}

export interface CategoryCatalogItem {
  id: BlockCategoryId;
  label: string;
  deviceScope: 'all' | 'garden-node' | 'camera-node';
  blocks: {
    type: string;
    label: string;
    badge: string;
  }[];
}

export const BLOCK_CATEGORIES_CATALOG: CategoryCatalogItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    deviceScope: 'all',
    blocks: [
      { type: 'bitech_on_start', label: 'al iniciar', badge: 'setup()' },
      { type: 'bitech_forever', label: 'repetir siempre', badge: 'loop()' },
      { type: 'bitech_wait', label: 'esperar 5 segundos', badge: 'delay()' },
    ],
  },
  {
    id: 'sensores',
    label: 'Sensores',
    deviceScope: 'garden-node',
    blocks: [
      { type: 'bitech_sensor_soil', label: 'humedad del suelo', badge: 'ADC' },
      { type: 'bitech_sensor_temp', label: 'temperatura (°C)', badge: 'DHT11' },
      { type: 'bitech_sensor_humidity', label: 'humedad ambiente (%)', badge: 'DHT11' },
      { type: 'bitech_sensor_light', label: 'nivel de luz', badge: 'LDR' },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    deviceScope: 'all',
    blocks: [
      { type: 'bitech_if_sensor_compare', label: 'si [sensor] < [30] entonces', badge: 'if' },
      { type: 'bitech_if_else', label: 'si / entonces / si no', badge: 'if/else' },
      { type: 'bitech_compare', label: 'comparador (<, >, ==)', badge: 'bool' },
      { type: 'bitech_logic_op', label: 'operador lógico (Y / O)', badge: '&& / ||' },
    ],
  },
  {
    id: 'actuadores',
    label: 'Actuadores',
    deviceScope: 'garden-node',
    blocks: [
      { type: 'bitech_actuator_pump_on', label: 'encender bomba', badge: 'Relay 1' },
      { type: 'bitech_actuator_pump_off', label: 'apagar bomba', badge: 'Relay 1' },
      { type: 'bitech_actuator_light_on', label: 'encender iluminación', badge: 'Relay 2' },
      { type: 'bitech_actuator_light_off', label: 'apagar iluminación', badge: 'Relay 2' },
    ],
  },
  {
    id: 'camara',
    label: 'Cámara',
    deviceScope: 'camera-node',
    blocks: [
      { type: 'bitech_cam_config', label: 'configurar cámara OV2640', badge: 'Config' },
      { type: 'bitech_cam_resolution', label: 'seleccionar resolución', badge: 'SVGA' },
      { type: 'bitech_cam_quality', label: 'configurar calidad JPEG', badge: '10-63' },
      { type: 'bitech_cam_init', label: 'iniciar cámara', badge: 'Init' },
      { type: 'bitech_cam_wifi', label: 'conectar a Wi-Fi', badge: 'Wi-Fi' },
      { type: 'bitech_cam_stream_start', label: 'iniciar streaming', badge: 'Stream ON' },
      { type: 'bitech_cam_stream_stop', label: 'detener streaming', badge: 'Stream OFF' },
      { type: 'bitech_cam_capture', label: 'tomar captura', badge: 'Foto' },
    ],
  },
  {
    id: 'datos',
    label: 'Datos',
    deviceScope: 'all',
    blocks: [
      { type: 'bitech_data_serial_log', label: 'registrar dato en serie', badge: 'Serial' },
    ],
  },
  {
    id: 'iot',
    label: 'IoT',
    deviceScope: 'all',
    blocks: [
      { type: 'bitech_iot_send_event', label: 'enviar lectura a canal IoT', badge: 'V0.4' },
    ],
  },
];

/**
 * XML inicial para Garden Node Bi-Tech.
 * Reproduce exactamente el programa de referencia visual:
 * al iniciar -> repetir siempre -> si humedad del suelo < 30 entonces -> encender bomba -> esperar 5 segundos -> apagar bomba
 */
export const DEFAULT_GARDEN_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="bitech_on_start" id="block_start" x="38" y="24">
    <next>
      <block type="bitech_forever" id="block_loop">
        <statement name="LOOP_DO">
          <block type="bitech_if_sensor_compare" id="block_if_soil">
            <field name="SENSOR">humedadSuelo</field>
            <field name="OP">&lt;</field>
            <field name="THRESHOLD">30</field>
            <statement name="DO">
              <block type="bitech_actuator_pump_on" id="block_pump_on">
                <next>
                  <block type="bitech_wait" id="block_wait_5">
                    <field name="SECONDS">5</field>
                    <next>
                      <block type="bitech_actuator_pump_off" id="block_pump_off"></block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>
`.trim();

/**
 * XML inicial para Camera Node Bi-Tech.
 * Demuestra configuración de cámara, resolución SVGA 800x600, calidad 10, inicio de cámara, streaming y captura.
 */
export const DEFAULT_CAMERA_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="bitech_on_start" id="cam_block_start" x="38" y="18">
    <next>
      <block type="bitech_cam_config" id="cam_block_config">
        <next>
          <block type="bitech_cam_resolution" id="cam_block_res">
            <field name="RESOLUTION">SVGA (800x600)</field>
            <next>
              <block type="bitech_cam_quality" id="cam_block_qual">
                <field name="QUALITY">10</field>
                <next>
                  <block type="bitech_cam_init" id="cam_block_init">
                    <next>
                      <block type="bitech_cam_wifi" id="cam_block_wifi">
                        <field name="SSID">Red_Escolar_BiTech</field>
                        <next>
                          <block type="bitech_cam_stream_start" id="cam_block_stream">
                            <next>
                              <block type="bitech_forever" id="cam_block_loop">
                                <statement name="LOOP_DO">
                                  <block type="bitech_cam_capture" id="cam_block_capture">
                                    <next>
                                      <block type="bitech_wait" id="cam_block_wait">
                                        <field name="SECONDS">10</field>
                                      </block>
                                    </next>
                                  </block>
                                </statement>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`.trim();

function parseSensorFromBlock(block: Blockly.Block | null): SensorKey | undefined {
  if (!block) return undefined;
  switch (block.type) {
    case 'bitech_sensor_soil':
      return 'humedadSuelo';
    case 'bitech_sensor_temp':
      return 'temperatura';
    case 'bitech_sensor_humidity':
      return 'humedadAmbiente';
    case 'bitech_sensor_light':
      return 'nivelLuz';
    default:
      return undefined;
  }
}

function parseConditionBlock(block: Blockly.Block | null): ConditionNode | null {
  if (!block) return null;

  if (block.type === 'bitech_compare') {
    const leftBlock = block.getInputTargetBlock('LEFT');
    const leftSensor = parseSensorFromBlock(leftBlock) ?? 'humedadSuelo';
    const op = (block.getFieldValue('OP') as ComparisonOperator) || '<';
    const rightNumber = Number(block.getFieldValue('RIGHT_NUM') ?? 30);
    return {
      kind: 'comparison',
      blockId: block.id,
      leftSensor,
      operator: op,
      rightNumber,
    };
  }

  if (block.type === 'bitech_logic_op') {
    const op = (block.getFieldValue('OP') as LogicalOperator) || 'AND';
    const left = parseConditionBlock(block.getInputTargetBlock('A'));
    const right = parseConditionBlock(block.getInputTargetBlock('B'));
    if (left && right) {
      return {
        kind: 'logical',
        blockId: block.id,
        operator: op,
        left,
        right,
      };
    }
    return left ?? right;
  }

  return null;
}

function parseStatementChain(firstBlock: Blockly.Block | null): StatementNode[] {
  const statements: StatementNode[] = [];
  let current: Blockly.Block | null = firstBlock;

  while (current) {
    switch (current.type) {
      case 'bitech_actuator_pump_on':
        statements.push({ kind: 'bomba_on', blockId: current.id });
        break;
      case 'bitech_actuator_pump_off':
        statements.push({ kind: 'bomba_off', blockId: current.id });
        break;
      case 'bitech_actuator_light_on':
        statements.push({ kind: 'luz_on', blockId: current.id });
        break;
      case 'bitech_actuator_light_off':
        statements.push({ kind: 'luz_off', blockId: current.id });
        break;
      case 'bitech_wait': {
        const seconds = Number(current.getFieldValue('SECONDS') ?? 5);
        statements.push({ kind: 'wait', seconds, blockId: current.id });
        break;
      }
      case 'bitech_if_sensor_compare': {
        const sensor = (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo';
        const operator = (current.getFieldValue('OP') as ComparisonOperator) || '<';
        const threshold = Number(current.getFieldValue('THRESHOLD') ?? 30);
        const thenBranch = parseStatementChain(current.getInputTargetBlock('DO'));
        statements.push({
          kind: 'if',
          blockId: current.id,
          condition: {
            kind: 'comparison',
            blockId: current.id,
            leftSensor: sensor,
            operator,
            rightNumber: threshold,
          },
          thenBranch,
        });
        break;
      }
      case 'bitech_if_else': {
        const condition = parseConditionBlock(current.getInputTargetBlock('CONDITION'));
        const thenBranch = parseStatementChain(current.getInputTargetBlock('DO'));
        const elseBranch = parseStatementChain(current.getInputTargetBlock('ELSE'));
        statements.push({
          kind: 'if',
          blockId: current.id,
          condition,
          thenBranch,
          elseBranch,
        });
        break;
      }
      case 'bitech_cam_config':
        statements.push({ kind: 'cam_config', blockId: current.id });
        break;
      case 'bitech_cam_resolution':
        statements.push({
          kind: 'cam_resolution',
          resolution: (current.getFieldValue('RESOLUTION') as CameraResolutionOption) || 'SVGA (800x600)',
          blockId: current.id,
        });
        break;
      case 'bitech_cam_quality':
        statements.push({
          kind: 'cam_quality',
          quality: Number(current.getFieldValue('QUALITY') ?? 10),
          blockId: current.id,
        });
        break;
      case 'bitech_cam_init':
        statements.push({ kind: 'cam_init', blockId: current.id });
        break;
      case 'bitech_cam_wifi':
        statements.push({
          kind: 'cam_wifi',
          ssid: String(current.getFieldValue('SSID') || 'Red_Escolar_BiTech'),
          blockId: current.id,
        });
        break;
      case 'bitech_cam_stream_start':
        statements.push({ kind: 'cam_stream_start', blockId: current.id });
        break;
      case 'bitech_cam_stream_stop':
        statements.push({ kind: 'cam_stream_stop', blockId: current.id });
        break;
      case 'bitech_cam_capture':
        statements.push({ kind: 'cam_capture', blockId: current.id });
        break;
      case 'bitech_data_serial_log':
        statements.push({
          kind: 'data_log',
          label: String(current.getFieldValue('LABEL') || 'Dato'),
          sensor: (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo',
          blockId: current.id,
        });
        break;
      case 'bitech_iot_send_event':
        statements.push({
          kind: 'iot_publish',
          topic: String(current.getFieldValue('TOPIC') || 'huerta/datos'),
          sensor: (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo',
          blockId: current.id,
        });
        break;
      default:
        break;
    }

    current = current.getNextBlock();
  }

  return statements;
}

/**
 * Extrae el programa estructurado (AST) desde un Workspace de Blockly.
 */
export function parseWorkspaceToProgram(
  workspace: Blockly.Workspace,
  device: DeviceProfileId
): ParsedProgram {
  const setupStatements: StatementNode[] = [];
  const loopStatements: StatementNode[] = [];

  const topBlocks = workspace.getTopBlocks(true);

  for (const topBlock of topBlocks) {
    let cursor: Blockly.Block | null = topBlock;
    let inSetupChain = false;

    while (cursor) {
      if (cursor.type === 'bitech_on_start') {
        inSetupChain = true;
        cursor = cursor.getNextBlock();
        continue;
      }

      if (cursor.type === 'bitech_forever') {
        inSetupChain = false;
        const insideLoop = parseStatementChain(cursor.getInputTargetBlock('LOOP_DO'));
        loopStatements.push(...insideLoop);
        cursor = cursor.getNextBlock();
        continue;
      }

      // Cualquier instrucción entre "al iniciar" y "repetir siempre" pertenece a setup()
      const singleBlockList = parseStatementChainSingle(cursor);
      if (inSetupChain) {
        setupStatements.push(...singleBlockList);
      } else {
        loopStatements.push(...singleBlockList);
      }
      cursor = cursor.getNextBlock();
    }
  }

  return {
    device,
    setupStatements,
    loopStatements,
  };
}

function parseStatementChainSingle(block: Blockly.Block): StatementNode[] {
  const allFromHere = parseStatementChain(block);
  return allFromHere.length > 0 ? [allFromHere[0]] : [];
}
