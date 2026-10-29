import * as Blockly from 'blockly';
import {
  getDeviceCapabilities,
  getPinOptionsForSensor,
  isCategorySupportedByCapabilities,
} from '../hardware/hardwareCapabilities';
import {
  bindingsFromPin,
  UNSELECTED_PIN_ID,
} from '../hardware/pinModel';
import {
  CameraResolutionOption,
  CompatibleActuatorId,
  CompatibleSensorId,
  DeviceProfileId,
  HardwareCapabilities,
} from '../types/hardware';
import {
  BlockCategoryId,
  ComparisonOperator,
  ConditionNode,
  LogicalOperator,
  MathOperator,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';

let blocksRegistered = false;
const workspaceDeviceProfiles = new WeakMap<Blockly.Workspace, DeviceProfileId>();

const MASKED_WIFI_PASSWORD = '••••••••••••';

/**
 * Campo de contraseña para Blockly.
 *
 * Conserva el valor real para serializar/generar el sketch, pero nunca lo
 * dibuja sobre el bloque. El editor HTML también nace como input password.
 */
export class WifiPasswordField extends Blockly.FieldTextInput {
  private revealed = false;

  constructor(value = '') {
    super(value, undefined, { spellcheck: false });
  }

  setRevealed(revealed: boolean): void {
    this.revealed = revealed;
    if (
      typeof HTMLInputElement !== 'undefined' &&
      this.htmlInput_ instanceof HTMLInputElement
    ) {
      this.htmlInput_.type = revealed ? 'text' : 'password';
    }
    this.forceRerender();
  }

  protected getText_(): string {
    if (!this.revealed) return MASKED_WIFI_PASSWORD;
    return String(this.getValue() || '');
  }

  protected widgetCreate_(): HTMLInputElement | HTMLTextAreaElement {
    const input = super.widgetCreate_();
    if (
      typeof HTMLInputElement !== 'undefined' &&
      input instanceof HTMLInputElement
    ) {
      input.type = this.revealed ? 'text' : 'password';
      input.autocomplete = 'off';
      input.setAttribute('aria-label', 'Contraseña Wi-Fi');
    }
    return input;
  }
}

const SENSOR_DROPDOWN_OPTIONS: [string, SensorKey][] = [
  ['💧 humedad del suelo', 'humedadSuelo'],
  ['📈 entrada analógica', 'entradaAnalogicaA0'],
  ['🌡️ temperatura', 'temperatura'],
  ['💨 humedad ambiente', 'humedadAmbiente'],
  ['☀️ nivel de luz', 'nivelLuz'],
  ['🔘 entrada digital', 'entradaDigital'],
];

function getWorkspaceDeviceProfile(workspace: Blockly.Workspace): DeviceProfileId {
  return workspaceDeviceProfiles.get(workspace) ?? 'garden-node';
}

function sensorForDirectBlock(blockType: string): SensorKey | null {
  const sensors: Record<string, SensorKey> = {
    bitech_sensor_soil: 'humedadSuelo',
    bitech_sensor_temp: 'temperatura',
    bitech_sensor_humidity: 'humedadAmbiente',
    bitech_sensor_light: 'nivelLuz',
    bitech_sensor_analog_a0: 'entradaAnalogicaA0',
    bitech_sensor_digital_in: 'entradaDigital',
  };
  return sensors[blockType] ?? null;
}

function sensorOptionsForBlock(block: Blockly.Block): [string, string][] {
  const capabilities = getDeviceCapabilities(
    getWorkspaceDeviceProfile(block.workspace)
  );
  const options = SENSOR_DROPDOWN_OPTIONS.filter(([, sensor]) =>
    capabilities.compatibleSensors.includes(sensor)
  );
  return options.length > 0
    ? options
    : [['Sin entradas compatibles', 'entradaDigital']];
}

function pinOptionsForBlock(
  block: Blockly.Block,
  sensor: SensorKey
): [string, string][] {
  const options = getPinOptionsForSensor(
    getWorkspaceDeviceProfile(block.workspace),
    sensor
  ).map((pin) => [pin.label, pin.id] as [string, string]);
  return [['Elegir GPIO…', UNSELECTED_PIN_ID], ...options];
}

function normalizePinField(
  block: Blockly.Block,
  sensor: SensorKey
): void {
  const field = block.getField('PIN') as Blockly.FieldDropdown | null;
  if (!field) return;
  const options = pinOptionsForBlock(block, sensor);
  field.getOptions(false);
  if (!options.some(([, value]) => value === field.getValue())) {
    field.setValue(UNSELECTED_PIN_ID);
  }
}

function refreshInputPinBlock(
  block: Blockly.Block,
  nextSensor?: SensorKey
): void {
  const directSensor = sensorForDirectBlock(block.type);
  if (directSensor) {
    normalizePinField(block, directSensor);
    return;
  }

  const sensorField = block.getField('SENSOR') as Blockly.FieldDropdown | null;
  const sensorOptions = sensorField?.getOptions(false) ?? [];
  let sensor =
    nextSensor ??
    ((block.getFieldValue('SENSOR') as SensorKey | null) ?? 'humedadSuelo');
  if (
    sensorField &&
    !sensorOptions.some((option) => option[1] === sensor) &&
    sensorOptions[0]
  ) {
    sensor = sensorOptions[0][1] as SensorKey;
    sensorField.setValue(sensor);
  }
  block.getInput('PIN_ROW')?.setVisible(true);
  normalizePinField(block, sensor);
  if (block instanceof Blockly.BlockSvg && block.rendered) block.render();
}

function createSensorDropdown(block: Blockly.Block): Blockly.FieldDropdown {
  return new Blockly.FieldDropdown(
    () => sensorOptionsForBlock(block),
    (value) => {
      queueMicrotask(() => refreshInputPinBlock(block, value as SensorKey));
      return value;
    }
  );
}

function appendConditionalPinRow(block: Blockly.Block): void {
  block
    .appendDummyInput('PIN_ROW')
    .appendField('pin')
    .appendField(
      new Blockly.FieldDropdown(() => {
        const sensor =
          (block.getFieldValue('SENSOR') as SensorKey | null) ??
          'entradaAnalogicaA0';
        return pinOptionsForBlock(block, sensor);
      }),
      'PIN'
    );
  refreshInputPinBlock(block);
}

function createPinDropdown(
  block: Blockly.Block,
  sensor: SensorKey
): Blockly.FieldDropdown {
  return new Blockly.FieldDropdown(() => pinOptionsForBlock(block, sensor));
}

/** Vincula el workspace con el perfil que alimenta sus selectores de pines. */
export function setWorkspaceDeviceProfile(
  workspace: Blockly.Workspace,
  device: DeviceProfileId
): void {
  workspaceDeviceProfiles.set(workspace, device);
  workspace.getAllBlocks(false).forEach((block) => refreshInputPinBlock(block));
}

const OPERATOR_DROPDOWN_OPTIONS: [string, ComparisonOperator][] = [
  ['<', '<'],
  ['<=', '<='],
  ['>', '>'],
  ['>=', '>='],
  ['==', '=='],
  ['!=', '!='],
];

const MATH_DROPDOWN_OPTIONS: [string, MathOperator][] = [
  ['+', '+'],
  ['-', '-'],
  ['*', '*'],
  ['/', '/'],
];

const RESOLUTION_DROPDOWN_OPTIONS: [string, CameraResolutionOption][] = [
  ['SVGA (800x600)', 'SVGA (800x600)'],
  ['VGA (640x480)', 'VGA (640x480)'],
  ['CIF (400x296)', 'CIF (400x296)'],
  ['QVGA (320x240)', 'QVGA (320x240)'],
  ['XGA (1024x768)', 'XGA (1024x768)'],
];

const BITECH_CHANNEL_DROPDOWN_OPTIONS: [string, string][] = Array.from(
  { length: 9 },
  (_, index) => {
    const channel = String(index + 1);
    return [channel, channel];
  }
);

export function registerBiTechBlocks(): void {
  if (blocksRegistered) return;
  blocksRegistered = true;

  // ==================== CATEGORÍA: INICIO ====================
  Blockly.Blocks['bitech_on_start'] = {
    init: function () {
      this.appendDummyInput().appendField('▶  al iniciar');
      this.setNextStatement(true, null);
      this.setColour('#15803d');
      this.setTooltip(
        'Se ejecuta una vez al encender o reiniciar el microcontrolador.'
      );
    },
  };

  Blockly.Blocks['bitech_forever'] = {
    init: function () {
      this.appendDummyInput().appendField('↻  repetir siempre');
      this.appendStatementInput('LOOP_DO').setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#16a34a');
      this.setTooltip(
        'Repite continuamente las instrucciones mientras la placa está encendida.'
      );
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
      this.setColour('#15803d');
      this.setTooltip('Pausa el programa la cantidad de segundos indicada (delay).');
    },
  };

  // ==================== CATEGORÍA: SENSORES ====================
  Blockly.Blocks['bitech_sensor_soil'] = {
    init: function () {
      this.appendDummyInput().appendField('🌱 leer humedad del suelo');
      this.appendDummyInput()
        .appendField('pin ADC')
        .appendField(createPinDropdown(this, 'humedadSuelo'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'El sensor entrega una señal analógica por AO. Elegí un GPIO con capacidad ADC.'
      );
    },
  };

  Blockly.Blocks['bitech_sensor_temp'] = {
    init: function () {
      this.appendDummyInput().appendField('🌡️ leer temperatura DHT11');
      this.appendDummyInput()
        .appendField('DATA')
        .appendField(createPinDropdown(this, 'temperatura'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'El DHT11 usa un protocolo digital temporizado por una línea DATA. Elegí un GPIO digital compatible.'
      );
    },
  };

  Blockly.Blocks['bitech_sensor_humidity'] = {
    init: function () {
      this.appendDummyInput().appendField('💧 leer humedad DHT11');
      this.appendDummyInput()
        .appendField('DATA')
        .appendField(createPinDropdown(this, 'humedadAmbiente'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'El DHT11 usa un protocolo digital temporizado por una línea DATA. Elegí un GPIO digital compatible.'
      );
    },
  };

  Blockly.Blocks['bitech_sensor_light'] = {
    init: function () {
      this.appendDummyInput().appendField('☀️ leer nivel de luz');
      this.appendDummyInput()
        .appendField('pin ADC')
        .appendField(createPinDropdown(this, 'nivelLuz'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'El LDR entrega una señal analógica. Elegí un GPIO con capacidad ADC.'
      );
    },
  };

  Blockly.Blocks['bitech_sensor_analog_a0'] = {
    init: function () {
      this.appendDummyInput().appendField('📈 leer entrada analógica');
      this.appendDummyInput()
        .appendField('pin ADC')
        .appendField(createPinDropdown(this, 'entradaAnalogicaA0'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'Lee una señal analógica desde un pin compatible del perfil activo.'
      );
    },
  };

  Blockly.Blocks['bitech_sensor_digital_in'] = {
    init: function () {
      this.appendDummyInput().appendField('🔘 leer entrada digital');
      this.appendDummyInput()
        .appendField('pin')
        .appendField(createPinDropdown(this, 'entradaDigital'), 'PIN');
      this.setOutput(true, 'Number');
      this.setColour('#0284c7');
      this.setTooltip(
        'Lee el estado de una entrada digital (1 = HIGH / activo, 0 = LOW / inactivo).'
      );
    },
  };

  Blockly.Blocks['bitech_number'] = {
    init: function () {
      this.appendDummyInput().appendField(
        new Blockly.FieldNumber(30, -1000, 5000, 1),
        'NUM'
      );
      this.setOutput(true, 'Number');
      this.setColour('#475569');
      this.setTooltip('Valor numérico constante para comparaciones.');
    },
  };

  // ==================== CATEGORÍA: CONTROL ====================
  Blockly.Blocks['bitech_if_sensor_compare'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🔀  si')
        .appendField(createSensorDropdown(this), 'SENSOR')
        .appendField(new Blockly.FieldDropdown(OPERATOR_DROPDOWN_OPTIONS), 'OP')
        .appendField(new Blockly.FieldNumber(30, 0, 4095, 1), 'THRESHOLD')
        .appendField('entonces');
      appendConditionalPinRow(this);
      this.appendStatementInput('DO').setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#d97706');
      this.setTooltip(
        'Evalúa si la lectura del sensor cumple la condición numérica.'
      );
    },
  };

  Blockly.Blocks['bitech_if_else'] = {
    init: function () {
      this.appendValueInput('CONDITION').setCheck('Boolean').appendField('🔀  si');
      this.appendDummyInput().appendField('entonces');
      this.appendStatementInput('DO').setCheck(null);
      this.appendDummyInput().appendField('si no');
      this.appendStatementInput('ELSE').setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#d97706');
      this.setTooltip(
        'Ejecuta el primer bloque si la condición se cumple, o el bloque "si no" en caso contrario.'
      );
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
      this.setTooltip('Compara un sensor o cálculo con un valor numérico umbral.');
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
      this.setTooltip(
        'Combina dos condiciones lógicas mediante Y (ambas) u O (al menos una).'
      );
    },
  };

  Blockly.Blocks['bitech_math_op'] = {
    init: function () {
      this.appendValueInput('LEFT').setCheck('Number').appendField('➗');
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(MATH_DROPDOWN_OPTIONS), 'OP')
        .appendField(new Blockly.FieldNumber(10, -1000, 5000, 1), 'RIGHT_NUM');
      this.setInputsInline(true);
      this.setOutput(true, 'Number');
      this.setColour('#d97706');
      this.setTooltip(
        'Realiza una operación matemática (+, -, *, /) sobre la lectura de un sensor.'
      );
    },
  };

  // ==================== CATEGORÍA: ACTUADORES ====================
  Blockly.Blocks['bitech_actuator_pump_on'] = {
    init: function () {
      this.appendDummyInput().appendField('⚙️  encender bomba');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Enciende la bomba de riego (Canal 1 del relay).');
    },
  };

  Blockly.Blocks['bitech_actuator_pump_off'] = {
    init: function () {
      this.appendDummyInput().appendField('⚙️  apagar bomba');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Apaga la bomba de riego (Canal 1 del relay).');
    },
  };

  Blockly.Blocks['bitech_actuator_light_on'] = {
    init: function () {
      this.appendDummyInput().appendField('💡  encender iluminación');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Enciende la iluminación LED.');
    },
  };

  Blockly.Blocks['bitech_actuator_light_off'] = {
    init: function () {
      this.appendDummyInput().appendField('💡  apagar iluminación');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Apaga la iluminación LED.');
    },
  };

  Blockly.Blocks['bitech_actuator_relay_on'] = {
    init: function () {
      this.appendDummyInput().appendField('🔌  encender relay');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Activa el módulo relay conectado a la placa.');
    },
  };

  Blockly.Blocks['bitech_actuator_relay_off'] = {
    init: function () {
      this.appendDummyInput().appendField('🔌  apagar relay');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip('Desactiva el módulo relay dejándolo en estado seguro OFF.');
    },
  };

  Blockly.Blocks['bitech_actuator_digital_out_on'] = {
    init: function () {
      this.appendDummyInput().appendField('⚡  activar salida digital');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip(
        'Pone la salida digital configurada en estado alto (HIGH).'
      );
    },
  };

  Blockly.Blocks['bitech_actuator_digital_out_off'] = {
    init: function () {
      this.appendDummyInput().appendField('⚡  desactivar salida digital');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7c3aed');
      this.setTooltip(
        'Pone la salida digital configurada en estado bajo (LOW).'
      );
    },
  };

  // ==================== CATEGORÍA: CÁMARA (CAMERA NODE) ====================
  Blockly.Blocks['bitech_cam_config'] = {
    init: function () {
      this.appendDummyInput().appendField('📷  configurar cámara OV2640');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip(
        'Inicializa la estructura de configuración de la cámara ESP32-CAM.'
      );
    },
  };

  Blockly.Blocks['bitech_cam_resolution'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🖼️  seleccionar resolución')
        .appendField(
          new Blockly.FieldDropdown(RESOLUTION_DROPDOWN_OPTIONS),
          'RESOLUTION'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip(
        'Establece la resolución de captura y streaming de la cámara.'
      );
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
      this.setTooltip(
        'Define la calidad JPEG (10 = máxima calidad, 63 = mayor compresión).'
      );
    },
  };

  Blockly.Blocks['bitech_cam_init'] = {
    init: function () {
      this.appendDummyInput().appendField('⚡  iniciar cámara');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0891b2');
      this.setTooltip('Activa el sensor OV2640 con los parámetros configurados.');
    },
  };

  Blockly.Blocks['bitech_cam_wifi'] = {
    init: function () {
      const passwordField = new WifiPasswordField('');
      const revealField = new Blockly.FieldCheckbox('FALSE', (value) => {
        passwordField.setRevealed(value === 'TRUE');
        return value;
      });
      // Mostrar/ocultar es un estado efímero: al recargar siempre queda oculto.
      revealField.SERIALIZABLE = false;

      this.appendDummyInput().appendField('📶  conectar a Wi-Fi');
      this.appendDummyInput()
        .appendField('SSID')
        .appendField(new Blockly.FieldTextInput('', undefined, { spellcheck: false }), 'SSID');
      this.appendDummyInput()
        .appendField('Contraseña')
        .appendField(passwordField, 'PASSWORD')
        .appendField('mostrar')
        .appendField(revealField);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d9488');
      this.setTooltip(
        'Conecta el dispositivo a la red Wi-Fi indicada.'
      );
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
      this.setTooltip(
        'Toma una fotografía con la cámara y actualiza el contador de capturas.'
      );
    },
  };

  // ==================== CATEGORÍA: DATOS ====================
  Blockly.Blocks['bitech_data_serial_log'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📊  registrar dato')
        .appendField(new Blockly.FieldTextInput('Lectura'), 'LABEL')
        .appendField('de')
        .appendField(createSensorDropdown(this), 'SENSOR');
      appendConditionalPinRow(this);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#db2777');
      this.setTooltip(
        'Registra en el monitor serie el valor actual del sensor seleccionado.'
      );
    },
  };

  // ==================== CATEGORÍA: IoT ====================
  Blockly.Blocks['bitech_iot_connect_channel'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('🔗  conectar a Smart Garden Lab — canal')
        .appendField(
          new Blockly.FieldDropdown(BITECH_CHANNEL_DROPDOWN_OPTIONS),
          'CHANNEL'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d9488');
      this.setTooltip(
        'Establece el canal visible del 1 al 9 que permitirá encontrar este dispositivo en Smart Garden Lab.'
      );
    },
  };

  Blockly.Blocks['bitech_iot_send_event'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('☁️  enviar a IoT')
        .appendField(new Blockly.FieldTextInput('bitech/nodo1'), 'TOPIC')
        .appendField('valor de')
        .appendField(createSensorDropdown(this), 'SENSOR');
      appendConditionalPinRow(this);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0d9488');
      this.setTooltip('Publica conceptualmente el dato del sensor en un tópico IoT.');
    },
  };
}

export interface CatalogBlockItem {
  type: string;
  label: string;
  badge: string;
  requiredSensor?: CompatibleSensorId;
  requiredActuator?: CompatibleActuatorId;
  requiresCamera?: boolean;
  requiresWifi?: boolean;
  excludeCamera?: boolean;
}

export interface CategoryCatalogItem {
  id: BlockCategoryId;
  label: string;
  blocks: CatalogBlockItem[];
}

export const BLOCK_CATEGORIES_CATALOG: CategoryCatalogItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    blocks: [
      { type: 'bitech_on_start', label: 'al iniciar', badge: 'setup()' },
      { type: 'bitech_forever', label: 'repetir siempre', badge: 'loop()' },
      { type: 'bitech_wait', label: 'esperar 5 segundos', badge: 'delay()' },
    ],
  },
  {
    id: 'sensores',
    label: 'Sensores',
    blocks: [
      {
        type: 'bitech_sensor_temp',
        label: 'temperatura DHT11 [DATA]',
        badge: 'DHT11',
        requiredSensor: 'temperatura',
      },
      {
        type: 'bitech_sensor_humidity',
        label: 'humedad DHT11 [DATA]',
        badge: 'DHT11',
        requiredSensor: 'humedadAmbiente',
      },
      {
        type: 'bitech_sensor_analog_a0',
        label: 'entrada analógica [pin]',
        badge: 'ADC',
        requiredSensor: 'entradaAnalogicaA0',
      },
      {
        type: 'bitech_sensor_digital_in',
        label: 'entrada digital [pin]',
        badge: 'DIN',
        requiredSensor: 'entradaDigital',
      },
      {
        type: 'bitech_sensor_soil',
        label: 'humedad del suelo [pin ADC]',
        badge: 'ADC',
        requiredSensor: 'humedadSuelo',
      },
      {
        type: 'bitech_sensor_light',
        label: 'nivel de luz LDR [pin ADC]',
        badge: 'ADC',
        requiredSensor: 'nivelLuz',
      },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    blocks: [
      {
        type: 'bitech_if_sensor_compare',
        label: 'si [sensor] < [30] entonces',
        badge: 'if',
      },
      {
        type: 'bitech_if_else',
        label: 'si / entonces / si no',
        badge: 'if/else',
      },
      {
        type: 'bitech_compare',
        label: 'comparador (<, >, ==)',
        badge: 'bool',
      },
      {
        type: 'bitech_logic_op',
        label: 'operador lógico (Y / O)',
        badge: '&& / ||',
      },
      {
        type: 'bitech_math_op',
        label: 'operación matemática (+, -, *, /)',
        badge: 'math',
      },
    ],
  },
  {
    id: 'actuadores',
    label: 'Actuadores',
    blocks: [
      {
        type: 'bitech_actuator_pump_on',
        label: 'encender bomba',
        badge: 'Relay 1',
        requiredActuator: 'water_pump',
      },
      {
        type: 'bitech_actuator_pump_off',
        label: 'apagar bomba',
        badge: 'Relay 1',
        requiredActuator: 'water_pump',
      },
      {
        type: 'bitech_actuator_digital_out_on',
        label: 'activar salida digital',
        badge: 'HIGH',
        requiredActuator: 'digital_output',
      },
      {
        type: 'bitech_actuator_digital_out_off',
        label: 'desactivar salida digital',
        badge: 'LOW',
        requiredActuator: 'digital_output',
      },
      {
        type: 'bitech_actuator_relay_on',
        label: 'encender relay',
        badge: 'Relay',
        requiredActuator: 'single_relay',
      },
      {
        type: 'bitech_actuator_relay_off',
        label: 'apagar relay',
        badge: 'Relay',
        requiredActuator: 'single_relay',
      },
      {
        type: 'bitech_actuator_light_on',
        label: 'encender iluminación',
        badge: 'LED',
        requiredActuator: 'led_lighting',
      },
      {
        type: 'bitech_actuator_light_off',
        label: 'apagar iluminación',
        badge: 'LED',
        requiredActuator: 'led_lighting',
      },
    ],
  },
  {
    id: 'camara',
    label: 'Cámara',
    blocks: [
      {
        type: 'bitech_cam_config',
        label: 'configurar cámara OV2640',
        badge: 'Config',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_resolution',
        label: 'seleccionar resolución',
        badge: 'SVGA',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_quality',
        label: 'configurar calidad JPEG',
        badge: '10-63',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_init',
        label: 'iniciar cámara',
        badge: 'Init',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_wifi',
        label: 'conectar a Wi-Fi',
        badge: 'Wi-Fi',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_stream_start',
        label: 'iniciar streaming',
        badge: 'Stream ON',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_stream_stop',
        label: 'detener streaming',
        badge: 'Stream OFF',
        requiresCamera: true,
      },
      {
        type: 'bitech_cam_capture',
        label: 'tomar captura',
        badge: 'Foto',
        requiresCamera: true,
      },
    ],
  },
  {
    id: 'datos',
    label: 'Datos',
    blocks: [
      {
        type: 'bitech_data_serial_log',
        label: 'registrar dato en serie',
        badge: 'Serial',
      },
    ],
  },
  {
    id: 'iot',
    label: 'IoT',
    blocks: [
      {
        type: 'bitech_iot_connect_channel',
        label: 'conectar a Smart Garden Lab',
        badge: 'Canal 1–9',
        requiresWifi: true,
        excludeCamera: true,
      },
      {
        type: 'bitech_cam_wifi',
        label: 'conectar a Wi-Fi',
        badge: 'Wi-Fi',
        requiresWifi: true,
      },
      {
        type: 'bitech_iot_send_event',
        label: 'enviar lectura a canal IoT',
        badge: 'V0.4',
        requiresWifi: true,
        excludeCamera: true,
      },
    ],
  },
];

/**
 * Filtra las categorías y bloques del catálogo utilizando únicamente las
 * capacidades declaradas en `HardwareCapabilities`.
 */
export function getCatalogForCapabilities(
  capabilities: HardwareCapabilities
): CategoryCatalogItem[] {
  return BLOCK_CATEGORIES_CATALOG.filter((cat) =>
    isCategorySupportedByCapabilities(cat.id, capabilities)
  ).map((cat) => ({
    ...cat,
    blocks: cat.blocks.filter((b) => {
      if (b.requiresCamera && !capabilities.camera) return false;
      if (b.requiresWifi && !capabilities.wifi) return false;
      if (b.excludeCamera && capabilities.camera) return false;
      if (
        b.requiredSensor &&
        !capabilities.compatibleSensors.includes(b.requiredSensor)
      ) {
        return false;
      }
      if (
        b.requiredActuator &&
        !capabilities.compatibleActuators.includes(b.requiredActuator)
      ) {
        return false;
      }
      return true;
    }),
  }));
}

export function getCatalogForDevice(
  deviceId: DeviceProfileId
): CategoryCatalogItem[] {
  return getCatalogForCapabilities(getDeviceCapabilities(deviceId));
}

/**
 * XML vacío para proyectos nuevos creados desde cero.
 */
export const EMPTY_WORKSPACE_XML =
  '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

/**
 * XML inicial para Garden Node Bi-Tech (ESP32).
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
 * XML inicial para Camera Node Bi-Tech (ESP32-CAM).
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
                        <field name="SSID">SSID_PENDIENTE_CONFIGURACION</field>
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

/**
 * XML inicial para NodeMCU — ESP8266 (V0.3 Placa real).
 * Programa validado físicamente:
 *   al iniciar -> apagar relay
 *   repetir siempre ->
 *     registrar en consola "Humedad suelo" valor de humedad del suelo
 *     si humedad del suelo > 800 -> encender relay / si no -> apagar relay
 *     esperar 1 segundos
 */
export const DEFAULT_NODEMCU_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="bitech_on_start" id="nodemcu_block_start" x="36" y="20">
    <next>
      <block type="bitech_actuator_relay_off" id="nodemcu_setup_relay_off">
        <next>
          <block type="bitech_forever" id="nodemcu_block_loop">
            <statement name="LOOP_DO">
              <block type="bitech_data_serial_log" id="nodemcu_log_soil">
                <field name="LABEL">Humedad suelo</field>
                <field name="SENSOR">humedadSuelo</field>
                <next>
                  <block type="bitech_if_else" id="nodemcu_if_else_a0">
                    <value name="CONDITION">
                      <block type="bitech_compare" id="nodemcu_cmp_a0">
                        <field name="OP">&gt;</field>
                        <field name="RIGHT_NUM">800</field>
                        <value name="LEFT">
                          <block type="bitech_sensor_soil" id="nodemcu_sensor_soil"></block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="bitech_actuator_relay_on" id="nodemcu_relay_on"></block>
                    </statement>
                    <statement name="ELSE">
                      <block type="bitech_actuator_relay_off" id="nodemcu_relay_off"></block>
                    </statement>
                    <next>
                      <block type="bitech_wait" id="nodemcu_wait_1s">
                        <field name="SECONDS">1</field>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
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
    case 'bitech_sensor_analog_a0':
      return 'entradaAnalogicaA0';
    case 'bitech_sensor_digital_in':
      return 'entradaDigital';
    default:
      return undefined;
  }
}

