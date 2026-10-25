import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, HelpCircle, Terminal } from 'lucide-react';
import { ContextualManualEntry } from '../types/studio';

interface ContextualManualPanelProps {
  entry: ContextualManualEntry;
}

export const ContextualManualPanel: React.FC<ContextualManualPanelProps> = ({
  entry,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <footer
      data-testid="contextual-manual-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Izquierda: Título ¿Qué hace este bloque? + Vista previa visual del bloque */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">
              ¿Qué hace este bloque?
            </h2>
          </div>

          {/* Píldora que simula la forma visual del bloque seleccionado */}
          <div
            data-testid="manual-block-preview"
            style={{ backgroundColor: entry.previewColor }}
            className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs flex items-center gap-2 border border-white/20"
          >
            <span>{entry.previewLabel}</span>
          </div>
        </div>

        {/* Centro: Explicación pedagógica principal (como en ui-reference-v0.1.png) */}
        <div className="flex-1 text-xs text-slate-700 leading-relaxed">
          <p data-testid="manual-description" className="font-medium text-slate-800">
            {entry.description}
          </p>
          <p className="text-slate-600 mt-0.5">{entry.behavior}</p>
        </div>

        {/* Botón para mostrar/ocultar ficha técnica detallada */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="self-start lg:self-center px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1 transition cursor-pointer shrink-0"
        >
          <span>{expanded ? 'Ocultar ficha' : 'Ficha técnica'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Ficha técnica detallada (Hardware + Tipo de Dato + Código C/C++ + Observación Técnica) */}
      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-600" />
              Componente físico
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {entry.physicalComponent}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Dato y Tipo de dato
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">{entry.dataType}</p>
            <p className="text-[11px] text-slate-500">{entry.dataUsed}</p>
          </div>

          <div className="p-2 rounded-xl bg-slate-900 text-slate-100 font-mono">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              Código Arduino generado
            </span>
            <pre className="text-[11px] text-emerald-200 mt-1 overflow-x-auto whitespace-pre-wrap">
              {entry.arduinoCode}
            </pre>
          </div>

          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Observación técnica
            </span>
            <p className="text-[11px] text-amber-950 mt-0.5 leading-snug">
              {entry.technicalNotes}
            </p>
          </div>
        </div>
      )}
    </footer>
  );
};
