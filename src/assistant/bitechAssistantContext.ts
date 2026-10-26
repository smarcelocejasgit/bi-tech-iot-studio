import { DeviceProfileId } from '../types/hardware';
import {
  BiTechAssistantContext,
  GeneratedArduinoOutput,
  ParsedProgram,
} from '../types/studio';

export const BITECH_ASSISTANT_SUGGESTIONS: readonly string[] = [
  '¿Qué hace este bloque?',
  '¿Por qué mi programa no funciona?',
  '¿Cómo uso el sensor de humedad?',
  '¿Qué significa esta condición?',
  'Explicame el código Arduino generado.',
] as const;

export interface BuildAssistantContextParams {
  activeDevice: DeviceProfileId;
  projectName: string;
  selectedBlockType?: string;
  selectedBlockId?: string;
  parsedProgram: ParsedProgram;
  generatedCode: GeneratedArduinoOutput;
}

/**
 * Construye una instantánea reutilizable y tipada del estado del proyecto
 * lista para integrarse en el futuro con un asistente pedagógico de IA.
 */
export function buildBiTechAssistantContext(
  params: BuildAssistantContextParams
): BiTechAssistantContext {
  const {
    activeDevice,
    projectName,
    selectedBlockType,
    selectedBlockId,
    parsedProgram,
    generatedCode,
  } = params;

  return {
    activeDevice,
    projectName,
    selectedBlockType,
    selectedBlockId,
    parsedProgram,
    generatedEducationalCode: generatedCode.compactCode,
    generatedSketch: generatedCode.compilableSketch,
    validationIssues: generatedCode.validationIssues.map((i) => i.message),
  };
}