function parsePinForSensor(
  block: Blockly.Block | null,
  sensor: SensorKey | undefined
): string | undefined {
  if (!block || !sensor) return undefined;
  const value = String(block.getFieldValue('PIN') || '');
  return value && value !== UNSELECTED_PIN_ID ? value : undefined;
}

function parseNumericExpression(
  block: Blockly.Block | null
): NumericExpressionNode | undefined {
  if (!block) return undefined;
  const sensor = parseSensorFromBlock(block);
  if (sensor) {
    return {
      kind: 'sensor_read',
      sensor,
      pin: parsePinForSensor(block, sensor),
      bindings: bindingsFromPin(sensor, parsePinForSensor(block, sensor)),
      blockId: block.id,
    };
  }
  if (block.type === 'bitech_number') {
    return {
      kind: 'number_literal',
      value: Number(block.getFieldValue('NUM') ?? 0),
      blockId: block.id,
    };
  }
  if (block.type === 'bitech_math_op') {
    const left =
      parseNumericExpression(block.getInputTargetBlock('LEFT')) ?? {
        kind: 'sensor_read',
        sensor: 'entradaAnalogicaA0',
      };
    const operator = (block.getFieldValue('OP') as MathOperator) || '+';
    const rightNumber = Number(block.getFieldValue('RIGHT_NUM') ?? 10);
    return {
      kind: 'math_op',
      operator,
      left,
      rightNumber,
      blockId: block.id,
    };
  }
  return undefined;
}

