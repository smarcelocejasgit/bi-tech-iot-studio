import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  Blocks,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ExternalLink,
  FlaskConical,
  Image as ImageIcon,
  Microscope,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import {
  DidacticAlgorithm,
  getAlgorithmsForProfile,
} from '../guide/algorithmsCatalog';
import { getComponentsForProfile } from '../guide/componentsCatalog';
import { getConnectionDiagramsForProfile } from '../guide/connectionDiagrams';
import { PROJECT_GUIDE_PROFILES } from '../guide/projectGuideData';
import {
  algorithmToGuideResource,
  componentToGuideResource,
  diagramToGuideResource,
  GuideResource,
  GuideResourceDetail,
} from '../guide/guideResources';
import { DeviceProfileId } from '../types/hardware';

const GUIDE_STEPS = [
  'Proyecto',
  'Componentes',
  'Conexiones',
  'Algoritmo',
  'Programar',
  'Probar',
  'Observar',
] as const;

interface ProjectGuideDrawerProps {
  activeDevice: DeviceProfileId;
  projectName: string;
  onClose: () => void;
  onGoProgram: () => void;
}

const ValidationBadge: React.FC<{
  status: 'validated' | 'pending';
}> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
      status === 'validated'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-amber-100 text-amber-800'
    }`}
  >
    {status === 'validated' ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : (
      <CircleDot className="h-3.5 w-3.5" />
    )}
    {status === 'validated'
      ? 'Validado en hardware'
      : 'Pendiente de validación física'}
  </span>
);

export const ProjectGuideDrawer: React.FC<ProjectGuideDrawerProps> = ({
  activeDevice,
  projectName,
  onClose,
  onGoProgram,
}) => {
  const [step, setStep] = useState(0);
  const [selectedResource, setSelectedResource] =
    useState<GuideResource | null>(null);
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<string | null>(
    null
  );

  const profile = PROJECT_GUIDE_PROFILES[activeDevice];
  const components = useMemo(
    () => getComponentsForProfile(activeDevice),
    [activeDevice]
  );
  const diagrams = useMemo(
    () => getConnectionDiagramsForProfile(activeDevice),
    [activeDevice]
  );
  const algorithms = useMemo(
    () => getAlgorithmsForProfile(activeDevice),
    [activeDevice]
  );
  const selectedAlgorithm: DidacticAlgorithm | undefined =
    algorithms.find((algorithm) => algorithm.id === selectedAlgorithmId) ??
    algorithms[0];

  return (
    <div
      data-testid="project-guide-overlay"
      className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        data-testid="project-guide-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Guía del proyecto"
        className="ml-auto flex h-full w-full max-w-[880px] flex-col border-l border-emerald-200 bg-[#f8fbf8] shadow-2xl"
      >
        <header className="border-b border-emerald-200 bg-gradient-to-r from-[#dff1e3] to-[#f3f8e8] px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Conocer → construir → probar
                </p>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Guía del proyecto
                </h2>
                <p className="text-sm text-slate-600">{profile.name}</p>
              </div>
            </div>
            <button
              type="button"
              data-testid="close-project-guide"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar Guía del proyecto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav
            className="mt-4 flex gap-1.5 overflow-x-auto pb-1"
            aria-label="Pasos de la Guía del proyecto"
          >
            {GUIDE_STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                data-testid={`guide-step-${index + 1}`}
                onClick={() => setStep(index)}
                className={`flex min-w-fit items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                  step === index
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-200 bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step === index ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {index + 1}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {step === 0 && (
            <section data-testid="guide-project-step" className="space-y-6">
              <div className="grid gap-5 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:grid-cols-[1.05fr_1fr] sm:p-7">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                    Proyecto activo: {projectName}
                  </span>
                  <h3 className="text-3xl font-extrabold leading-tight text-slate-900">
                    {profile.name}
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-700">
                    {profile.purpose}
                  </p>
                </div>
                <img
                  src={profile.heroImage}
                  alt={`Vista pedagógica de ${profile.name}`}
                  className="h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Problema para investigar', profile.question],
                  ['Qué vas a construir', profile.build],
                  ['Qué podrás observar', profile.observe],
                ].map(([title, text]) => (
                  <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-extrabold text-emerald-800">{title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section data-testid="guide-components-step">
              <StepHeading
                eyebrow="Conocer antes de conectar"
                title="Componentes del perfil activo"
                description="Primero aparecen sólo las piezas que forman parte de este prototipo. Abrí una ficha cuando necesites más detalle."
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {components.map((component) => (
                  <article
                    key={component.id}
                    data-testid={`guide-component-${component.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <img
                      src={component.image}
                      alt={component.name}
                      className="h-40 w-full bg-slate-50 object-contain"
                    />
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-xl font-extrabold text-slate-900">{component.name}</h3>
                        <ValidationBadge status={component.validationStatus} />
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">{component.whatDoes}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResource(componentToGuideResource(component))
                        }
                        className="inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        Abrir lámina <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section data-testid="guide-connections-step">
              <StepHeading
                eyebrow="Conectar con evidencia"
                title="Conexiones del prototipo"
                description="Los diagramas distinguen lo que ya fue probado de aquello que todavía necesita validación física."
              />
              <div className="mt-5 space-y-4">
                {diagrams.map((diagram) => (
                  <article
                    key={diagram.id}
                    data-testid={`guide-connection-${diagram.id}`}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[220px_1fr]"
                  >
                    <img src={diagram.image} alt={diagram.title} className="h-36 w-full rounded-xl bg-slate-50 object-contain" />
                    <div className="flex flex-col items-start justify-center">
                      <ValidationBadge status={diagram.validationStatus} />
                      <h3 className="mt-2 text-xl font-extrabold text-slate-900">{diagram.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{diagram.summary}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResource(diagramToGuideResource(diagram))
                        }
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-sm font-extrabold text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4" /> Abrir lámina
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {step === 3 && selectedAlgorithm && (
            <section data-testid="guide-algorithm-step">
              <StepHeading
                eyebrow="Pensar antes de programar"
                title="La lógica del problema"
                description="El algoritmo explica qué debe ocurrir. Después podrás reconocer cada idea en los bloques de Blockly."
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {algorithms.map((algorithm) => (
                  <button
                    key={algorithm.id}
                    type="button"
                    onClick={() => setSelectedAlgorithmId(algorithm.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                      selectedAlgorithm.id === algorithm.id
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {algorithm.title}
                  </button>
                ))}
              </div>
              <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedResource(
                      algorithmToGuideResource(selectedAlgorithm)
                    )
                  }
                  className="group relative block w-full cursor-zoom-in overflow-hidden bg-slate-50"
                  aria-label={`Abrir lámina del algoritmo ${selectedAlgorithm.title}`}
                >
                  <img src={selectedAlgorithm.image} alt={selectedAlgorithm.title} className="h-64 w-full object-contain transition duration-200 group-hover:scale-[1.015]" />
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-extrabold text-white shadow-lg">
                    <Maximize2 className="h-4 w-4" /> Abrir lámina
                  </span>
                </button>
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">{selectedAlgorithm.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{selectedAlgorithm.purpose}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-1 text-xs font-bold text-emerald-800">
                      {selectedAlgorithm.flow.map((item, index) => (
                        <React.Fragment key={item}>
                          <span className="rounded-lg bg-emerald-50 px-2 py-1">{item}</span>
                          {index < selectedAlgorithm.flow.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4 text-slate-100">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">Pseudocódigo sencillo</p>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-sm leading-7">{selectedAlgorithm.pseudocode.join('\n')}</pre>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-amber-50 px-5 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-amber-800">Lo vas a construir con estos bloques</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedAlgorithm.blockTypes.join(' · ')}</p>
                </div>
              </article>
            </section>
          )}

          {step === 4 && (
            <section data-testid="guide-program-step" className="mx-auto max-w-2xl py-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <Blocks className="h-10 w-10" />
              </div>
              <h3 className="mt-5 text-3xl font-extrabold text-slate-900">Ahora llevá la idea a bloques</h3>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                Cerrá la guía y construí el algoritmo en el proyecto actual. No se agregarán bloques automáticamente: las decisiones siguen siendo tuyas.
              </p>
              <button
                type="button"
                data-testid="guide-go-program"
                onClick={onGoProgram}
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-base font-extrabold text-white shadow-lg hover:bg-emerald-800 cursor-pointer"
              >
                <Blocks className="h-5 w-5" /> Ir a programar
              </button>
            </section>
          )}

          {step === 5 && (
            <section data-testid="guide-test-step">
              <StepHeading
                eyebrow="Comprobar con evidencias"
                title="Dos maneras de probar"
                description="Primero revisá la lógica. Después comprobá el comportamiento físico cuando tengas la placa y los componentes conectados."
              />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TestCard
                  icon={<FlaskConical className="h-8 w-8" />}
                  title="Simular"
                  text="Cambiá valores virtuales y observá qué rama del algoritmo se ejecuta."
                  evidence="Evidencia: decisiones, estados y acciones virtuales coherentes."
                />
                <TestCard
                  icon={<Beaker className="h-8 w-8" />}
                  title="Placa real"
                  text="Compilá, cargá y observá el Monitor Serie y el prototipo físico."
                  evidence="Evidencia: lecturas reales, respuesta física y ausencia de errores."
                />
              </div>
            </section>
          )}

          {step === 6 && (
            <section data-testid="guide-observe-step" className="space-y-6">
              <StepHeading
                eyebrow="Mirar para volver a pensar"
                title="Observar en Smart Garden Lab"
                description="El laboratorio reúne datos, cámara, estados y acciones para comparar lo que esperabas con lo que realmente ocurrió."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <Microscope className="h-9 w-9 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-extrabold text-slate-900">Datos y comportamiento</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">Observá mediciones disponibles, cámara, estados de conexión y acciones del prototipo.</p>
                </article>
                <article className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-cyan-800">Canal Bi-Tech</p>
                  <p className="mt-3 text-base font-bold leading-relaxed text-slate-800">
                    El canal permite que los dispositivos que forman parte del mismo proyecto se encuentren en Smart Garden Lab.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Por ejemplo, Canal 1 puede reunir Garden Node 01 y Camera Node 01. El canal no es una contraseña.</p>
                </article>
              </div>
              <a
                data-testid="guide-open-lab"
                href="/lab"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-base font-extrabold text-white shadow-md hover:bg-cyan-800"
              >
                <ExternalLink className="h-5 w-5" /> Abrir Smart Garden Lab
              </a>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-7">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-xs font-bold text-slate-500">{step + 1} de {GUIDE_STEPS.length}</span>
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(GUIDE_STEPS.length - 1, current + 1))}
            disabled={step === GUIDE_STEPS.length - 1}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        </footer>

        {selectedResource && (
          <ResourceViewer
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
          />
        )}
      </aside>
    </div>
  );
};

const StepHeading: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
}> = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
    <h3 className="mt-1 text-3xl font-extrabold text-slate-900">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
  </div>
);

const TestCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  text: string;
  evidence: string;
}> = ({ icon, title, text, evidence }) => (
  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">{icon}</div>
    <h3 className="mt-4 text-2xl font-extrabold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{evidence}</p>
  </article>
);

const RESOURCE_KIND_LABELS: Record<GuideResource['kind'], string> = {
  component: 'Componente',
  diagram: 'Diagrama de conexión',
  algorithm: 'Algoritmo',
};

const ResourceViewer: React.FC<{
  resource: GuideResource;
  onClose: () => void;
}> = ({ resource, onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      data-testid="guide-resource-viewer"
      className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`guide-resource-title-${resource.id}`}
        className={`flex max-h-[96vh] w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all ${
          expanded ? 'max-w-[96vw]' : 'max-w-5xl'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              Lámina de estudio · {RESOURCE_KIND_LABELS[resource.kind]}
            </p>
            <h3
              id={`guide-resource-title-${resource.id}`}
              className="truncate text-lg font-extrabold text-slate-900 sm:text-xl"
            >
              {resource.title}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label={expanded ? 'Reducir lámina' : 'Abrir lámina en grande'}
              aria-pressed={expanded}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {expanded ? 'Reducir' : 'Abrir en grande'}
              </span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar lámina"
              className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f8fafc_72%)] p-4 sm:p-7">
            <img
              src={resource.imageSrc}
              alt={resource.imageAlt}
              className={`mx-auto w-full object-contain transition-all ${
                expanded
                  ? 'h-[72vh] min-h-[420px]'
                  : 'h-[48vh] min-h-[340px] max-h-[580px]'
              }`}
            />
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {resource.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900">
                {resource.title}
              </h3>
              <p className="max-w-4xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {resource.summary}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {resource.details.map((detail) => (
                <ResourceDetail key={detail.title} detail={detail} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ResourceDetail: React.FC<{ detail: GuideResourceDetail }> = ({
  detail,
}) => {
  const content = Array.isArray(detail.content)
    ? detail.content
    : [detail.content];

  if (detail.kind === 'code') {
    return (
      <section className="rounded-2xl bg-slate-900 p-5 text-slate-100 sm:col-span-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-300">
          {detail.title}
        </h4>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-7">
          {content.join('\n')}
        </pre>
      </section>
    );
  }

  if (detail.kind === 'flow') {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:col-span-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">
          {detail.title}
        </h4>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {content.map((item, index) => (
            <React.Fragment key={item}>
              <span className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
                {item}
              </span>
              {index < content.length - 1 && (
                <ArrowRight className="h-4 w-4 text-emerald-700" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">
        {detail.title}
      </h4>
      {detail.kind === 'list' ? (
        <ul className="mt-3 space-y-2">
          {content.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {content[0]}
        </p>
      )}
    </section>
  );
};
