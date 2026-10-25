import { CameraResolutionOption, DeviceProfileId } from './hardware';

export type BlockCategoryId =
  | 'inicio'
  | 'sensores'
  | 'control'
  | 'actuadores'
  | 'camara'
  | 'datos'
  | 'iot';

export interface GardenSensorState {
  temperatura: number;      // °C (0 - 50)
  humedadAmbiente: number;  // % (0 - 100)
  humedadSuelo: number;     // Lectura analógica escalada 0 - 100 (o 0 - 1023, sin asumir % calibrado real)
  nivelLuz: number;         // Lectura LDR (0 - 1023)
}

export interface GardenActuatorState {
  bomba: boolean;
  iluminacion: boolean;
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

export type SensorKey = 'temperatura' | 'humedadAmbiente' | 'humedadSuelo' | 'nivelLuz';
export type ComparisonOperator = '<' | '<=' | '>' | '>=' | '==' | '!=';
export type LogicalOperator = 'AND' | 'OR';

export type ConditionNode =
  | {
      kind: 'comparison';
      blockId?: string;
      leftSensor?: SensorKey;
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
  | { kind: 'wait'; seconds: number; blockId?: string }
  | {
      kind: 'if';
      blockId?: string;
      condition: ConditionNode | null;
      thenBranch: StatementNode[];
      elseBranch?: StatementNode[];
    }
  | { kind: 'cam_config'; blockId?: string }
  | { kind: 'cam_resolution'; resolution: CameraResolutionOption; blockId?: string }
  | { kind: 'cam_quality'; quality: number; blockId?: string }
  | { kind: 'cam_init'; blockId?: string }
  | { kind: 'cam_wifi'; ssid: string; blockId?: string }
  | { kind: 'cam_stream_start'; blockId?: string }
  | { kind: 'cam_stream_stop'; blockId?: string }
  | { kind: 'cam_capture'; blockId?: string }
  | { kind: 'data_log'; label: string; sensor: SensorKey; blockId?: string }
  | { kind: 'iot_publish'; topic: string; sensor: SensorKey; blockId?: string };

export interface ParsedProgram {
  device: DeviceProfileId;
  setupStatements: StatementNode[];
  loopStatements: StatementNode[];
}

export interface CodeLineMapping {
  lineNumber: number;
  code: string;
  blockId?: string;
}

export interface GeneratedArduinoOutput {
  fullCode: string;
  compactCode: string;
  lines: CodeLineMapping[];
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
}
