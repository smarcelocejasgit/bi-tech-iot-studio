import React, { useEffect, useState } from 'react';
import {
  Camera,
  Clock,
  Download,
  Droplets,
  Maximize2,
  Sprout,
  Sun,
  Thermometer,
  Cpu,
  Activity,
  Power,
  Wifi,
} from 'lucide-react';
import {
  DEMO_SMART_GARDEN_NODE,
  GardenLabDataSource,
  liveGardenLabDataSource,
  SmartGardenLiveState,
} from './smartGardenLive';
import { CAMERA_GATEWAY_CONFIG } from './cameraGateway';

type LabSection = 'live' | 'captures' | 'monitor' | 'control';

const LAB_SECTIONS: { id: LabSection; label: string; description: string }[] = [
  { id: 'live', label: 'En vivo', description: '' },
  {
    id: 'captures',
    label: 'Capturas',
    description:
      'Galería de capturas del Camera Node para comparar la evolución de la huerta.',
  },
  {
    id: 'monitor',
    label: 'Monitorear',
    description:
      'Historial y gráficos de las variables ambientales a lo largo del tiempo.',
  },
  {
    id: 'control',
    label: 'Control',
    description:
      'Panel para observar y gestionar los actuadores del Garden Node.',
  },
];

const PEDAGOGICAL_CYCLE = [
  'Observar',
  'Medir',
  'Interpretar',
  'Decidir',
  'Actuar',
  'Volver a medir',
  'Comparar',
];

const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" } as const;

/** Hook mínimo que desacopla la UI del origen de datos (hoy: demostración). */
export function useGardenLabState(
  dataSource: GardenLabDataSource
): SmartGardenLiveState {
  const [state, setState] = useState<SmartGardenLiveState>(() =>
    dataSource.getSnapshot()
  );
  useEffect(() => dataSource.subscribe(setState), [dataSource]);
  return state;
}

