import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  Blocks,
  BookOpen,
  Cable,
  ChevronDown,
  Cpu,
  Eye,
  FlaskConical,
  Lightbulb,
  Play,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';

interface HardwareConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjectGuide: () => void;
  onOpenLab: () => void;
}

const STUDIO_FLOW = [
  {
    title: 'Conocer',
    description: 'identificar componentes y tipo de señal',
    icon: BookOpen,
  },
  {
    title: 'Conectar',
    description: 'elegir GPIO compatible',
    icon: Cable,
  },
  {
    title: 'Programar',
    description: 'construir el algoritmo con bloques',
    icon: Blocks,
  },
  {
    title: 'Comprender',
    description: 'interpretar qué hace el programa',
    icon: Lightbulb,
  },
  {
    title: 'Probar',
    description: 'simular o transferir a la placa',
    icon: Play,
  },
  {
    title: 'Observar',
    description: 'analizar datos y comportamiento en Smart Garden Lab',
    icon: Eye,
  },
] as const;

export const HardwareConfigModal: React.FC<HardwareConfigModalProps> = ({
  isOpen,
  onClose,
  onOpenProjectGuide,
  onOpenLab,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gardenPins = Object.values(GARDEN_NODE_CONFIG.pins);
  const nodemcuPins = Object.values(NODEMCU_ESP8266_CONFIG.pins);
  const { capabilities: nmCaps } = NODEMCU_ESP8266_CONFIG;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        data-testid="studio-orientation-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-orientation-title"
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-[#f8fbf8] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-[#dff1e3] to-[#f3f8e8] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                Acerca del proyecto
              </p>
              <h2
                id="studio-orientation-title"
                className="text-lg font-extrabold text-slate-900 sm:text-xl"
              >
                Bi-Tech IoT Studio
              </h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            aria-label="Cerrar información de Bi-Tech IoT Studio"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 text-sm text-slate-700 sm:px-7 sm:py-6">
          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="max-w-4xl text-base leading-relaxed text-slate-700 sm:text-lg">
              Bi-Tech IoT Studio es un entorno educativo para diseñar,
              programar y comprender sistemas físicos conectados. Articula
              sensores, actuadores, programación por bloques, GPIO, ESP32 e
              IoT con experiencias como Smart Garden Lab.
            </p>
          </section>

          <section aria-labelledby="studio-flow-title">
            <div className="mb-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                Cómo funciona
              </p>
              <h3 id="studio-flow-title" className="text-xl font-extrabold text-slate-900">
                Del componente a la observación
              </h3>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STUDIO_FLOW.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="relative flex min-h-28 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="pr-5">
                      <span className="text-[10px] font-extrabold text-emerald-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="font-extrabold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>
                    {index < STUDIO_FLOW.length - 1 && (
                      <ArrowRight className="absolute right-3 top-4 h-4 w-4 text-emerald-300" />
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="studio-access-title">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              Accesos
            </p>
            <h3 id="studio-access-title" className="text-xl font-extrabold text-slate-900">
              Continuar explorando
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                data-testid="orientation-open-project-guide"
                onClick={() => {
                  onClose();
                  onOpenProjectGuide();
                }}
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-emerald-700 px-4 py-3 text-left font-extrabold text-white transition hover:bg-emerald-800"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Guía del proyecto
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                data-testid="orientation-open-lab"
                onClick={() => {
                  onClose();
                  onOpenLab();
                }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-left font-extrabold text-emerald-800 transition hover:bg-emerald-50"
              >
                <span className="inline-flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" /> Abrir Smart Garden Lab
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <details
            data-testid="orientation-technical-info"
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-extrabold text-slate-800 sm:px-5">
              <span className="inline-flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-700" /> Información técnica
              </span>
              <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="space-y-5 border-t border-slate-200 p-4 text-xs sm:p-5">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Separación explícita: Capacidades Físicas del Hardware vs.
                Recursos del Perfil Educativo
              </p>
              <p className="leading-relaxed">
                Bi-Tech IoT Studio distingue entre los recursos físicos reales
                del microcontrolador y el subconjunto seguro habilitado para el
                aula. Por ejemplo, en <strong>NodeMCU ESP8266 (ESP-12E)</strong>{' '}
                existen <strong>9 GPIO digitales utilizables (D0–D8)</strong>,
                mientras que el perfil educativo expone{' '}
                <strong>4 entradas y 4 salidas digitales seguras</strong> para
                evitar bloqueos de arranque en los pines de boot (
                <code>D3/GPIO0</code>, <code>D4/GPIO2</code>,{' '}
                <code>D8/GPIO15</code>).
              </p>
            </div>
          </div>

          {/* 1. NodeMCU ESP8266 — Foco V0.1.2 Hardware Readiness */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider">
                1. {NODEMCU_ESP8266_CONFIG.shortBadge} — Preparación para Placa
                Física
              </h4>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold">
                FQBN verificado: {NODEMCU_ESP8266_CONFIG.verifiedFqbn}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">
                  Capacidades Físicas Reales ({nmCaps.physicalCapabilities.mcuModel})
                </div>
                <ul className="space-y-1 text-[11px]">
                  <li>
                    • <strong>GPIO digitales utilizables:</strong>{' '}
                    {nmCaps.physicalCapabilities.totalUsableGpios} (D0–D8)
                  </li>
                  <li>
                    • <strong>Canales ADC físicos:</strong>{' '}
                    {nmCaps.physicalCapabilities.analogInputs} (
                    <code>A0</code>, resolución{' '}
                    {nmCaps.physicalCapabilities.analogResolutionBits} bits: 0–
                    {nmCaps.physicalCapabilities.analogMaxRawValue})
                  </li>
                  <li>
                    • <strong>Rango eléctrico A0:</strong>{' '}
                    <code className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      adcInputVoltageRange: {nmCaps.adcInputVoltageRange}
                    </code>
                  </li>
                </ul>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                  {nmCaps.physicalCapabilities.adcVoltageNote}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <div className="font-bold text-indigo-950 mb-1">
                  Recursos Habilitados en el Perfil Educativo
                </div>
                <ul className="space-y-1 text-[11px] text-indigo-950">
                  <li>
                    • <strong>Asignación pedagógica expuesta:</strong>{' '}
                    {nmCaps.educationalAllocation.digitalInputsExposed} entrada
                    digital dedicada + DHT11 /{' '}
                    {nmCaps.educationalAllocation.digitalOutputsExposed} salidas
                    digitales (no es el límite físico total de la placa)
                  </li>
                  <li>
                    • <strong>Pines recomendados sin conflicto de boot:</strong>{' '}
                    <code>D1 (GPIO5)</code>, <code>D2 (GPIO4)</code>,{' '}
                    <code>D5 (GPIO14)</code>, <code>D6 (GPIO12)</code>,{' '}
                    <code>D7 (GPIO13)</code>
                  </li>
                </ul>
                <p className="mt-1.5 text-[11px] text-indigo-900/80 leading-snug">
                  {nmCaps.educationalAllocation.simplificationExplanation}
                </p>
              </div>
            </div>

            {/* Tabla de Pin Naming: Etiqueta de Placa (Dx) -> GPIO Real */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2 font-bold">Constante C/C++</th>
                    <th className="p-2 font-bold">
                      Pin Placa → GPIO Candidato
                    </th>
                    <th className="p-2 font-bold">Componente</th>
                    <th className="p-2 font-bold">Cableado Definitivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nodemcuPins.map((pin) => (
                    <tr key={pin.symbolicName}>
                      <td className="p-2 font-mono font-bold text-indigo-800">
                        {pin.symbolicName}
                      </td>
                      <td className="p-2 font-mono text-slate-700 font-semibold">
                        {pin.candidateBoardLabel} →{' '}
                        {typeof pin.candidateGpio === 'number'
                          ? `GPIO${pin.candidateGpio}`
                          : pin.candidateGpio}
                      </td>
                      <td className="p-2">{pin.component}</td>
                      <td className="p-2 text-amber-700 font-medium">
                        {pin.verifiedGpio !== null
                          ? `${pin.boardLabel ?? pin.candidateBoardLabel} → GPIO${pin.verifiedGpio}`
                          : 'Pendiente verificar en placa física'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Garden Node ESP32 */}
          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              2. {GARDEN_NODE_CONFIG.shortBadge} — GPIO Físicos:{' '}
              {GARDEN_NODE_CONFIG.capabilities.physicalCapabilities.totalUsableGpios}{' '}
              · ADC: {GARDEN_NODE_CONFIG.capabilities.analogInputs} · Relay:{' '}
              {GARDEN_NODE_CONFIG.capabilities.relayChannels}
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2 font-bold">Constante C/C++</th>
                    <th className="p-2 font-bold">Etiqueta → GPIO Candidato</th>
                    <th className="p-2 font-bold">Componente</th>
                    <th className="p-2 font-bold">Estado GPIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gardenPins.map((pin) => (
                    <tr key={pin.symbolicName}>
                      <td className="p-2 font-mono font-bold text-emerald-800">
                        {pin.symbolicName}
                      </td>
                      <td className="p-2 font-mono text-slate-700">
                        {pin.candidateBoardLabel} → GPIO{pin.candidateGpio}
                      </td>
                      <td className="p-2">{pin.component}</td>
                      <td className="p-2 text-amber-700 font-medium">
                        {pin.verifiedGpio ?? 'Pendiente verificar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Camera Node */}
          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              3. {CAMERA_NODE_CONFIG.shortBadge} ({CAMERA_NODE_CONFIG.sensor})
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p>
                <strong>Canal de programación:</strong>{' '}
                {CAMERA_NODE_CONFIG.programmingChannel} ·{' '}
                <strong>Canal de streaming:</strong>{' '}
                {CAMERA_NODE_CONFIG.streamingChannel}
              </p>
              <p>
                <strong>Endpoint de streaming:</strong>{' '}
                <span className="text-amber-700 font-medium">
                  Configurable (pendiente verificar firmware real en V0.3)
                </span>
              </p>
            </div>
          </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
};
