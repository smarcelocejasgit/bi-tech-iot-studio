import React from 'react';
import {
  BookOpen,
  Clock3,
  CornerDownRight,
  Eye,
  GitBranch,
  Play,
  Radio,
  Repeat,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react';
import {
  DidacticNarrativeStep,
  DidacticProgramInterpretation,
  NarrativeStepKind,
} from '../interpreter/programInterpreter';

interface DidacticInterpreterViewProps {
  interpretation: DidacticProgramInterpretation;
  selectedBlockId?: string;
}

const STEP_STYLES: Record<
  NarrativeStepKind,
  { label: string; text: string; bg: string; border: string }
> = {
  start: {
    label: 'Inicio',
    text: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  configuration: {
    label: 'Preparación',
    text: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  repeat: {
    label: 'Repetición',
    text: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  read: {
    label: 'Lectura',
    text: 'text-cyan-800',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  condition: {
    label: 'Decisión',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  branch: {
    label: 'Rama',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  action: {
    label: 'Acción',
    text: 'text-violet-800',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  communication: {
    label: 'Comunicación',
    text: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  wait: {
    label: 'Espera',
    text: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  continue: {
    label: 'Continuidad',
    text: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

function getStepIcon(kind: NarrativeStepKind) {
  const className = 'w-3.5 h-3.5';
  switch (kind) {
    case 'start':
      return <Play className={className} />;
    case 'configuration':
      return <Settings className={className} />;
    case 'repeat':
      return <Repeat className={className} />;
    case 'read':
      return <Eye className={className} />;
    case 'condition':
      return <GitBranch className={className} />;
    case 'branch':
      return <CornerDownRight className={className} />;
    case 'action':
      return <Zap className={className} />;
    case 'communication':
      return <Radio className={className} />;
    case 'wait':
      return <Clock3 className={className} />;
    case 'continue':
      return <RotateCcw className={className} />;
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
        <h3 className="text-sm font-bold text-slate-800">Programa vacío</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
          {interpretation.summarySentence}
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="didactic-interpreter-view"
      className="h-full overflow-y-auto p-3 space-y-3 bg-[#f9fbfd]"
    >
      <header
        data-testid="interpreter-narrative-header"
        className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-2xs"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
              Lectura paso a paso
            </p>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900">
              Así se ejecuta tu algoritmo
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800">
            {interpretation.totalStatements} instrucción(es)
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
          Seguí el recorrido desde el primer bloque. Las sangrías muestran qué
          instrucciones están dentro de un ciclo o de una decisión.
        </p>
      </header>

      <ol
        data-testid="interpreter-narrative"
        className="relative space-y-2 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-slate-200"
      >
        {interpretation.narrativeSteps.map(
          (step: DidacticNarrativeStep, index) => {
            const style = STEP_STYLES[step.kind];
            const isHighlighted =
              Boolean(selectedBlockId) && step.blockId === selectedBlockId;
            const indentation = Math.min(step.depth, 4) * 10;

            return (
              <li
                key={step.id}
                data-testid="interpreter-narrative-step"
                data-step-kind={step.kind}
                data-step-depth={step.depth}
                className="relative flex items-start gap-2"
                style={{ marginLeft: `${indentation}px` }}
              >
                <span
                  className={`relative z-10 mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white text-[9px] font-extrabold shadow-2xs ${style.border} ${style.text}`}
                  aria-label={`Paso ${index + 1}`}
                >
                  {index + 1}
                </span>

                <article
                  className={`min-w-0 flex-1 rounded-xl border p-2.5 transition-all ${
                    isHighlighted
                      ? 'border-amber-300 bg-amber-50/90 ring-2 ring-amber-300/60 shadow-xs'
                      : `${style.border} bg-white shadow-2xs`
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.border} ${style.text}`}
                    >
                      {getStepIcon(step.kind)}
                      {style.label}
                    </span>
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {step.blockLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">
                    {step.explanation}
                  </p>
                </article>
              </li>
            );
          }
        )}
      </ol>

      <aside
        data-testid="interpreter-summary"
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
      >
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
          Síntesis del algoritmo
        </p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-slate-800">
          {interpretation.summarySentence}
        </p>
      </aside>

      <p className="pb-1 text-center text-[9.5px] text-slate-400">
        Bloque visual → función computacional → dato o acción → siguiente paso
      </p>
    </div>
  );
};
