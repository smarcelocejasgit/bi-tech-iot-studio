import React, { useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { BITECH_ASSISTANT_SUGGESTIONS } from '../assistant/bitechAssistantContext';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import {
  BiTechAssistantContext,
  BiTechAssistantMessage,
} from '../types/studio';

interface BiTechAssistantPanelProps {
  context: BiTechAssistantContext;
  variant?: 'inline' | 'drawer';
  onClose?: () => void;
}

export const BiTechAssistantPanel: React.FC<BiTechAssistantPanelProps> = ({
  context,
  variant = 'inline',
  onClose,
}) => {
  const [messages, setMessages] = useState<BiTechAssistantMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const profile = getDeviceProfile(context.activeDevice);
  const statementCount =
    context.parsedProgram.setupStatements.length +
    context.parsedProgram.loopStatements.length;
  const isDrawer = variant === 'drawer';

  const submitQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    const userMsg: BiTechAssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const statusReply: BiTechAssistantMessage = {
      id: `status-${Date.now() + 1}`,
      role: 'assistant-status',
      statusLabel: 'Asistente en preparación',
      text: `Asistente en preparación — Tu consulta fue registrada junto con el contexto real de tu proyecto (${profile.shortBadge}, ${statementCount} bloque(s) activos). La conexión con el modelo pedagógico aún no está habilitada en esta versión.`,
      contextSnapshot: {
        activeDevice: context.activeDevice,
        selectedBlockType: context.selectedBlockType,
        statementCount,
      },
    };

    setMessages((prev) => [...prev, userMsg, statusReply]);
    setInputText('');
    setIsExpanded(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(inputText);
  };

  return (
    <section
      data-testid="bitech-assistant-panel"
      className={`bg-white px-3.5 py-3 ${
        isDrawer
          ? 'h-full flex flex-col gap-3 overflow-y-auto'
          : 'rounded-2xl border border-slate-200/90 shadow-xs space-y-2'
      }`}
    >
      {/* Fila principal compacta: Encabezado + Texto breve + Entrada + Enviar */}
      <div
        className={`flex justify-between gap-2.5 ${
          isDrawer ? 'flex-col' : 'flex-col lg:flex-row lg:items-center'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span aria-hidden="true">💬</span>
            <span>Asistente Bi-Tech</span>
          </h2>

          <span className="text-xs text-slate-600">
            Preguntá sobre tu programa…
          </span>

          <span
            data-testid="assistant-status-badge"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold"
          >
            <Clock className="w-3 h-3 text-amber-700" />
            Asistente en preparación
          </span>

          {isDrawer && onClose && (
            <button
              type="button"
              data-testid="assistant-close-btn"
              onClick={onClose}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              aria-label="Cerrar Asistente Bi-Tech"
              title="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form
          onSubmit={handleFormSubmit}
          className={`flex items-center gap-1.5 ${
            isDrawer ? 'w-full' : 'flex-1 max-w-2xl'
          }`}
        >
          <input
            type="text"
            data-testid="assistant-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Preguntale al Asistente Bi-Tech…"
            aria-label="Preguntale al Asistente Bi-Tech"
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 text-xs text-slate-800 focus:outline-none transition"
          />
          <button
            type="submit"
            data-testid="assistant-send-btn"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              data-testid="assistant-toggle-conversation-btn"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1 transition cursor-pointer shrink-0"
              title={
                isExpanded ? 'Contraer conversación' : 'Mostrar conversación'
              }
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </form>
      </div>

      {/* Sugerencias rápidas en una sola línea compacta */}
      <div
        data-testid="assistant-conversation-area"
        className={`flex gap-1.5 pb-0.5 ${
          isDrawer
            ? 'flex-wrap items-start overflow-y-auto'
            : 'items-center overflow-x-auto'
        }`}
      >
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Sugerencias:
        </span>
        {BITECH_ASSISTANT_SUGGESTIONS.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            data-testid={`assistant-suggestion-${index}`}
            onClick={() => submitQuestion(suggestion)}
            className="px-2.5 py-0.5 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Área de conversación expandida únicamente cuando existen mensajes */}
      {messages.length > 0 && isExpanded && (
        <div
          data-testid="assistant-messages-list"
          className={`pt-2 border-t border-slate-100 space-y-2 overflow-y-auto ${
            isDrawer ? 'max-h-none flex-1' : 'max-h-40'
          }`}
        >
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-medium max-w-xl">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                data-testid="assistant-status-response"
                className="flex items-start gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 max-w-2xl">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-800 block">
                    {msg.statusLabel}
                  </span>
                  <p>{msg.text}</p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};
