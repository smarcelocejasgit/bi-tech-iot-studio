import React from 'react';
import {
  AlertTriangle,
  Camera,
  Cpu,
  Droplets,
  FlaskConical,
  Gauge,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  ToggleLeft,
  ToggleRight,
  Wifi,
} from 'lucide-react';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import { DeviceProfileId } from '../types/hardware';
import {
  CameraSimulationState,
  GardenSensorState,
  NodeMcuSensorState,
} from '../types/studio';

interface SimulatorControlsPanelProps {
  activeDevice: DeviceProfileId;
  sensors: GardenSensorState;
  onChangeSensors: (next: GardenSensorState) => void;
  nodeMcuSensors: NodeMcuSensorState;
  onChangeNodeMcuSensors: (next: NodeMcuSensorState) => void;
  onInsertSecondAnalogSensorDemo: () => void;
  cameraState: CameraSimulationState;
  onTriggerManualCapture: () => void;
  onResetCameraSimulation: () => void;
}

export const SimulatorControlsPanel: React.FC<SimulatorControlsPanelProps> = ({
  activeDevice,
  sensors,
  onChangeSensors,
  nodeMcuSensors,
  onChangeNodeMcuSensors,
  onInsertSecondAnalogSensorDemo,
  cameraState,
  onTriggerManualCapture,
  onResetCameraSimulation,
}) => {
  const profile = getDeviceProfile(activeDevice);

  const updateGardenSensor = (key: keyof GardenSensorState, val: number) => {
    onChangeSensors({
      ...sensors,
      [key]: val,
    });
  };

  const updateNodeMcuSensor = <K extends keyof NodeMcuSensorState>(
    key: K,
    val: NodeMcuSensorState[K]
  ) => {
    onChangeNodeMcuSensors({
      ...nodeMcuSensors,
      [key]: val,
    });
  };

  if (profile.simulatorKind === 'camera-system') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-cyan-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                SIMULADOR · {profile.shortBadge}
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
                <div className="text-[11px] text-slate-500 font-medium">
                  Sensor OV2640
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {cameraState.activa
                    ? 'Inicializado (ACTIVA)'
                    : 'Inactivo (OFF)'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Canal Wi-Fi
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {cameraState.wifiConectado
                    ? 'Conectado a red local'
                    : 'Sin conexión Wi-Fi'}
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

  if (profile.simulatorKind === 'nodemcu-system') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4">
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-700" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              SIMULADOR · {profile.shortBadge}
            </h2>
          </div>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
            1 Canal Analógico (A0: 0–1023) · DHT11 · E/S Digital
          </span>
        </div>

        <div className="space-y-3">
          {/* 1. Temperatura DHT11 */}
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Temperatura (DHT11)</span>
            </div>
            <div className="col-span-5 sm:col-span-6 flex items-center">
              <input
                type="range"
                aria-label="Temperatura NodeMCU"
                data-testid="nodemcu-slider-temp"
                min={0}
                max={50}
                step={1}
                value={nodeMcuSensors.temperatura}
                onChange={(e) =>
                  updateNodeMcuSensor('temperatura', Number(e.target.value))
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-slate-200"
              />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              <input
                type="number"
                aria-label="Valor de Temperatura NodeMCU"
                min={0}
                max={50}
                value={nodeMcuSensors.temperatura}
                onChange={(e) =>
                  updateNodeMcuSensor('temperatura', Number(e.target.value))
                }
                className="w-14 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-xs font-semibold text-slate-500 w-5">
                °C
              </span>
            </div>
          </div>

          {/* 2. Humedad ambiente DHT11 */}
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 sm:col-span-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Humedad amb. (DHT11)</span>
            </div>
            <div className="col-span-5 sm:col-span-6 flex items-center">
              <input
                type="range"
                aria-label="Humedad ambiente NodeMCU"
                data-testid="nodemcu-slider-hum"
                min={0}
                max={100}
                step={1}
                value={nodeMcuSensors.humedadAmbiente}
                onChange={(e) =>
                  updateNodeMcuSensor('humedadAmbiente', Number(e.target.value))
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-slate-200"
              />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              <input
                type="number"
                aria-label="Valor de Humedad ambiente NodeMCU"
                min={0}
                max={100}
                value={nodeMcuSensors.humedadAmbiente}
                onChange={(e) =>
                  updateNodeMcuSensor('humedadAmbiente', Number(e.target.value))
                }
                className="w-14 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-xs font-semibold text-slate-500 w-5">
                %
              </span>
            </div>
          </div>

          {/* 3. Única Entrada Analógica A0 (0 - 1023) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5 sm:col-span-4 flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
              <Gauge className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Entrada A0</span>
              <select
                aria-label="Sensor conectado a A0"
                value={nodeMcuSensors.analogSensorLabel}
                onChange={(e) =>
                  updateNodeMcuSensor(
                    'analogSensorLabel',
                    e.target.value as NodeMcuSensorState['analogSensorLabel']
                  )
                }
                className="text-[11px] bg-indigo-50 text-indigo-900 border border-indigo-200 rounded px-1 py-0.5 font-semibold"
              >
                <option value="LDR (Luz)">LDR</option>
                <option value="Humedad de suelo">Suelo</option>
                <option value="Potenciómetro / Genérico">Genérico</option>
              </select>
            </div>
            <div className="col-span-5 sm:col-span-6 flex items-center">
              <input
                type="range"
                aria-label="Entrada analógica A0"
                data-testid="nodemcu-slider-a0"
                min={0}
                max={1023}
                step={1}
                value={nodeMcuSensors.entradaAnalogicaA0}
                onChange={(e) =>
                  updateNodeMcuSensor(
                    'entradaAnalogicaA0',
                    Number(e.target.value)
                  )
                }
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 bg-slate-200"
              />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              <input
                type="number"
                aria-label="Valor de Entrada analógica A0"
                data-testid="nodemcu-input-a0"
                min={0}
                max={1023}
                value={nodeMcuSensors.entradaAnalogicaA0}
                onChange={(e) =>
                  updateNodeMcuSensor(
                    'entradaAnalogicaA0',
                    Number(e.target.value)
                  )
                }
                className="w-14 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] font-mono text-slate-400 w-5">
                A0
              </span>
            </div>
          </div>

          {/* 4. Entrada Digital + Botón pedagógico para verificar límite de entradas analógicas */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Entrada Digital (ENTRADA_DIG_PIN):
              </span>
              <button
                type="button"
                data-testid="nodemcu-toggle-digital-in"
                onClick={() =>
                  updateNodeMcuSensor(
                    'entradaDigital',
                    nodeMcuSensors.entradaDigital === 1 ? 0 : 1
                  )
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  nodeMcuSensors.entradaDigital === 1
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {nodeMcuSensors.entradaDigital === 1 ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                <span>
                  {nodeMcuSensors.entradaDigital === 1
                    ? 'HIGH (1)'
                    : 'LOW (0)'}
                </span>
              </button>
            </div>

            <button
              type="button"
              data-testid="nodemcu-test-analog-limit-btn"
              onClick={onInsertSecondAnalogSensorDemo}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Agrega un segundo sensor analógico para observar cómo Bi-Tech IoT Studio detecta la restricción de 1 solo canal A0 en NodeMCU"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Probar límite A0 (+2° sensor analógico)</span>
            </button>
          </div>
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
              onChange={(e) =>
                updateGardenSensor('temperatura', Number(e.target.value))
              }
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
              onChange={(e) =>
                updateGardenSensor('temperatura', Number(e.target.value))
              }
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
              onChange={(e) =>
                updateGardenSensor('humedadAmbiente', Number(e.target.value))
              }
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
              onChange={(e) =>
                updateGardenSensor('humedadAmbiente', Number(e.target.value))
              }
              className="w-12 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-500 w-5">%</span>
          </div>
        </div>

        {/* 3. Humedad del suelo */}
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
              onChange={(e) =>
                updateGardenSensor('humedadSuelo', Number(e.target.value))
              }
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
              onChange={(e) =>
                updateGardenSensor('humedadSuelo', Number(e.target.value))
              }
              className="w-12 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span
              className="text-xs font-semibold text-slate-400 w-5"
              title="Valor numérico sin calibración a %"
            >
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
              onChange={(e) =>
                updateGardenSensor('nivelLuz', Number(e.target.value))
              }
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
              onChange={(e) =>
                updateGardenSensor('nivelLuz', Number(e.target.value))
              }
              className="w-14 px-1.5 py-1 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-xs font-semibold text-slate-400 w-5">
              &nbsp;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
