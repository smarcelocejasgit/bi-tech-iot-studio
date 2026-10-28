import {
  CameraResolutionOption,
  DeviceProfileId,
  HardwareValidationIssue,
} from './hardware';

export type BlockCategoryId =
  | 'inicio'
  | 'sensores'
  | 'control'
  | 'actuadores'
  | 'camara'
  | 'datos'
  | 'iot';

export interface GardenSensorState {
  temperatura: number; // °C (0 - 50)
  humedadAmbiente: number; // % (0 - 100)
  humedadSuelo: number; // Lectura analógica (sin asumir % calibrado real)
  nivelLuz: number; // Lectura LDR (0 - 1023)
}

export interface GardenActuatorState {
  bomba: boolean;
  iluminacion: boolean;
  bitechChannel: number | null;
  lastDelaySeconds: number | null;
  explanation: string;
  triggeredConditions: string[];
}

export interface NodeMcuSensorState {
  temperatura: number; // DHT11 °C (0 - 50)
  humedadAmbiente: number; // DHT11 % (0 - 100)
  entradaAnalogicaA0: number; // Canal único A0 (0 - 1023)
  analogSensorLabel: 'LDR (Luz)' | 'Humedad de suelo' | 'Potenciómetro / Genérico';
  entradaDigital: 0 | 1; // LOW (0) o HIGH (1)
}

export interface NodeMcuActuatorState {
  relay: boolean;
  iluminacion: boolean;
  salidaDigital: boolean;
  bitechChannel: number | null;
  lastDelaySeconds: number | null;
  explanation: string;
  triggeredConditions: string[];
}

export interface CameraSimulationState {
  configurada: boolean;
  activa: boolean;
  resolucion: CameraResolutionOption;
  calidad: number;
  wifiConectado: boolean;
  streaming: boolean;
  capturas: number;
  ultimaCaptura: string | null;
  explanation: string;
}

export type SensorKey =
  | 'temperatura'
  | 'humedadAmbiente'
  | 'humedadSuelo'
  | 'nivelLuz'
  | 'entradaAnalogicaA0'
  | 'entradaDigital';

export type ComparisonOperator = '<' | '<=' | '>' | '>=' | '==' | '!=';
export type LogicalOperator = 'AND' | 'OR';
export type MathOperator = '+' | '-' | '*' | '/';

export type NumericExpressionNode =
  | { kind: 'sensor_read'; sensor: SensorKey; blockId?: string }
  | { kind: 'number_literal'; value: number; blockId?: string }
  | {
      kind: 'math_op';
      operator: MathOperator;
      left: NumericExpressionNode;
      rightNumber: number;
      blockId?: string;
    };

export type ConditionNode =
  | {
      kind: 'comparison';
      blockId?: string;
      leftSensor?: SensorKey;
      leftExpr?: NumericExpressionNode;
      leftNumber?: number;
      operator: ComparisonOperator;
      rightNumber: number;
      rightSensor?: SensorKey;
    }
  | {
      kind: 'logical';
      blockId?: string;
      operator: LogicalOperator;
      left: ConditionNode;
      right: ConditionNode;
    }
  | {
      kind: 'camera_state_check';
      blockId?: string;
    };

export type StatementNode =
  | { kind: 'bomba_on'; blockId?: string }
  | { kind: 'bomba_off'; blockId?: string }
  | { kind: 'luz_on'; blockId?: string }
  | { kind: 'luz_off'; blockId?: string }
  | { kind: 'relay_on'; blockId?: string }
  | { kind: 'relay_off'; blockId?: string }
  | { kind: 'digital_out_on'; blockId?: string }
  | { kind: 'digital_out_off'; blockId?: string }
  | { kind: 'wait'; seconds: number; blockId?: string }
  | {
      kind: 'if';
      blockId?: string;
      condition: ConditionNode | null;
      thenBranch: StatementNode[];
      elseBranch?: StatementNode[];
    }
  | { kind: 'cam_config'; blockId?: string }
  | {
      kind: 'cam_resolution';
      resolution: CameraResolutionOption;
      blockId?: string;
    }
  | { kind: 'cam_quality'; quality: number; blockId?: string }
  | { kind: 'cam_init'; blockId?: string }
  | { kind: 'cam_wifi'; ssid: string; blockId?: string }
  | { kind: 'cam_stream_start'; blockId?: string }
  | { kind: 'cam_stream_stop'; blockId?: string }
  | { kind: 'cam_capture'; blockId?: string }
  | { kind: 'data_log'; label: string; sensor: SensorKey; blockId?: string }
  | { kind: 'iot_connect_channel'; channel: number; blockId?: string }
  | { kind: 'iot_publish'; topic: string; sensor: SensorKey; blockId?: string };

export interface ParsedProgram {
  device: DeviceProfileId;
  setupStatements: StatementNode[];
  loopStatements: StatementNode[];
  startBlockId?: string;
  loopBlockId?: string;
  looseAnalogsCount?: number;
  usedSensors?: SensorKey[];
}

export interface CodeLineMapping {
  lineNumber: number;
  code: string;
  blockId?: string;
}

export interface GeneratedArduinoOutput {
  /** Vista educativa con encabezados y prototipos */
  fullCode: string;
  /** Vista educativa compacta (setup + loop) sincronizada línea por línea con bloques */
  compactCode: string;
  /** Sketch completo (.ino) 100% compilable para hardware real (Arduino CLI) */
  compilableSketch: string;
  lines: CodeLineMapping[];
  validationIssues: HardwareValidationIssue[];
}

export interface ContextualManualEntry {
  blockType: string;
  title: string;
  category: BlockCategoryId;
  previewLabel: string;
  previewColor: string;
  description: string;
  physicalComponent: string;
  dataUsed: string;
  dataType: string;
  behavior: string;
  arduinoCode: string;
  technicalNotes: string;
  deviceNotes?: Partial<Record<DeviceProfileId, string>>;
}

export interface StudioProject {
  id: string;
  name: string;
  device: DeviceProfileId;
  workspaceXml: string;
  createdAt: string;
  updatedAt: string;
}

export interface BiTechAssistantContext {
  activeDevice: DeviceProfileId;
  projectName: string;
  selectedBlockType?: string;
  selectedBlockId?: string;
  parsedProgram: ParsedProgram;
  generatedEducationalCode: string;
  generatedSketch: string;
  validationIssues: string[];
}

export interface BiTechAssistantMessage {
  id: string;
  role: 'user' | 'assistant-status';
  text: string;
  statusLabel?: string;
  contextSnapshot?: {
    activeDevice: DeviceProfileId;
    selectedBlockType?: string;
    statementCount: number;
  };
}
