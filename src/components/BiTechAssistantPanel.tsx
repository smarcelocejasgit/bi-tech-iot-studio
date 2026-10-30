import React, { useMemo, useRef, useState } from 'react';
import { Bot, LoaderCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import {
  BITECH_ASSISTANT_SUGGESTIONS,
  buildAssistantRequestContext,
} from '../assistant/bitechAssistantContext';
import { requestAssistantReply } from '../assistant/firebaseAssistant';
import { BiTechAssistantContext, BiTechAssistantMessage } from '../types/studio';

interface BiTechAssistantPanelProps {
  context: BiTechAssistantContext;
  variant?: 'inline' | 'drawer';
  onClose?: () => void;
}

const UNAVAILABLE_MESSAGE =
  'El Asistente Bi-Tech no está disponible en este momento.';
const MAX_MESSAGE_LENGTH = 1000;

export const BiTechAssistantPanel: React.FC<BiTechAssistantPanelProps> = ({
  context,
  variant = 'inline',
  onClose,
}) => {
  const [messages, setMessages] = useState<BiTechAssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageCounter = useRef(0);
  const isDrawer = variant === 'drawer';
  const requestContext = useMemo(
    () => buildAssistantRequestContext(context),
    [context]
  );

  const nextMessageId = (prefix: string) => {
    messageCounter.current += 1;
    return `${prefix}-${messageCounter.current}`;
  };

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed || isThinking) return;

    const userMessage: BiTechAssistantMessage = {
      id: nextMessageId('user'),
      role: 'user',
      text: trimmed,
    };
    const history = messages.map(({ role, text }) => ({ role, text }));

    setMessages((previous) => [...previous, userMessage]);
    setInputText('');
    setErrorMessage(null);
    setIsThinking(true);

    try {
      const reply = await requestAssistantReply({
        message: trimmed,
        context: requestContext,
        history,
      });
      setMessages((previous) => [
        ...previous,
        { id: nextMessageId('assistant'), role: 'assistant', text: reply },
      ]);
    } catch {
      setErrorMessage(UNAVAILABLE_MESSAGE);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitQuestion(inputText);
  };

  const startNewConversation = () => {
    setMessages([]);
    setInputText('');
    setErrorMessage(null);
  };

  return (
    <section
      data-testid="bitech-assistant-panel"
      className={`bg-white ${
        isDrawer
          ? 'flex h-full flex-col overflow-hidden'
          : 'rounded-2xl border border-slate-200 shadow-xs'
      }`}
    >
      <header className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold text-slate-900">
              Asistente Bi-Tech
            </h2>
            <p className="text-[11px] text-slate-600">
              Tutor contextual de tu programa
            </p>
          </div>
          <span
            data-testid="assistant-status-badge"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
          >
            IA contextual
          </span>
          {onClose && (
            <button
              type="button"
              data-testid="assistant-close-btn"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Cerrar Asistente Bi-Tech"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-slate-600">
            Te ayuda a comprender y revisar. Las decisiones del programa siguen
            siendo tuyas.
          </p>
          <button
            type="button"
            data-testid="assistant-new-conversation-btn"
            onClick={startNewConversation}
            disabled={messages.length === 0 && !errorMessage}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            Nueva conversación
          </button>
        </div>
      </header>

      <div
        data-testid="assistant-conversation-area"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <span className="mb-2 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            Acciones rápidas
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BITECH_ASSISTANT_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                data-testid={`assistant-suggestion-${index}`}
                onClick={() => void submitQuestion(suggestion)}
                disabled={isThinking}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-left text-[11px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div
          data-testid="assistant-messages-list"
          aria-live="polite"
          className="min-h-[120px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 && !isThinking && !errorMessage && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Preguntame qué hace tu programa, qué falta configurar o cómo
              interpretar un error. No modificaré tus bloques.
            </div>
          )}

          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-emerald-700 px-3 py-2 text-xs leading-relaxed text-white">
                  {message.text}
                </div>
              </div>
            ) : (
              <div
                key={message.id}
                data-testid="assistant-response"
                className="flex items-start gap-2"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800">
                  {message.text}
                </div>
              </div>
            )
          )}

          {isThinking && (
            <div
              data-testid="assistant-thinking"
              className="flex items-center gap-2 text-xs font-semibold text-slate-600"
            >
              <LoaderCircle className="h-4 w-4 animate-spin text-emerald-700" />
              Pensando…
            </div>
          )}

          {errorMessage && (
            <div
              data-testid="assistant-error"
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleFormSubmit}
        className="border-t border-slate-200 bg-white p-3"
      >
        <label htmlFor="bitech-assistant-input" className="sr-only">
          Preguntale al Asistente Bi-Tech
        </label>
        <textarea
          id="bitech-assistant-input"
          data-testid="assistant-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submitQuestion(inputText);
            }
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          placeholder="Escribí una pregunta sobre tu programa…"
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[10px] text-slate-400">
            {inputText.length}/{MAX_MESSAGE_LENGTH}
          </span>
          <button
            type="submit"
            data-testid="assistant-send-btn"
            disabled={!inputText.trim() || isThinking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar
          </button>
        </div>
      </form>
    </section>
  );
};
