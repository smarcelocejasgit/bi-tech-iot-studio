import React, { useState } from 'react';
import {
  Camera,
  Clock,
  Cpu,
  Image as ImageIcon,
  Lightbulb,
  Maximize2,
  Power,
  Radio,
  Sprout,
  Zap,
} from 'lucide-react';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import { DeviceProfileId } from '../types/hardware';
import {
  CameraSimulationState,
  GardenActuatorState,
  GardenSensorState,
  NodeMcuActuatorState,
  NodeMcuSensorState,
  SimulatedInputReading,
} from '../types/studio';

const InputReadingsSummary: React.FC<{
  readings: SimulatedInputReading[];
}> = ({ readings }) => {
  if (readings.length === 0) return null;
  return (
    <div
      data-testid="gpio-input-readings"
      className="mb-3 flex flex-wrap gap-2"
    >
      {readings.map((reading) => (
        <span
          key={`${reading.component}:${reading.role}:${reading.pin}`}
          className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-950"
        >
          {reading.component} ·{' '}
          {reading.signalType === 'analog'
            ? 'señal analógica'
            : reading.signalType === 'digital-protocol'
              ? 'protocolo digital'
              : 'señal digital'}{' '}
          · {reading.role} <code>{reading.pin}</code> · valor{' '}
          <strong>
            {reading.value}
            {reading.unit ? ` ${reading.unit}` : ''}
          </strong>
        </span>
      ))}
    </div>
  );
};

interface VirtualSystemPanelProps {
  activeDevice: DeviceProfileId;
  sensors: GardenSensorState;
  actuators: GardenActuatorState;
  nodeMcuSensors: NodeMcuSensorState;
  nodeMcuActuators: NodeMcuActuatorState;
  cameraState: CameraSimulationState;
  configuredStreamUrl?: string | null;
  onChangeConfiguredStreamUrl?: (url: string) => void;
}

