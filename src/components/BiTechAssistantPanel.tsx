import React, { useState } from 'react';
import { Bot, Clock, MessageSquare, Send, Sparkles } from 'lucide-react';
import { BITECH_ASSISTANT_SUGGESTIONS } from '../assistant/bitechAssistantContext';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import {
  BiTechAssistantContext,
  BiTechAssistantMessage,
} from '../types/studio';

interface BiTechAssistantPanelProps {
  context: BiTechAssistantContext;
}

export const BiTechAssistantPanel: React.FC<BiTechAssistantPanelProps> = ({
  context,
}) => {
  const [messages, setMessages] = useState<BiTechAssistantMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  const profile = getDeviceProfile(context.activeDevice);
  const statementCount =
    context.parsedProgram.setupStatements.length +
    context.parsedProgram.loopStatements.length;

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
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(inputText);
  };

  return (
    <section
      data-testid="bitech-assistant-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3"
    >
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-900">
                Asistente Bi-Tech
              </h2>
              <span
                data-testid="assistant-status-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold"
              >
                <Clock className="w-3 h-3 text-amber-700" />
                Asistente en preparación
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Preguntá sobre tu programa, los bloques, sensores, actuadores o el
              código Arduino.
            </p>
          </div>
        </div>

        <span
          data-testid="assistant-context-indicator"
          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200"
          title="Contexto estructurado listo para futura integración de IA"
        >
          Contexto activo: {profile.shortBadge} · {statementCount} bloque(s)
        </span>
      </div>

      {/* Área de conversación y sugerencias clickeables */}
      <div
        data-testid="assistant-conversation-area"
        className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 space-y-2.5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Sugerencias:
          </span>
          {BITECH_ASSISTANT_SUGGESTIONS.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              data-testid={`assistant-suggestion-${index}`}
              onClick={() => submitQuestion(suggestion)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <div
            data-testid="assistant-messages-list"
            className="pt-2 border-t border-slate-200/80 space-y-2 max-h-44 overflow-y-auto"
          >
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-medium max-w-xl">
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
                  <div className="px-3 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 max-w-2xl">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">
                      {msg.statusLabel}
                    </span>
                    <p>{msg.text}</p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Entrada de pregunta */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <input
          type="text"
          data-testid="assistant-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Preguntale al Asistente Bi-Tech…"
          aria-label="Preguntale al Asistente Bi-Tech"
          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 focus:outline-none transition"
        />
        <button
          type="submit"
          data-testid="assistant-send-btn"
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </section>
  );
};
