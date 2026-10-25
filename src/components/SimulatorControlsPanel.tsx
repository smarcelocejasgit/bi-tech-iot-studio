import React from 'react';
import {
  Camera,
  Droplets,
  FlaskConical,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  Wifi,
} from 'lucide-react';
import { DeviceProfileId } from '../types/hardware';
import { CameraSimulationState, GardenSensorState } from '../types/studio';

interface SimulatorControlsPanelProps {
  activeDevice: DeviceProfileId;
  sensors: GardenSensorState;
  onChangeSensors: (next: GardenSensorState) => void;
  cameraState: CameraSimulationState;
  onTriggerManualCapture: () => void;
  onResetCameraSimulation: () => void;
}

export const SimulatorControlsPanel: React.FC<SimulatorControlsPanelProps> = ({
  activeDevice,
  sensors,
  onChangeSensors,
  cameraState,
  onTriggerManualCapture,
  onResetCameraSimulation,
}) => {
  const updateSensor = (key: keyof GardenSensorState, val: number) => {
    onChangeSensors({
      ...sensors,
      [key]: val,
    });
  };

  if (activeDevice === 'camera-node') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                SIMULADOR · CAMERA NODE (ESP32-CAM)
              </h2>
            </div>
            <span className="text-[11px] font-medium text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              USB: Programación · Wi-Fi: Streaming
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            El simulador evalúa los bloques de cámara de tu programa. Puedes disparar un
            nuevo ciclo de captura o modificar los bloques para observar cómo cambian el
            estado, la resolución, la calidad y el streaming.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Sensor OV2640</div>
                <div className="text-xs font-bold text-slate-800">
                  {cameraState.activa ? 'Inicializado (ACTIVA)' : 'Inactivo (OFF)'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Canal Wi-Fi</div>
                <div className="text-xs font-bold text-slate-800">
                  {cameraState.wifiConectado ? 'Conectado a red local' : 'Sin conexión Wi-Fi'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            data-testid="simulate-camera-capture-btn"
            onClick={onTriggerManualCapture}
            disabled={!cameraState.activa}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              cameraState.activa
                ? 'bg-cyan-700 hover:bg-cyan-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Camera className="w-4 h-4" />
            Ejecutar ciclo de captura
          </button>

          <button
            type="button"
            onClick={onResetCameraSimulation}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar contador
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            SIMULADOR
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">
          Modifica las variables para probar tu programa
        </span>
      </div>

      <div className="space-y-3.5">
        {/* 1. Temperatura */}
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Temperatura</span>
          </div>
          <div className="col-span-5 sm:col-span-6 flex items-center">
            <input
              type="range"
              aria-label="Temperatura"
              data-testid="slider-temperatura"
              min={0}
              max={50}
              step={1}
              value={sensors.temperatura}
              onChange={(e) => updateSensor('temperatura', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-slate-200"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <input
              type="number"
              aria-label="Valor de Temperatura"
              min={0}
              max={50}
              value={sensors.temperatura}
              onChange={(e) => updateSensor('temperatura', Number(e.target.value))}
              className="w-12 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-500 w-5">°C</span>
          </div>
        </div>

        {/* 2. Humedad ambiente */}
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Humedad ambiente</span>
          </div>
          <div className="col-span-5 sm:col-span-6 flex items-center">
            <input
              type="range"
              aria-label="Humedad ambiente"
              data-testid="slider-humedad-ambiente"
              min={0}
              max={100}
              step={1}
              value={sensors.humedadAmbiente}
              onChange={(e) => updateSensor('humedadAmbiente', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-slate-200"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <input
              type="number"
              aria-label="Valor de Humedad ambiente"
              min={0}
              max={100}
              value={sensors.humedadAmbiente}
              onChange={(e) => updateSensor('humedadAmbiente', Number(e.target.value))}
              className="w-12 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-500 w-5">%</span>
          </div>
        </div>

        {/* 3. Humedad del suelo (sin símbolo % automático: lectura numérica) */}
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sprout className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Humedad del suelo</span>
          </div>
          <div className="col-span-5 sm:col-span-6 flex items-center">
            <input
              type="range"
              aria-label="Humedad del suelo"
              data-testid="slider-humedad-suelo"
              min={0}
              max={100}
              step={1}
              value={sensors.humedadSuelo}
              onChange={(e) => updateSensor('humedadSuelo', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-700 bg-slate-200"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <input
              type="number"
              aria-label="Valor de Humedad del suelo"
              data-testid="input-humedad-suelo"
              min={0}
              max={100}
              value={sensors.humedadSuelo}
              onChange={(e) => updateSensor('humedadSuelo', Number(e.target.value))}
              className="w-12 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-400 w-5" title="Valor numérico sin calibración a %">
              &nbsp;
            </span>
          </div>
        </div>

        {/* 4. Nivel de luz */}
        <div className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Nivel de luz</span>
          </div>
          <div className="col-span-5 sm:col-span-6 flex items-center">
            <input
              type="range"
              aria-label="Nivel de luz"
              data-testid="slider-nivel-luz"
              min={0}
              max={1023}
              step={1}
              value={sensors.nivelLuz}
              onChange={(e) => updateSensor('nivelLuz', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-400 bg-slate-200"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <input
              type="number"
              aria-label="Valor de Nivel de luz"
              min={0}
              max={1023}
              value={sensors.nivelLuz}
              onChange={(e) => updateSensor('nivelLuz', Number(e.target.value))}
              className="w-14 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-400 w-5">&nbsp;</span>
          </div>
        </div>
      </div>
    </section>
  );
};
