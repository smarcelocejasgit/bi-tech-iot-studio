import React from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Eye,
  GitBranch,
  Play,
  Radio,
  Repeat,
  Zap,
} from 'lucide-react';
import {
  DIDACTIC_CATEGORIES,
  DidacticCategoryKey,
  DidacticItem,
  DidacticProgramInterpretation,
} from '../interpreter/programInterpreter';

interface DidacticInterpreterViewProps {
  interpretation: DidacticProgramInterpretation;
  selectedBlockId?: string;
}

function getCategoryIcon(key: DidacticCategoryKey) {
  switch (key) {
    case 'start':
      return <Play className="w-3.5 h-3.5 text-sky-700" />;
    case 'observe':
      return <Eye className="w-3.5 h-3.5 text-teal-700" />;
    case 'decide':
      return <GitBranch className="w-3.5 h-3.5 text-amber-700" />;
    case 'act':
      return <Zap className="w-3.5 h-3.5 text-emerald-700" />;
    case 'communicate':
      return <Radio className="w-3.5 h-3.5 text-indigo-700" />;
    case 'repeat':
      return <Repeat className="w-3.5 h-3.5 text-purple-700" />;
  }
}

export const DidacticInterpreterView: React.FC<DidacticInterpreterViewProps> = ({
  interpretation,
  selectedBlockId,
}) => {
  if (interpretation.isEmpty) {
    return (
      <div
        data-testid="interpreter-empty-state"
        className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/50"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800 mb-3 shadow-2xs">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Programa vacío
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Arrastrá bloques al área de programación para que el intérprete didáctico
          te explique paso a paso qué hará la placa.
        </p>
        <div className="mt-4 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-600 shadow-2xs text-left max-w-xs space-y-1">
          <span className="font-bold text-emerald-800 block">
            💡 Recorrido pedagógico:
          </span>
          <p className="leading-snug text-slate-600">
            <strong>Bloque</strong> → <strong>Interpretación</strong> →{' '}
            <strong>Código</strong> → <strong>Placa</strong> →{' '}
            <strong>Comportamiento real</strong>
          </p>
        </div>
      </div>
    );
  }

  const { activeCategories, itemsByCategory } = interpretation;

  return (
    <div
      data-testid="didactic-interpreter-view"
      className="h-full overflow-y-auto p-3.5 space-y-3.5 bg-[#f9fbfd]"
    >
      {/* Síntesis pedagógica y ruta de fases activas */}
      <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Flujo de ejecución del programa
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {interpretation.totalStatements} instrucción(es)
          </span>
        </div>

        <div
          data-testid="interpreter-pipeline-badges"
          className="flex flex-wrap items-center gap-1.5 pt-0.5"
        >
          {activeCategories.map((catKey, idx) => {
            const meta = DIDACTIC_CATEGORIES[catKey];
            return (
              <React.Fragment key={catKey}>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${meta.bgClass} ${meta.colorClass} ${meta.borderClass}`}
                >
                  {getCategoryIcon(catKey)}
                  <span>{meta.label}</span>
                </span>
                {idx < activeCategories.length - 1 && (
                  <span className="text-slate-300 text-xs select-none">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Categorías didácticas con sus explicaciones correspondientes */}
      <div className="space-y-3">
        {activeCategories.map((catKey) => {
          const meta = DIDACTIC_CATEGORIES[catKey];
          const items = itemsByCategory[catKey];

          return (
            <section
              key={catKey}
              data-testid={`interpreter-category-${catKey}`}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden"
            >
              {/* Encabezado de la categoría */}
              <div
                className={`px-3 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2 ${meta.bgClass}/40`}
              >
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(catKey)}
                  <h4
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${meta.colorClass}`}
                  >
                    {meta.label}
                  </h4>
                </div>
                <span className="text-[9px] font-semibold text-slate-500">
                  {meta.badgeLabel}
                </span>
              </div>

              {/* Lista de explicaciones */}
              <div className="p-2.5 space-y-2">
                {items.map((item: DidacticItem) => {
                  const isHighlighted =
                    Boolean(selectedBlockId) && item.blockId === selectedBlockId;

                  return (
                    <article
                      key={item.id}
                      data-testid={`interpreter-item-${item.category}`}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isHighlighted
                          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/60 shadow-xs'
                          : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-slate-800 leading-snug text-[12px]">
                          {item.title}
                        </h5>
                        {item.tag && (
                          <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {item.tag}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-slate-600 leading-relaxed text-[11.5px]">
                        {item.explanation}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Pie de página con el principio pedagógico */}
      <div className="pt-1 pb-2 text-center">
        <p className="text-[10px] text-slate-400">
          Recorrido pedagógico: Bloque → Interpretación → Código → Placa → Comportamiento real
        </p>
      </div>
    </div>
  );
};
