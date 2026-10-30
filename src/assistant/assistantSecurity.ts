import {
  AssistantRequestContext,
  AssistantSelectedBlockContext,
} from './bitechAssistantContext';
import { BITECH_ASSISTANT_LIMITS } from './assistantConfig';

export interface AssistantConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

const REDACTED = '[REDACTED]';

export function sanitizeAssistantText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(/\b(?:AIza|sk-)[A-Za-z0-9_-]{12,}\b/g, REDACTED)
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP REDACTADA]')
    .replace(
      /(password|contrase(?:ñ|n)a|api[_ -]?key|authorization|token|secret|credential|ssid)\s*[:=]\s*[^,;\s]+/gi,
      `$1: ${REDACTED}`
    )
    .slice(0, maxLength)
    .trim();
}

function sanitizeSelectedBlock(
  block: AssistantSelectedBlockContext
): AssistantSelectedBlockContext {
  return {
    component: sanitizeAssistantText(block.component, 100),
    signalType: sanitizeAssistantText(block.signalType, 120),
    requiredCapability: sanitizeAssistantText(block.requiredCapability, 100),
    pin: block.pin ? sanitizeAssistantText(block.pin, 30) : null,
    selectionState: ['missing', 'compatible', 'incompatible'].includes(
      block.selectionState
    )
      ? block.selectionState
      : 'missing',
    physicalEvidence:
      block.physicalEvidence === 'validated' ? 'validated' : 'not-validated',
  };
}

export function sanitizeAssistantContext(
  context: AssistantRequestContext
): AssistantRequestContext {
  return {
    profile: sanitizeAssistantText(context.profile, 120),
    mode: ['program', 'simulate', 'board'].includes(context.mode)
      ? context.mode
      : 'program',
    programSummary: sanitizeAssistantText(context.programSummary, 1500),
    validation: context.validation
      .slice(0, 12)
      .map((item) => sanitizeAssistantText(item, 350)),
    selectedBlocks: context.selectedBlocks
      .slice(0, 12)
      .map(sanitizeSelectedBlock),
    channel: Number.isInteger(context.channel) ? context.channel : null,
  };
}

export function sanitizeAssistantHistory(
  history: AssistantConversationTurn[]
): AssistantConversationTurn[] {
  return history
    .slice(-BITECH_ASSISTANT_LIMITS.maxHistoryTurns)
    .map((turn) => ({
      role: turn.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      text: sanitizeAssistantText(
        turn.text,
        BITECH_ASSISTANT_LIMITS.maxHistoryTurnLength
      ),
    }))
    .filter((turn) => turn.text.length > 0);
}

export function enforcePedagogicalGuardrails(params: {
  reply: string;
  context: AssistantRequestContext;
}): string {
  const pending = params.context.selectedBlocks.find(
    (block) => block.selectionState === 'missing'
  );
  const proposesConcretePin =
    /\bGPIO\s*\d+\b|\bD[0-8]\b|\bA0\b/i.test(params.reply);
  if (!pending || !proposesConcretePin) return params.reply;

  return [
    `Todavía falta seleccionar el GPIO para ${pending.component}.`,
    `Este componente utiliza ${pending.signalType} y requiere ${pending.requiredCapability}.`,
    'Revisá las opciones compatibles que ofrece el selector del bloque y elegí el pin que corresponda a tu conexión física.',
  ].join(' ');
}