function useClock(): string {
  const format = () =>
    new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  const [time, setTime] = useState<string>(format);
  useEffect(() => {
    const id = window.setInterval(() => setTime(format()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

interface SmartGardenLabProps {
  dataSource?: GardenLabDataSource;
}

function useCameraGatewayStatus(): {
  configured: boolean;
  connected: boolean;
  streamUrl?: string;
  markDisconnected: () => void;
} {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const gatewayConfig = CAMERA_GATEWAY_CONFIG;
    if (!gatewayConfig) return;

    let cancelled = false;
    let nextProbe: number | undefined;

    const probe = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      let available = false;

      try {
        const probeUrl = new URL(gatewayConfig.captureUrl);
        probeUrl.searchParams.set('probe', String(Date.now()));
        const response = await fetch(probeUrl, {
          headers: { Accept: 'image/jpeg' },
          cache: 'no-store',
          signal: controller.signal,
        });
        const contentType = response.headers.get('content-type') ?? '';
        const payload = response.ok ? await response.arrayBuffer() : null;
        available =
          response.ok &&
          contentType.toLowerCase().startsWith('image/jpeg') &&
          Boolean(payload?.byteLength);
      } catch {
        available = false;
      } finally {
        window.clearTimeout(timeout);
      }

      if (cancelled) return;
      setConnected(available);
      nextProbe = window.setTimeout(probe, 5000);
    };

    void probe();
    return () => {
      cancelled = true;
      if (nextProbe !== undefined) window.clearTimeout(nextProbe);
    };
  }, []);

  return {
    configured: CAMERA_GATEWAY_CONFIG !== null,
    connected,
    streamUrl: connected ? CAMERA_GATEWAY_CONFIG?.streamUrl : undefined,
    markDisconnected: () => setConnected(false),
  };
}

export const SmartGardenLab: React.FC<SmartGardenLabProps> = ({
  dataSource = liveGardenLabDataSource,
}) => {
  const dataState = useGardenLabState(dataSource);
  const cameraGateway = useCameraGatewayStatus();
  const state: SmartGardenLiveState = cameraGateway.configured
    ? {
        ...dataState,
        cameraNodeConnected: cameraGateway.connected,
        cameraStreamUrl: cameraGateway.streamUrl,
      }
    : dataState;
  const clock = useClock();
  const [section, setSection] = useState<LabSection>('live');
  const activeSection = LAB_SECTIONS.find((s) => s.id === section)!;

  return (
    <div
      data-testid="smart-garden-lab"
      className="min-h-screen text-[#1f3d2a] pb-10"
      style={{
        background:
          'linear-gradient(180deg, #f7f4e9 0%, #f1eee2 55%, #ebe8da 100%)',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-5 pt-6">
        {/* Cabecera */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2f7d46] text-white flex items-center justify-center text-lg font-extrabold shadow-sm shrink-0">
              SG
            </div>
            <div>
              <h1
                className="text-[28px] leading-tight font-bold text-[#1d4a2c]"
                style={SERIF}
              >
                Smart Garden Lab Bi-Tech
              </h1>
              <p className="text-sm text-[#4f6354] mt-0.5">
                Laboratorio de ciencias, datos y automatización aplicado a una
                huerta inteligente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {state.source === 'demo' && (
              <span
                data-testid="lab-demo-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3dfa6] text-[#6b5314] text-xs font-extrabold uppercase tracking-wider border border-[#e0c776]"
              >
                <span className="w-2 h-2 rounded-full bg-[#b8901f]" />
                Modo demostración
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7e4d6] text-xs font-semibold text-[#3d5243]">
              <Clock className="w-3.5 h-3.5" />
              {clock}
            </span>
          </div>
        </header>

        {/* Navegación interna */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Secciones de Smart Garden Lab"
            className="flex flex-wrap gap-2.5"
          >
            {LAB_SECTIONS.map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`lab-tab-${item.id}`}
                  onClick={() => setSection(item.id)}
                  className={`min-w-[150px] px-6 py-3 rounded-xl border text-[11px] font-extrabold uppercase tracking-[0.14em] transition cursor-pointer ${
                    isActive
                      ? 'bg-[#2f7d46] border-[#2f7d46] text-white shadow-sm'
                      : 'bg-[#fffdf6] border-[#ddd8c2] text-[#3d5243] hover:bg-white'
                  }`}
                >
                  <span className="block">{item.label}</span>
                  {item.id !== 'live' && (
                    <span className="block mt-0.5 text-[8px] font-bold tracking-widest text-[#9a8a4a]">
                      Próxima etapa
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled
            data-testid="lab-export-btn"
            className="px-4 py-2 rounded-xl bg-[#f3dfa6] border border-[#e0c776] text-[#6b5314] text-[11px] font-bold flex items-center gap-2 opacity-90 cursor-not-allowed"
            title="Disponible en una próxima etapa"
          >
            <Download className="w-4 h-4" />
            <span className="text-left leading-tight">
              Exportar datos
              <span className="block text-[9px] uppercase tracking-wider">
                Próximamente
              </span>
            </span>
          </button>
        </div>

        {/* Título de sección + Smart Garden activo */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold text-[#1d4a2c]" style={SERIF}>
            {activeSection.label}
          </h2>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#4f6354]">
            <span>Smart Garden activo</span>
            <select
              data-testid="lab-active-garden-select"
              aria-label="Smart Garden activo"
              value={state.nodeId ?? DEMO_SMART_GARDEN_NODE.id}
              onChange={() => undefined}
              className="px-3 py-1.5 rounded-lg bg-[#fffdf6] text-[#1d4a2c] text-xs font-bold border border-[#ddd8c2] focus:outline-none"
            >
              <option value={state.nodeId ?? DEMO_SMART_GARDEN_NODE.id}>
                {state.nodeLabel
                  ? `${state.nodeLabel} — Real`
                  : DEMO_SMART_GARDEN_NODE.label}
              </option>
            </select>
          </label>
        </div>

        <main className="mt-3">
          {section === 'live' ? (
            <LiveView
              state={state}
              onCameraStreamError={cameraGateway.markDisconnected}
            />
          ) : (
            <NextStagePlaceholder
              testId={`lab-placeholder-${activeSection.id}`}
              label={activeSection.label}
              description={activeSection.description}
            />
          )}
        </main>

        {/* Principio pedagógico */}
        <footer
          data-testid="lab-pedagogical-cycle"
          className="mt-10 text-center text-[13px] text-[#3d5243]"
        >
          <span className="font-semibold">
            Principio pedagógico del laboratorio:
          </span>{' '}
          <span className="font-bold text-[#1d4a2c]">
            {PEDAGOGICAL_CYCLE.join(' → ')}
          </span>
        </footer>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Vista EN VIVO                                                              */
/* -------------------------------------------------------------------------- */

const LiveView: React.FC<{
  state: SmartGardenLiveState;
  onCameraStreamError: () => void;
}> = ({ state, onCameraStreamError }) => {
  const streamAvailable = state.cameraNodeConnected && !!state.cameraStreamUrl;

  return (
    <div data-testid="lab-live-view">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cámara de observación */}
        <section className="lg:col-span-7 rounded-3xl bg-[#1f2e22] text-[#e9efe4] p-4 shadow-md flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Cámara de observación
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-[#b9c7b4]">
              <span>Calidad</span>
              <select
                disabled
                aria-label="Calidad del streaming"
                defaultValue="media"
                className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[#e9efe4] text-[11px] opacity-80"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
              <button
                type="button"
                disabled
                aria-label="Pantalla completa (disponible con streaming)"
                className="p-1.5 rounded-full bg-white/10 border border-white/15 opacity-60 cursor-not-allowed"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-[#18241b] border border-white/5 p-5 flex items-center justify-center min-h-[340px]">
            {streamAvailable ? (
              <img
                data-testid="lab-camera-stream"
                src={state.cameraStreamUrl}
                alt="Streaming del Camera Node Bi-Tech"
                onError={onCameraStreamError}
                className="max-h-[420px] w-full object-contain rounded-lg"
              />
            ) : (
              <div
                data-testid="lab-camera-placeholder"
                className="relative w-full max-w-[420px] aspect-square rounded-xl bg-gradient-to-br from-[#1f2e22] to-[#2a3b2e] flex flex-col items-center justify-center text-center px-6"
              >
                <span
                  data-testid="lab-camera-status"
                  className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9c3d2e] text-white text-[10px] font-extrabold uppercase tracking-wider"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Camera Node no conectado
                </span>
                <p className="text-sm font-semibold text-[#f1f5ee]">
                  Camera Node no conectado
                </p>
                <p className="text-xs text-[#b9c7b4] leading-relaxed mt-2 max-w-[300px]">
                  El streaming aparecerá aquí cuando un Camera Node Bi-Tech esté
                  conectado al Smart Garden Lab.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#b9c7b4]">
            <Camera className="w-3.5 h-3.5" />
            <span>ESP32-CAM</span>
          </div>
          <p className="mt-2 text-xs text-[#b9c7b4]">Cámara de observación</p>
        </section>

        {/* Variables ambientales + Estado del sistema */}
        <div className="lg:col-span-5 space-y-4">
          <div
            data-testid="lab-env-cards"
            className="grid grid-cols-2 gap-3"
          >
            <EnvCard
              testId="env-temperature"
              icon={<Thermometer className="w-5 h-5" />}
              tint="#dcefe3"
              iconColor="#2f7d46"
              label="Temperatura"
              value={state.temperature.toFixed(1)}
              unit="°C"
            />
            <EnvCard
              testId="env-humidity"
              icon={<Droplets className="w-5 h-5" />}
              tint="#dde8f6"
              iconColor="#3b6fb0"
              label="Humedad ambiente"
              value={String(Math.round(state.ambientHumidity))}
              unit="%"
            />
            <EnvCard
              testId="env-soil"
              icon={<Sprout className="w-5 h-5" />}
              tint="#eadfd2"
              iconColor="#7b5a36"
              label="Humedad de suelo"
              value={
                state.soilMoisture === null
                  ? '—'
                  : String(Math.round(state.soilMoisture))
              }
              unit={
                state.soilMoisture === null
                  ? 'Sin sensor real'
                  : 'lectura analógica'
              }
            />
            <EnvCard
              testId="env-light"
              icon={<Sun className="w-5 h-5" />}
              tint="#f6ead0"
              iconColor="#b8841b"
              label="Luminosidad"
              value={
                state.lightLevel === null
                  ? '—'
                  : String(Math.round(state.lightLevel))
              }
              unit={state.lightLevel === null ? 'Sin sensor real' : 'lectura LDR'}
            />
          </div>

          <SystemStatusCard state={state} />
          <ActuatorsCard state={state} />
        </div>
      </div>

      <p className="mt-5 text-right text-xs text-[#5b6b5d]">
        Última actualización:{' '}
        {state.source === 'demo'
          ? 'datos simulados · Modo demostración'
          : state.lastUpdatedAt
          ? `${new Date(state.lastUpdatedAt).toLocaleString('es-AR')} · dato real`
          : 'dato real'}
      </p>
    </div>
  );
};

const EnvCard: React.FC<{
  testId: string;
  icon: React.ReactNode;
  tint: string;
  iconColor: string;
  label: string;
  value: string;
  unit: string;
}> = ({ testId, icon, tint, iconColor, label, value, unit }) => (
  <div
    data-testid={testId}
    className="rounded-2xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-4"
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center"
      style={{ backgroundColor: tint, color: iconColor }}
    >
      {icon}
    </div>
    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#4f6354]">
      {label}
    </p>
    <div className="mt-1 flex items-baseline gap-1.5">
      <span
        data-testid={`${testId}-value`}
        className="text-3xl font-bold text-[#1d4a2c] tabular-nums"
        style={SERIF}
      >
        {value}
      </span>
      <span className="text-[11px] font-semibold text-[#6b7b6d]">{unit}</span>
    </div>
  </div>
);

const SystemStatusCard: React.FC<{ state: SmartGardenLiveState }> = ({
  state,
}) => {
  const items: { label: string; icon: React.ReactNode; connected: boolean }[] = [
    {
      label: 'Garden Node',
      icon: <Cpu className="w-4 h-4" />,
      connected: state.gardenNodeConnected,
    },
    {
      label: 'Camera Node',
      icon: <Camera className="w-4 h-4" />,
      connected: state.cameraNodeConnected,
    },
    {
      label: 'Sensores',
      icon: <Activity className="w-4 h-4" />,
      connected: state.gardenNodeConnected,
    },
    {
      label: 'Actuadores',
      icon: <Power className="w-4 h-4" />,
      connected: state.pump !== null || state.lighting !== null,
    },
    {
      label: 'Red',
      icon: <Wifi className="w-4 h-4" />,
      connected: state.networkConnected,
    },
  ];

  return (
    <section
      data-testid="lab-system-status"
      className="rounded-2xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-4"
    >
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3d5243] mb-3">
        Estado del sistema
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            data-testid={`status-${item.label.toLowerCase().replace(' ', '-')}`}
            className="rounded-xl bg-white border border-[#e4dfca] px-3 py-2 flex items-center gap-2.5 border-l-4"
            style={{
              borderLeftColor: item.connected ? '#2f7d46' : '#c9a94b',
            }}
          >
            <span className="text-[#3d5243] shrink-0">{item.icon}</span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-[#1f3d2a]">{item.label}</p>
              <p
                className={`text-[11px] ${
                  item.connected ? 'text-[#2f7d46]' : 'text-[#8a6d16]'
                }`}
              >
                {item.connected ? 'Conectado' : 'Demo / No conectado'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ActuatorsCard: React.FC<{ state: SmartGardenLiveState }> = ({ state }) => (
  <section
    data-testid="lab-actuators"
    className="rounded-2xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-4"
  >
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3d5243]">
        Actuadores
      </h3>
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ece8d6] text-[#6b5d2a]">
        Solo visualización
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2.5">
      {[
        { testId: 'actuator-pump', label: 'Bomba', on: state.pump },
        { testId: 'actuator-lighting', label: 'Iluminación', on: state.lighting },
      ].map((a) => (
        <div
          key={a.testId}
          data-testid={a.testId}
          className={`rounded-xl border px-3 py-2 text-center text-sm font-bold ${
            a.on === true
              ? 'bg-[#dcefe3] border-[#2f7d46] text-[#1d4a2c]'
              : 'bg-white border-[#e4dfca] text-[#5b6b5d]'
          }`}
        >
          {a.label}:{' '}
          {a.on === null ? 'No conectado' : a.on ? 'ON' : 'OFF'}
        </div>
      ))}
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Secciones preparadas (próxima etapa)                                       */
/* -------------------------------------------------------------------------- */

const NextStagePlaceholder: React.FC<{
  testId: string;
  label: string;
  description: string;
}> = ({ testId, label, description }) => (
  <section
    data-testid={testId}
    className="rounded-3xl bg-[#fffdf6] border-2 border-dashed border-[#d8c98a] p-12 text-center space-y-3"
  >
    <h3 className="text-xl font-bold text-[#1d4a2c]" style={SERIF}>
      {label}
    </h3>
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3dfa6] text-[#6b5314] text-xs font-extrabold uppercase tracking-wider">
      <Clock className="w-3.5 h-3.5" />
      Próxima etapa
    </span>
    <p className="text-sm text-[#5b6b5d] max-w-md mx-auto">{description}</p>
  </section>
);