export const VirtualSystemPanel: React.FC<VirtualSystemPanelProps> = ({
  activeDevice,
  sensors,
  actuators,
  nodeMcuSensors,
  nodeMcuActuators,
  cameraState,
  configuredStreamUrl = null,
  onChangeConfiguredStreamUrl,
}) => {
  const [viewMode, setViewMode] = useState<'jardin' | 'esquema'>('jardin');
  const profile = getDeviceProfile(activeDevice);

  if (profile.simulatorKind === 'camera-system') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-700" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              CAMERA NODE VIRTUAL · ESP32-CAM
            </h2>
          </div>

          <span
            data-testid="camera-status-badge"
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              cameraState.activa
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            Estado: {cameraState.activa ? 'ACTIVA' : 'INACTIVA'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
          {/* Visor simulado de la cámara OV2640 */}
          <div className="md:col-span-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative min-h-[155px] flex flex-col justify-between p-3 text-white">
            <div className="flex items-center justify-between text-[11px] z-10">
              <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs font-mono">
                OV2640 · {cameraState.resolucion}
              </span>
              <span
                data-testid="camera-streaming-badge"
                className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                  cameraState.streaming
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Radio className="w-3 h-3" />
                Streaming: {cameraState.streaming ? 'ON' : 'OFF'}
              </span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center py-2 z-10">
              {configuredStreamUrl ? (
                <div className="w-full flex flex-col items-center justify-center gap-1">
                  <img
                    data-testid="camera-real-stream-img"
                    src={configuredStreamUrl}
                    alt="Vista en vivo OV2640 desde ESP32-CAM"
                    className="max-h-[125px] w-auto rounded-lg border border-cyan-400/50 object-contain bg-black"
                  />
                  <span className="text-[10px] font-semibold text-emerald-300">
                    Imagen real OV2640 recibida ({configuredStreamUrl})
                  </span>
                </div>
              ) : cameraState.activa ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 mb-1">
                    <Sprout className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-200">
                    {cameraState.streaming
                      ? 'Vista previa Wi-Fi simulada (Smart Garden)'
                      : 'Sensor activo · En espera de streaming o captura'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center">
                  Cámara apagada. Ejecuta iniciarCamara() en tus bloques.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono z-10 border-t border-white/10 pt-1.5">
              <span>Calidad JPEG: {cameraState.calidad}</span>
              <span data-testid="camera-panel-stream-endpoint">
                {configuredStreamUrl
                  ? `Stream: ${configuredStreamUrl}`
                  : 'Stream real: Pendiente de validación con hardware'}
              </span>
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col justify-between gap-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">
                  Resolución
                </span>
                <strong
                  data-testid="camera-resolution-value"
                  className="text-slate-800 font-bold"
                >
                  {cameraState.resolucion}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">
                  Calidad JPEG
                </span>
                <strong
                  data-testid="camera-quality-value"
                  className="text-slate-800 font-bold"
                >
                  {cameraState.calidad}
                </strong>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Capturas
                  </span>
                  <strong
                    data-testid="camera-captures-count"
                    className="text-slate-900 font-extrabold text-sm"
                  >
                    {cameraState.capturas}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Última captura
                  </span>
                  <strong
                    data-testid="camera-last-capture"
                    className="text-slate-800 font-mono text-xs"
                  >
                    {cameraState.ultimaCaptura ?? '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Configuración preparada para recibir URL real de streaming sin valores hardcodeados */}
            <div
              data-testid="camera-streaming-config-box"
              className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 text-[11px]">
                  Conexión de Streaming Real (V0.4A)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Pendiente de validación con hardware
                </span>
              </div>
              <input
                type="text"
                data-testid="virtual-panel-stream-url-input"
                placeholder="Introducir o detectar URL de streaming al conectar ESP32-CAM"
                value={configuredStreamUrl ?? ''}
                onChange={(e) => onChangeConfiguredStreamUrl?.(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800"
              />
            </div>

            <div className="px-3 py-2 rounded-xl bg-cyan-50/90 border border-cyan-200 text-xs text-cyan-950 font-medium flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-700 shrink-0" />
              <span>{cameraState.explanation}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (profile.simulatorKind === 'nodemcu-system') {
    const anyActive =
      nodeMcuActuators.relay ||
      nodeMcuActuators.iluminacion ||
      nodeMcuActuators.salidaDigital;

    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-700" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              SISTEMA VIRTUAL · NODEMCU ESP8266
            </h2>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            A0={nodeMcuSensors.entradaAnalogicaA0} · DIN=
            {nodeMcuSensors.entradaDigital ? 'HIGH' : 'LOW'}
          </span>
        </div>

        <InputReadingsSummary readings={nodeMcuActuators.inputReadings} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
          {/* Representación visual de la placa NodeMCU ESP8266 y sus buses */}
          <div className="md:col-span-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-3 text-white flex flex-col justify-between min-h-[164px]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold">
                NodeMCU ESP8266 (ESP-12E)
              </span>
              <span className="text-emerald-300">Wi-Fi 2.4GHz Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[10px]">CANAL ÚNICO ADC</div>
                <div className="text-indigo-300 font-bold">
                  A0: {nodeMcuSensors.entradaAnalogicaA0} / 1023
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  ({nodeMcuSensors.analogSensorLabel})
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-slate-400 text-[10px]">DIGITAL + DHT11</div>
                <div className="text-emerald-300 font-bold">
                  {nodeMcuSensors.temperatura}°C · {nodeMcuSensors.humedadAmbiente}%
                </div>
                <div className="text-[10px] text-sky-300">
                  DIN: {nodeMcuSensors.entradaDigital === 1 ? 'HIGH (1)' : 'LOW (0)'}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-300 border-t border-white/10 pt-1.5 flex items-center justify-between">
              <span>Pines simbólicos: configurables</span>
              <span>Validación física prevista: V0.2</span>
            </div>
          </div>

          {/* Tarjetas de estado de actuadores de NodeMCU: Relay, Iluminación, Salida Digital */}
          <div className="md:col-span-6 flex flex-col justify-between gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-1.5">
              {/* 1. Relay */}
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power
                    className={`w-4 h-4 ${
                      nodeMcuActuators.relay
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Relay:{' '}
                    <strong
                      data-testid="nodemcu-relay-state"
                      className={
                        nodeMcuActuators.relay
                          ? 'text-emerald-600 font-extrabold'
                          : 'text-slate-500'
                      }
                    >
                      {nodeMcuActuators.relay ? 'ON' : 'OFF'}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  RELAY_PIN
                </span>
              </div>

              {/* 2. Iluminación */}
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb
                    className={`w-4 h-4 ${
                      nodeMcuActuators.iluminacion
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Iluminación:{' '}
                    <strong
                      data-testid="nodemcu-light-state"
                      className={
                        nodeMcuActuators.iluminacion
                          ? 'text-amber-600 font-extrabold'
                          : 'text-slate-500'
                      }
                    >
                      {nodeMcuActuators.iluminacion ? 'ON' : 'OFF'}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  LUZ_PIN
                </span>
              </div>

              {/* 3. Salida Digital */}
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap
                    className={`w-4 h-4 ${
                      nodeMcuActuators.salidaDigital
                        ? 'text-sky-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Salida Digital:{' '}
                    <strong
                      data-testid="nodemcu-dout-state"
                      className={
                        nodeMcuActuators.salidaDigital
                          ? 'text-sky-600 font-extrabold'
                          : 'text-slate-500'
                      }
                    >
                      {nodeMcuActuators.salidaDigital ? 'HIGH' : 'LOW'}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  SALIDA_DIG_PIN
                </span>
              </div>
            </div>

            <div
              data-testid="nodemcu-explanation-banner"
              className={`px-3 py-2 rounded-xl border text-xs font-medium leading-snug flex items-start gap-2 ${
                anyActive
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <span>{nodeMcuActuators.explanation}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
      {/* Cabecera Smart Garden Virtual */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            SMART GARDEN VIRTUAL
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            aria-label="Vista del sistema virtual"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'jardin' | 'esquema')}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="jardin">Vista: Jardín</option>
            <option value="esquema">Vista: Pines simbólicos</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) => (prev === 'jardin' ? 'esquema' : 'jardin'))
            }
            className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer"
            title="Cambiar vista del jardín"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <InputReadingsSummary readings={actuators.inputReadings} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Escena ilustrada del jardín */}
        <div className="md:col-span-7 rounded-xl overflow-hidden border border-emerald-200/80 bg-gradient-to-b from-[#d8f3fa] via-[#e9f7ef] to-[#7a502d] relative h-[164px]">
          {viewMode === 'jardin' ? (
            <svg
              viewBox="0 0 420 180"
              className="w-full h-full object-cover"
              role="img"
              aria-label="Escena interactiva Smart Garden Virtual"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={actuators.iluminacion ? '#fef3c7' : '#cbeefa'}
                  />
                  <stop offset="100%" stopColor="#e6f6ec" />
                </linearGradient>
                <radialGradient id="lampGlow" cx="50%" cy="15%" r="55%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="420" height="130" fill="url(#skyGrad)" />

              {actuators.iluminacion && (
                <polygon
                  points="160,12 230,12 300,135 90,135"
                  fill="url(#lampGlow)"
                />
              )}

              <g transform="translate(168, 4)">
                <rect
                  x="0"
                  y="0"
                  width="54"
                  height="10"
                  rx="4"
                  fill={actuators.iluminacion ? '#f59e0b' : '#64748b'}
                />
                {actuators.iluminacion && (
                  <rect
                    x="6"
                    y="9"
                    width="42"
                    height="4"
                    rx="2"
                    fill="#fef08a"
                  />
                )}
              </g>

              <circle cx="60" cy="122" r="28" fill="#a7dfb9" opacity="0.6" />
              <circle cx="110" cy="125" r="24" fill="#8fd4a6" opacity="0.6" />
              <circle cx="340" cy="120" r="30" fill="#a7dfb9" opacity="0.5" />

              <path
                d="M0,128 Q110,115 210,124 T420,126 L420,180 L0,180 Z"
                fill={sensors.humedadSuelo < 30 ? '#784b27' : '#4e2f18'}
              />
              <circle cx="95" cy="148" r="2.5" fill="#a16207" opacity="0.7" />
              <circle cx="150" cy="156" r="2" fill="#facc15" opacity="0.5" />
              <circle cx="205" cy="145" r="2.5" fill="#a16207" opacity="0.7" />
              <circle cx="245" cy="160" r="2" fill="#ca8a04" opacity="0.6" />

              <g transform="translate(55, 92)">
                <rect
                  x="0"
                  y="22"
                  width="12"
                  height="18"
                  rx="2"
                  fill="#334155"
                />
                <rect x="2" y="40" width="3" height="18" fill="#94a3b8" />
                <rect x="7" y="40" width="3" height="18" fill="#94a3b8" />
                <path
                  d="M6,22 C6,-5 38,-5 38,38"
                  stroke="#1e293b"
                  strokeWidth="3.5"
                  fill="none"
                />
              </g>

              <g transform="translate(185, 42)">
                <path
                  d="M12,86 Q14,50 12,18"
                  stroke="#15803d"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M12,64 C-18,56 -24,32 -2,36 C8,38 12,52 12,64 Z"
                  fill="#22c55e"
                  stroke="#166534"
                  strokeWidth="1.2"
                />
                <path
                  d="M13,52 C42,42 46,18 24,24 C14,27 13,40 13,52 Z"
                  fill="#16a34a"
                  stroke="#14532d"
                  strokeWidth="1.2"
                />
                <path
                  d="M12,34 C-14,22 -16,0 4,8 C11,11 12,24 12,34 Z"
                  fill="#4ade80"
                  stroke="#15803d"
                  strokeWidth="1.2"
                />
                <path
                  d="M12,22 C24,6 34,8 26,22 C21,28 15,25 12,22 Z"
                  fill="#22c55e"
                />
              </g>

              <g transform="translate(295, 86)">
                <rect
                  x="26"
                  y="14"
                  width="64"
                  height="42"
                  rx="7"
                  fill="#475569"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                <rect
                  x="36"
                  y="8"
                  width="44"
                  height="8"
                  rx="3"
                  fill="#64748b"
                />
                <circle
                  cx="76"
                  cy="30"
                  r="4"
                  fill={actuators.bomba ? '#22c55e' : '#94a3b8'}
                />
                <path
                  d="M26,28 L6,28 Q-8,28 -12,16 L-28,16"
                  stroke="#334155"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect
                  x="-34"
                  y="11"
                  width="9"
                  height="10"
                  rx="2"
                  fill="#1e293b"
                />

                {actuators.bomba && (
                  <g>
                    <path
                      d="M-34,15 Q-58,22 -72,44"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      strokeDasharray="5 3"
                      fill="none"
                    />
                    <path
                      d="M-34,17 Q-52,28 -62,48"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <path
                      d="M-34,13 Q-65,18 -84,42"
                      stroke="#7dd3fc"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      fill="none"
                    />
                    <circle cx="-70" cy="44" r="3" fill="#38bdf8" />
                    <circle cx="-60" cy="47" r="2.5" fill="#0ea5e9" />
                    <circle cx="-80" cy="42" r="2.5" fill="#7dd3fc" />
                  </g>
                )}
              </g>
            </svg>
          ) : (
            <div className="p-3 bg-slate-900 text-slate-100 h-full font-mono text-xs flex flex-col justify-between">
              <div className="font-bold text-emerald-400">
                Configuración Simbólica — Garden Node (ESP32)
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div>
                  DHT_PIN: {sensors.temperatura}°C / {sensors.humedadAmbiente}%
                </div>
                <div>SUELO_PIN (ADC): {sensors.humedadSuelo}</div>
                <div>LDR_PIN (ADC): {sensors.nivelLuz}</div>
                <div>Relay Inicial: OFF / OFF</div>
                <div className="text-emerald-300">
                  BOMBA_PIN (CH1): {actuators.bomba ? 'ON' : 'OFF'}
                </div>
                <div className="text-amber-300">
                  LUZ_PIN (CH2): {actuators.iluminacion ? 'ON' : 'OFF'}
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                GPIO reales y polaridad LOW/HIGH pendientes de validación física.
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Tarjetas de estado de Bomba, Iluminación y Explicación */}
        <div className="md:col-span-5 flex flex-col justify-between gap-2.5">
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  actuators.bomba
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Power className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Bomba:{' '}
                <strong
                  data-testid="actuator-bomba-state"
                  className={
                    actuators.bomba
                      ? 'text-emerald-600 font-extrabold'
                      : 'text-slate-500'
                  }
                >
                  {actuators.bomba ? 'ON' : 'OFF'}
                </strong>
              </span>
            </div>

            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                actuators.bomba
                  ? 'bg-emerald-500 justify-end'
                  : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  actuators.iluminacion
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                Iluminación:{' '}
                <strong
                  data-testid="actuator-luz-state"
                  className={
                    actuators.iluminacion
                      ? 'text-amber-600 font-extrabold'
                      : 'text-slate-500'
                  }
                >
                  {actuators.iluminacion ? 'ON' : 'OFF'}
                </strong>
              </span>
            </div>

            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                actuators.iluminacion
                  ? 'bg-amber-500 justify-end'
                  : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          <div
            data-testid="simulator-explanation-banner"
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium leading-relaxed flex items-start gap-2 ${
              actuators.bomba || actuators.iluminacion
                ? 'bg-[#e3f5e8] border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Sprout
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                actuators.bomba || actuators.iluminacion
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            />
            <span>{actuators.explanation}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
