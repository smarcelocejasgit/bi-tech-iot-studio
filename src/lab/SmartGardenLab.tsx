import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Clock,
  Droplets,
  ImagePlus,
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
  createLiveGardenLabDataSource,
  SmartGardenLiveState,
  UNAVAILABLE_LIVE_STATE,
} from './smartGardenLive';
import { CAMERA_GATEWAY_CONFIG } from './cameraGateway';
import {
  BITECH_CHANNEL_MAX,
  BITECH_CHANNEL_MIN,
  parseBiTechChannel,
} from './bitechChannels';

type LabSection = 'live' | 'captures' | 'monitor' | 'control';

const LAB_SECTIONS: { id: LabSection; label: string; description: string }[] = [
  { id: 'live', label: 'En vivo', description: '' },
  {
    id: 'captures',
    label: 'Capturas',
    description: 'Documentar y comparar observaciones de la huerta.',
  },
  {
    id: 'monitor',
    label: 'Monitorear',
    description: 'Medir e interpretar las variables ambientales.',
  },
  {
    id: 'control',
    label: 'Control',
    description: 'Diferenciar órdenes solicitadas y acciones confirmadas.',
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

const IDLE_GARDEN_DATA_SOURCE: GardenLabDataSource = {
  isDemo: false,
  getSnapshot: () => ({ ...UNAVAILABLE_LIVE_STATE }),
  subscribe(listener) {
    listener({ ...UNAVAILABLE_LIVE_STATE });
    return () => undefined;
  },
};

function useCameraGatewayStatus(): {
  configured: boolean;
  connected: boolean;
  streamUrl?: string;
  captureUrl?: string;
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
    captureUrl: CAMERA_GATEWAY_CONFIG?.captureUrl,
    markDisconnected: () => setConnected(false),
  };
}

export const SmartGardenLab: React.FC<SmartGardenLabProps> = ({
  dataSource,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [channelInput, setChannelInput] = useState('');
  const [channelError, setChannelError] = useState<string | null>(null);
  const resolvedDataSource = useMemo(
    () =>
      dataSource ??
      (selectedChannel === null
        ? IDLE_GARDEN_DATA_SOURCE
        : createLiveGardenLabDataSource(selectedChannel)),
    [dataSource, selectedChannel]
  );
  const dataState = useGardenLabState(resolvedDataSource);
  const cameraGateway = useCameraGatewayStatus();
  const channelDataState =
    !dataSource &&
    selectedChannel !== null &&
    dataState.source === 'real' &&
    dataState.channel !== selectedChannel
      ? UNAVAILABLE_LIVE_STATE
      : dataState;
  const state: SmartGardenLiveState = cameraGateway.configured
    ? {
        ...channelDataState,
        cameraNodeConnected: cameraGateway.connected,
        cameraStreamUrl: cameraGateway.streamUrl,
      }
    : channelDataState;
  const clock = useClock();
  const [section, setSection] = useState<LabSection>('live');
  const activeSection = LAB_SECTIONS.find((s) => s.id === section)!;

  const connectChannel = () => {
    const channel = parseBiTechChannel(channelInput);
    if (channel === null) {
      setChannelError('Ingresá un canal válido del 1 al 9.');
      return;
    }
    setChannelError(null);
    setSelectedChannel(channel);
    setSection('live');
  };

  const changeChannel = () => {
    setSelectedChannel(null);
    setChannelInput('');
    setChannelError(null);
    setSection('live');
  };

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
            {selectedChannel !== null && state.source === 'demo' && (
              <span
                data-testid="lab-demo-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3dfa6] text-[#6b5314] text-xs font-extrabold uppercase tracking-wider border border-[#e0c776]"
              >
                <span className="w-2 h-2 rounded-full bg-[#b8901f]" />
                Modo demostración
              </span>
            )}
            {selectedChannel !== null && state.source === 'unavailable' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ece8d6] text-[#6b5d2a] text-xs font-extrabold uppercase tracking-wider border border-[#d8cfaa]">
                <span className="w-2 h-2 rounded-full bg-[#9b8542]" />
                Garden Node sin telemetría
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e7e4d6] text-xs font-semibold text-[#3d5243]">
              <Clock className="w-3.5 h-3.5" />
              {clock}
            </span>
          </div>
        </header>

        {/* Navegación interna */}
        {selectedChannel !== null && (
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
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Título de sección + Smart Garden activo */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold text-[#1d4a2c]" style={SERIF}>
            {selectedChannel === null
              ? 'Conectar con un dispositivo'
              : activeSection.label}
          </h2>
          {selectedChannel !== null && (
            <button
              type="button"
              data-testid="lab-change-channel"
              onClick={changeChannel}
              className="px-4 py-2 rounded-xl bg-[#fffdf6] border border-[#cfc8ad] text-[#1d4a2c] text-xs font-extrabold hover:bg-white cursor-pointer"
            >
              Cambiar canal
            </button>
          )}
        </div>

        <main className="mt-3">
          {selectedChannel === null ? (
            <ChannelConnectView
              value={channelInput}
              error={channelError}
              onChange={(value) => {
                setChannelInput(value);
                setChannelError(null);
              }}
              onConnect={connectChannel}
            />
          ) : (
            <>
              <ChannelStatus channel={selectedChannel} state={state} />
              {section === 'live' && (
                <LiveView
                  state={state}
                  onCameraStreamError={cameraGateway.markDisconnected}
                  onOpenCaptures={() => setSection('captures')}
                />
              )}
              {section === 'captures' && (
                <CapturesView
                  connected={cameraGateway.connected}
                  captureUrl={cameraGateway.captureUrl}
                />
              )}
              {section === 'monitor' && <MonitorView state={state} />}
              {section === 'control' && <ControlView state={state} />}
            </>
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

const ChannelConnectView: React.FC<{
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onConnect: () => void;
}> = ({ value, error, onChange, onConnect }) => (
  <section
    data-testid="lab-channel-connect"
    className="max-w-xl mx-auto mt-8 rounded-3xl bg-[#fffdf6] border border-[#e4dfca] shadow-md p-7 sm:p-10 text-center"
  >
    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#dcefe3] text-[#2f7d46] flex items-center justify-center">
      <Wifi className="w-7 h-7" />
    </div>
    <h3 className="mt-5 text-2xl font-bold text-[#1d4a2c]" style={SERIF}>
      Conectar con un dispositivo
    </h3>
    <p className="mt-2 text-sm text-[#5b6b5d]">
      Ingresá el canal utilizado al programar la placa.
    </p>
    <div className="mt-6 flex flex-col sm:flex-row items-stretch justify-center gap-3">
      <input
        data-testid="lab-channel-input"
        aria-label="Canal Bi-Tech"
        type="number"
        inputMode="numeric"
        min={BITECH_CHANNEL_MIN}
        max={BITECH_CHANNEL_MAX}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onConnect();
        }}
        placeholder="1–9"
        className="w-full sm:w-36 px-4 py-3 rounded-xl bg-white border border-[#cfc8ad] text-center text-xl font-bold text-[#1d4a2c] focus:outline-none focus:ring-2 focus:ring-[#2f7d46]"
      />
      <button
        type="button"
        data-testid="lab-connect-channel"
        onClick={onConnect}
        className="px-6 py-3 rounded-xl bg-[#2f7d46] text-white text-sm font-extrabold hover:bg-[#286d3d] cursor-pointer"
      >
        Conectar
      </button>
    </div>
    {error && (
      <p role="alert" className="mt-3 text-sm font-semibold text-[#9c3d2e]">
        {error}
      </p>
    )}
    <p className="mt-6 text-xs text-[#7a7567] leading-relaxed">
      El canal identifica el dispositivo que querés visualizar. No es una contraseña ni reemplaza la credencial técnica interna de la placa.
    </p>
  </section>
);

const ChannelStatus: React.FC<{
  channel: number;
  state: SmartGardenLiveState;
}> = ({ channel, state }) => (
  <div
    data-testid="lab-channel-status"
    className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
      state.source === 'real' && state.gardenNodeConnected
        ? 'bg-[#dcefe3] border-[#9fcdae] text-[#1d5c31]'
        : 'bg-[#f3f0e5] border-[#d8cfaa] text-[#6b5d2a]'
    }`}
  >
    {state.source === 'real' && state.gardenNodeConnected
      ? `Canal ${channel} — ${state.nodeLabel ?? DEMO_SMART_GARDEN_NODE.label} conectado`
      : `No se encontró un dispositivo activo en el canal ${channel}.`}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Vista EN VIVO                                                              */
/* -------------------------------------------------------------------------- */

const LiveView: React.FC<{
  state: SmartGardenLiveState;
  onCameraStreamError: () => void;
  onOpenCaptures: () => void;
}> = ({ state, onCameraStreamError, onOpenCaptures }) => {
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
              <span
                data-testid="lab-camera-status"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  streamAvailable
                    ? 'bg-[#2f7d46] text-white'
                    : 'bg-[#9c3d2e] text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {streamAvailable ? 'Conectado' : 'No conectado'}
              </span>
              <button
                type="button"
                disabled
                aria-label="Pantalla completa no disponible"
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#b9c7b4]">
            <span className="inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              ESP32-CAM · Cámara de observación
            </span>
            <button
              type="button"
              onClick={onOpenCaptures}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[#e9efe4] font-bold hover:bg-white/15 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              Capturar ahora
            </button>
          </div>
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
              value={formatMetric(state.temperature, 1)}
              unit={state.temperature === null ? '' : '°C'}
            />
            <EnvCard
              testId="env-humidity"
              icon={<Droplets className="w-5 h-5" />}
              tint="#dde8f6"
              iconColor="#3b6fb0"
              label="Humedad ambiente"
              value={formatMetric(state.ambientHumidity)}
              unit={state.ambientHumidity === null ? '' : '%'}
            />
            <EnvCard
              testId="env-soil"
              icon={<Sprout className="w-5 h-5" />}
              tint="#eadfd2"
              iconColor="#7b5a36"
              label="Humedad de suelo"
              value={
                state.soilMoisture === null
                  ? 'No disponible'
                  : String(Math.round(state.soilMoisture))
              }
              unit={
                state.soilMoisture === null
                  ? ''
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
                  ? 'No disponible'
                  : String(Math.round(state.lightLevel))
              }
              unit={state.lightLevel === null ? '' : 'lectura LDR'}
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
          : 'sin telemetría real disponible'}
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
        className={`${
          value === 'No disponible' ? 'text-lg' : 'text-3xl'
        } font-bold text-[#1d4a2c] tabular-nums`}
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
  const realSensors =
    state.source === 'real' &&
    (state.temperature !== null || state.ambientHumidity !== null);
  const items: {
    label: string;
    icon: React.ReactNode;
    status: string;
    tone: 'connected' | 'unavailable' | 'demo';
  }[] = [
    {
      label: 'Garden Node',
      icon: <Cpu className="w-4 h-4" />,
      status:
        state.source === 'demo'
          ? 'Simulado'
          : state.gardenNodeConnected
          ? 'Conectado'
          : 'No conectado',
      tone:
        state.source === 'demo'
          ? 'demo'
          : state.gardenNodeConnected
          ? 'connected'
          : 'unavailable',
    },
    {
      label: 'Camera Node',
      icon: <Camera className="w-4 h-4" />,
      status: state.cameraNodeConnected ? 'Conectado' : 'No conectado',
      tone: state.cameraNodeConnected ? 'connected' : 'unavailable',
    },
    {
      label: 'Sensores',
      icon: <Activity className="w-4 h-4" />,
      status:
        state.source === 'demo'
          ? 'Simulados'
          : realSensors
          ? 'Parcialmente operativos'
          : 'No disponibles',
      tone:
        state.source === 'demo'
          ? 'demo'
          : realSensors
          ? 'connected'
          : 'unavailable',
    },
    {
      label: 'Actuadores',
      icon: <Power className="w-4 h-4" />,
      status:
        state.pump !== null || state.lighting !== null
          ? 'Estado disponible'
          : 'No disponibles',
      tone:
        state.pump !== null || state.lighting !== null
          ? 'connected'
          : 'unavailable',
    },
    {
      label: 'Red',
      icon: <Wifi className="w-4 h-4" />,
      status:
        state.networkConnected || state.cameraNodeConnected
          ? 'Operativa'
          : 'No conectada',
      tone:
        state.networkConnected || state.cameraNodeConnected
          ? 'connected'
          : 'unavailable',
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
              borderLeftColor:
                item.tone === 'connected'
                  ? '#2f7d46'
                  : item.tone === 'demo'
                  ? '#b8901f'
                  : '#9b9280',
            }}
          >
            <span className="text-[#3d5243] shrink-0">{item.icon}</span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-[#1f3d2a]">{item.label}</p>
              <p
                className={`text-[11px] ${
                  item.tone === 'connected'
                    ? 'text-[#2f7d46]'
                    : item.tone === 'demo'
                    ? 'text-[#8a6d16]'
                    : 'text-[#6f6a60]'
                }`}
              >
                {item.status}
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

function formatMetric(value: number | null, digits = 0): string {
  return value === null ? 'No disponible' : value.toFixed(digits);
}

/* -------------------------------------------------------------------------- */
/* Vista CAPTURAS                                                             */
/* -------------------------------------------------------------------------- */

const CapturesView: React.FC<{
  connected: boolean;
  captureUrl?: string;
}> = ({ connected, captureUrl }) => {
  const [capture, setCapture] = useState<{ url: string; takenAt: Date } | null>(
    null
  );
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (capture) URL.revokeObjectURL(capture.url);
    },
    [capture]
  );

  const takeCapture = async () => {
    if (!captureUrl || capturing) return;
    setCapturing(true);
    setError(null);
    try {
      const url = new URL(captureUrl);
      url.searchParams.set('capture', String(Date.now()));
      const response = await fetch(url, {
        headers: { Accept: 'image/jpeg' },
        cache: 'no-store',
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.toLowerCase().startsWith('image/jpeg')) {
        throw new Error('invalid-capture');
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error('empty-capture');
      const objectUrl = URL.createObjectURL(blob);
      setCapture((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return { url: objectUrl, takenAt: new Date() };
      });
    } catch {
      setError('No fue posible obtener una captura de la Camera Node.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div data-testid="lab-captures-view" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <section className="lg:col-span-8 rounded-3xl bg-[#1f2e22] text-[#e9efe4] p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              Captura actual
            </h3>
            <p className="text-xs text-[#b9c7b4] mt-1">
              Imagen real obtenida desde Camera Node.
            </p>
          </div>
          <button
            type="button"
            data-testid="lab-capture-now"
            onClick={() => void takeCapture()}
            disabled={!connected || !captureUrl || capturing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f3dfa6] text-[#513f12] text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            {capturing ? 'Capturando…' : 'Capturar ahora'}
          </button>
        </div>

        <div className="min-h-[430px] rounded-2xl bg-[#18241b] border border-white/5 flex items-center justify-center p-4">
          {capture ? (
            <img
              data-testid="lab-current-capture"
              src={capture.url}
              alt="Captura real de la Camera Node"
              className="max-h-[520px] w-full object-contain rounded-xl"
            />
          ) : (
            <div className="text-center max-w-sm">
              <Camera className="w-10 h-10 mx-auto text-[#7f927e]" />
              <p className="mt-3 font-bold">
                {connected ? 'Todavía no se realizó una captura' : 'Camera Node no conectado'}
              </p>
              <p className="text-xs text-[#b9c7b4] mt-2">
                {connected
                  ? 'Usá “Capturar ahora” para documentar el estado actual de la huerta.'
                  : 'No se muestra ninguna imagen demo.'}
              </p>
            </div>
          )}
        </div>

        {capture && (
          <p data-testid="lab-capture-timestamp" className="mt-3 text-xs text-[#dce5d9]">
            Capturada el {capture.takenAt.toLocaleDateString('es-AR')} a las{' '}
            {capture.takenAt.toLocaleTimeString('es-AR')}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-xs text-[#f0b6aa] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </section>

      <aside className="lg:col-span-4 rounded-3xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-5 h-fit">
        <h3 className="font-bold text-[#1d4a2c]" style={SERIF}>
          Historial
        </h3>
        <p className="mt-3 text-sm text-[#5b6b5d] leading-relaxed">
          Historial de capturas aún no disponible.
        </p>
        <p className="mt-3 text-xs text-[#7a7567]">
          La captura actual permanece sólo durante esta sesión y no se guarda en un servidor.
        </p>
      </aside>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Vista MONITOREAR                                                           */
/* -------------------------------------------------------------------------- */

const MonitorView: React.FC<{ state: SmartGardenLiveState }> = ({ state }) => (
  <div data-testid="lab-monitor-view">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MonitorCard
        testId="monitor-temperature"
        icon={<Thermometer className="w-6 h-6" />}
        label="Temperatura"
        value={formatMetric(state.temperature, 1)}
        unit={state.temperature === null ? '' : '°C'}
        real={state.source === 'real' && state.temperature !== null}
      />
      <MonitorCard
        testId="monitor-humidity"
        icon={<Droplets className="w-6 h-6" />}
        label="Humedad ambiente"
        value={formatMetric(state.ambientHumidity)}
        unit={state.ambientHumidity === null ? '' : '%'}
        real={state.source === 'real' && state.ambientHumidity !== null}
      />
      <MonitorCard
        testId="monitor-soil"
        icon={<Sprout className="w-6 h-6" />}
        label="Humedad de suelo"
        value={formatMetric(state.soilMoisture)}
        unit={state.soilMoisture === null ? '' : 'lectura relativa'}
        real={state.source === 'real' && state.soilMoisture !== null}
      />
      <MonitorCard
        testId="monitor-light"
        icon={<Sun className="w-6 h-6" />}
        label="Luminosidad"
        value={formatMetric(state.lightLevel)}
        unit={state.lightLevel === null ? '' : 'lectura relativa'}
        real={state.source === 'real' && state.lightLevel !== null}
      />
    </div>
    <section className="mt-5 rounded-2xl bg-[#fffdf6] border border-[#e4dfca] p-5 text-sm text-[#5b6b5d] leading-relaxed">
      <strong className="text-[#1d4a2c]">Cómo interpretar estas mediciones:</strong>{' '}
      la humedad de suelo y la luminosidad pueden expresarse como escalas relativas según el sensor y su calibración. Antes de compararlas, hay que conocer qué representa el mínimo y el máximo en el dispositivo real.
    </section>
  </div>
);

const MonitorCard: React.FC<{
  testId: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  real: boolean;
}> = ({ testId, icon, label, value, unit, real }) => (
  <section data-testid={testId} className="rounded-3xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-5 min-h-[210px] flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <span className="w-11 h-11 rounded-full bg-[#e5eee2] text-[#2f7d46] flex items-center justify-center">
        {icon}
      </span>
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${real ? 'bg-[#dcefe3] text-[#246238]' : 'bg-[#ece8d6] text-[#6f6a60]'}`}>
        {real ? 'Real' : 'No disponible'}
      </span>
    </div>
    <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-[#4f6354]">{label}</p>
    <div className="mt-auto pt-4 flex items-baseline gap-2">
      <strong className={`${value === 'No disponible' ? 'text-lg' : 'text-4xl'} text-[#1d4a2c]`} style={SERIF}>
        {value}
      </strong>
      {unit && <span className="text-xs font-semibold text-[#6b7b6d]">{unit}</span>}
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Vista CONTROL                                                              */
/* -------------------------------------------------------------------------- */

const ControlView: React.FC<{ state: SmartGardenLiveState }> = ({ state }) => (
  <div data-testid="lab-control-view">
    <div className="rounded-2xl bg-[#f3dfa6] border border-[#e0c776] p-4 text-sm text-[#624d13] flex items-start gap-3 mb-5">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <p>
        <strong>Control remoto no disponible.</strong> Esta pantalla diferencia la orden solicitada de la acción confirmada, pero no envía órdenes al Garden Node.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <ActuatorControlCard
        testId="control-lighting"
        label="Luz de observación"
        icon={<Sun className="w-6 h-6" />}
        confirmed={state.lighting}
      />
      <ActuatorControlCard
        testId="control-pump"
        label="Bomba"
        icon={<Droplets className="w-6 h-6" />}
        confirmed={state.pump}
      />
    </div>
  </div>
);

const ActuatorControlCard: React.FC<{
  testId: string;
  label: string;
  icon: React.ReactNode;
  confirmed: boolean | null;
}> = ({ testId, label, icon, confirmed }) => (
  <section data-testid={testId} className="rounded-3xl bg-[#fffdf6] border border-[#e4dfca] shadow-sm p-6">
    <div className="flex items-center gap-3">
      <span className="w-11 h-11 rounded-full bg-[#e5eee2] text-[#2f7d46] flex items-center justify-center">{icon}</span>
      <div>
        <h3 className="text-lg font-bold text-[#1d4a2c]" style={SERIF}>{label}</h3>
        <p className="text-xs text-[#6b7b6d]">Sólo visualización</p>
      </div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-[#f3f0e5] border border-[#e4dfca] p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b7b6d]">Solicitado</p>
        <p className="mt-2 font-bold text-[#1f3d2a]">No disponible</p>
      </div>
      <div className="rounded-2xl bg-[#f3f0e5] border border-[#e4dfca] p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6b7b6d]">Confirmado</p>
        <p className="mt-2 font-bold text-[#1f3d2a]">
          {confirmed === null ? 'No disponible' : confirmed ? 'ON' : 'OFF'}
        </p>
      </div>
    </div>
  </section>
);
