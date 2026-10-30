import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseApp, initializeBiTechAppCheck } from '../firebase/firebaseApp';
import {
  AssistantRequestContext,
} from './bitechAssistantContext';
import {
  BITECH_ASSISTANT_LIMITS,
  BITECH_ASSISTANT_MODEL,
  BITECH_TUTOR_INSTRUCTIONS,
} from './assistantConfig';
import {
  AssistantConversationTurn,
  enforcePedagogicalGuardrails,
  sanitizeAssistantContext,
  sanitizeAssistantHistory,
  sanitizeAssistantText,
} from './assistantSecurity';

function buildPrompt(params: {
  message: string;
  context: AssistantRequestContext;
  history: AssistantConversationTurn[];
}): string {
  const historyText = params.history.length
    ? params.history
        .map((turn) =>
          `${turn.role === 'assistant' ? 'Tutor' : 'Estudiante'}: ${turn.text}`
        )
        .join('\n')
    : 'Sin conversación previa.';

  return [
    'CONTEXTO PEDAGÓGICO SANITIZADO',
    JSON.stringify(params.context),
    '',
    'HISTORIAL RECIENTE',
    historyText,
    '',
    `PREGUNTA ACTUAL DEL ESTUDIANTE: ${params.message}`,
  ].join('\n');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error('assistant-timeout')),
      timeoutMs
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}

export async function requestAssistantReply(params: {
  message: string;
  context: AssistantRequestContext;
  history: AssistantConversationTurn[];
}): Promise<string> {
  const message = sanitizeAssistantText(
    params.message,
    BITECH_ASSISTANT_LIMITS.maxMessageLength
  );
  if (!message) throw new Error('assistant-empty-message');

  const context = sanitizeAssistantContext(params.context);
  const history = sanitizeAssistantHistory(params.history);

  initializeBiTechAppCheck();
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: BITECH_ASSISTANT_MODEL,
    systemInstruction: BITECH_TUTOR_INSTRUCTIONS,
    generationConfig: {
      maxOutputTokens: BITECH_ASSISTANT_LIMITS.maxOutputTokens,
      temperature: 0.25,
    },
  });

  const result = await withTimeout(
    model.generateContent(buildPrompt({ message, context, history })),
    BITECH_ASSISTANT_LIMITS.requestTimeoutMs
  );
  const reply = result.response.text()?.trim();
  if (!reply) throw new Error('assistant-empty-response');

  return sanitizeAssistantText(
    enforcePedagogicalGuardrails({ reply, context }),
    BITECH_ASSISTANT_LIMITS.maxReplyLength
  );
}

export { buildPrompt };