function parseConditionBlock(block: Blockly.Block | null): ConditionNode | null {
  if (!block) return null;

  if (block.type === 'bitech_compare') {
    const leftBlock = block.getInputTargetBlock('LEFT');
    const leftSensor = parseSensorFromBlock(leftBlock);
    const leftExpr = parseNumericExpression(leftBlock);
    const op = (block.getFieldValue('OP') as ComparisonOperator) || '<';
    const rightNumber = Number(block.getFieldValue('RIGHT_NUM') ?? 30);
    return {
      kind: 'comparison',
      blockId: block.id,
      leftSensor: leftSensor ?? (leftExpr?.kind === 'sensor_read' ? leftExpr.sensor : 'humedadSuelo'),
      leftPin:
        leftExpr?.kind === 'sensor_read' ? leftExpr.pin : undefined,
      leftBindings:
        leftExpr?.kind === 'sensor_read' ? leftExpr.bindings : undefined,
      leftExpr,
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
      case 'bitech_actuator_relay_on':
        statements.push({ kind: 'relay_on', blockId: current.id });
        break;
      case 'bitech_actuator_relay_off':
        statements.push({ kind: 'relay_off', blockId: current.id });
        break;
      case 'bitech_actuator_digital_out_on':
        statements.push({ kind: 'digital_out_on', blockId: current.id });
        break;
      case 'bitech_actuator_digital_out_off':
        statements.push({ kind: 'digital_out_off', blockId: current.id });
        break;
      case 'bitech_wait': {
        const seconds = Number(current.getFieldValue('SECONDS') ?? 5);
        statements.push({ kind: 'wait', seconds, blockId: current.id });
        break;
      }
      case 'bitech_if_sensor_compare': {
        const sensor =
          (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo';
        const operator =
          (current.getFieldValue('OP') as ComparisonOperator) || '<';
        const threshold = Number(current.getFieldValue('THRESHOLD') ?? 30);
        const thenBranch = parseStatementChain(
          current.getInputTargetBlock('DO')
        );
        statements.push({
          kind: 'if',
          blockId: current.id,
          condition: {
            kind: 'comparison',
            blockId: current.id,
            leftSensor: sensor,
            leftPin: parsePinForSensor(current, sensor),
            leftBindings: bindingsFromPin(
              sensor,
              parsePinForSensor(current, sensor)
            ),
            operator,
            rightNumber: threshold,
          },
          thenBranch,
        });
        break;
      }
      case 'bitech_if_else': {
        const condition = parseConditionBlock(
          current.getInputTargetBlock('CONDITION')
        );
        const thenBranch = parseStatementChain(
          current.getInputTargetBlock('DO')
        );
        const elseBranch = parseStatementChain(
          current.getInputTargetBlock('ELSE')
        );
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
          resolution:
            (current.getFieldValue('RESOLUTION') as CameraResolutionOption) ||
            'SVGA (800x600)',
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
          ssid: String(current.getFieldValue('SSID') || ''),
          password: String(current.getFieldValue('PASSWORD') || ''),
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
      case 'bitech_data_serial_log': {
        const sensor =
          (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo';
        statements.push({
          kind: 'data_log',
          label: String(current.getFieldValue('LABEL') || 'Dato'),
          sensor,
          pin: parsePinForSensor(current, sensor),
          bindings: bindingsFromPin(
            sensor,
            parsePinForSensor(current, sensor)
          ),
          blockId: current.id,
        });
        break;
      }
      case 'bitech_iot_send_event': {
        const sensor =
          (current.getFieldValue('SENSOR') as SensorKey) || 'humedadSuelo';
        statements.push({
          kind: 'iot_publish',
          topic: String(current.getFieldValue('TOPIC') || 'huerta/datos'),
          sensor,
          pin: parsePinForSensor(current, sensor),
          bindings: bindingsFromPin(
            sensor,
            parsePinForSensor(current, sensor)
          ),
          blockId: current.id,
        });
        break;
      }
      case 'bitech_iot_connect_channel': {
        const rawChannel = Number(current.getFieldValue('CHANNEL'));
        const channel = Number.isInteger(rawChannel)
          ? Math.min(9, Math.max(1, rawChannel))
          : 1;
        statements.push({
          kind: 'iot_connect_channel',
          channel,
          blockId: current.id,
        });
        break;
      }
      default:
        break;
    }

    current = current.getNextBlock();
  }

  return statements;
}

function parseStatementChainSingle(block: Blockly.Block): StatementNode[] {
  const allFromHere = parseStatementChain(block);
  return allFromHere.length > 0 ? [allFromHere[0]] : [];
}

/**
 * Extrae el programa estructurado (AST) y los sensores utilizados desde un Workspace de Blockly.
 */
export function parseWorkspaceToProgram(
  workspace: Blockly.Workspace,
  device: DeviceProfileId
): ParsedProgram {
  const setupStatements: StatementNode[] = [];
  const loopStatements: StatementNode[] = [];
  const usedSensorsSet = new Set<SensorKey>();
  const pinSelections: NonNullable<ParsedProgram['pinSelections']> = [];
  let startBlockId: string | undefined;
  let loopBlockId: string | undefined;

  // Recolectar también bloques de sensores sueltos o encastrados en el lienzo
  const allBlocks = workspace.getAllBlocks(false);
  for (const blk of allBlocks) {
    const directSensor = parseSensorFromBlock(blk);
    if (directSensor) {
      usedSensorsSet.add(directSensor);
      const pin = parsePinForSensor(blk, directSensor);
      pinSelections.push({
        sensor: directSensor,
        pin,
        bindings: bindingsFromPin(directSensor, pin),
        blockId: blk.id,
      });
    }
    if (
      blk.type === 'bitech_if_sensor_compare' ||
      blk.type === 'bitech_data_serial_log' ||
      blk.type === 'bitech_iot_send_event'
    ) {
      const sField = blk.getFieldValue('SENSOR') as SensorKey | undefined;
      if (sField) {
        usedSensorsSet.add(sField);
        const pin = parsePinForSensor(blk, sField);
        pinSelections.push({
          sensor: sField,
          pin,
          bindings: bindingsFromPin(sField, pin),
          blockId: blk.id,
        });
      }
    }
  }

  const topBlocks = workspace.getTopBlocks(true);

  for (const topBlock of topBlocks) {
    let cursor: Blockly.Block | null = topBlock;
    let inSetupChain = false;

    while (cursor) {
      if (cursor.type === 'bitech_on_start') {
        startBlockId ??= cursor.id;
        inSetupChain = true;
        cursor = cursor.getNextBlock();
        continue;
      }

      if (cursor.type === 'bitech_forever') {
        loopBlockId ??= cursor.id;
        inSetupChain = false;
        const insideLoop = parseStatementChain(
          cursor.getInputTargetBlock('LOOP_DO')
        );
        loopStatements.push(...insideLoop);
        cursor = cursor.getNextBlock();
        continue;
      }

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
    startBlockId,
    loopBlockId,
    usedSensors: Array.from(usedSensorsSet),
    pinSelections,
  };
}
