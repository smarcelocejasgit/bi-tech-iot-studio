import React, { useState } from 'react';
import {
  Camera,
  Check,
  Code2,
  Cpu,
  GraduationCap,
  Info,
  Pencil,
  Play,
  Settings,
  Sprout,
  User,
} from 'lucide-react';
import {
  ALL_DEVICE_PROFILES,
  getDeviceProfile,
} from '../hardware/hardwareCapabilities';
import { DeviceProfileId, WorkMode } from '../types/hardware';

interface HeaderBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  activeDevice: DeviceProfileId;
  onSelectDevice: (device: DeviceProfileId) => void;
  workMode: WorkMode;
  onSelectWorkMode: (mode: WorkMode) => void;
  onOpenHardwareModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  projectName,
  onProjectNameChange,
  activeDevice,
  onSelectDevice,
  workMode,
  onSelectWorkMode,
  onOpenHardwareModal,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);
  const [showBoardNotice, setShowBoardNotice] = useState(false);

  const profile = getDeviceProfile(activeDevice);
  const { capabilities } = profile;

  const commitTitle = () => {
    const trimmed = tempTitle.trim() || 'Riego inteligente';
    onProjectNameChange(trimmed);
    setEditingTitle(false);
  };

  return (
    <header className="w-full">
      {/* Barra superior institucional Bi-Tech IoT Studio */}
      <div className="bg-gradient-to-r from-[#d4ecd8] via-[#e5f4e8] to-[#cbe6d0] border-b border-emerald-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#146c43]">
              Bi-Tech IoT Studio
            </span>
          </div>
          <span className="hidden md:inline-block text-sm italic text-emerald-900/75 font-medium pl-2 border-l border-emerald-700/20">
            Aprende · Programa · Conecta · Cultiva un mundo mejor
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-emerald-300/70 text-emerald-900 font-medium shadow-2xs"
            title="Entorno alineado al Diseño Curricular CABA 2024 y Plan de Bialfabetización"
          >
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Modo educativo</span>
          </div>

          <button
            type="button"
            onClick={onOpenHardwareModal}
            className="p-2 rounded-full bg-white/70 hover:bg-white text-slate-700 border border-emerald-300/60 transition cursor-pointer"
            title="Capacidades de hardware y configuración de pines"
            aria-label="Configuración de hardware"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-full bg-emerald-800/80 text-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sub-barra de proyecto, selector de los 3 perfiles de dispositivo y modos de trabajo */}
      <div className="max-w-[1600px] mx-auto px-3 pt-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Izquierda: Proyecto y selector de dispositivo */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              {profile.simulatorKind === 'camera-system' ? (
                <Camera className="w-6 h-6 text-cyan-600" />
              ) : profile.simulatorKind === 'nodemcu-system' ? (
                <Cpu className="w-6 h-6 text-indigo-600" />
              ) : (
                <Sprout className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600 font-medium text-base">
                  Proyecto:
                </span>
                {editingTitle ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitTitle()}
                      className="px-2 py-0.5 text-base font-bold text-slate-900 border border-emerald-400 rounded-md focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={commitTitle}
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-slate-900">
                      {projectName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setTempTitle(projectName);
                        setEditingTitle(true);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                      title="Cambiar nombre del proyecto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Resumen de capacidades físicas del dispositivo activo */}
                <span
                  data-testid="device-capabilities-pill"
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                >
                  MCU: {profile.mcu} · ADC: {capabilities.analogInputs} · E/S Dig:{' '}
                  {capabilities.digitalInputs}/{capabilities.digitalOutputs} · Relay:{' '}
                  {capabilities.relayChannels}
                </span>
              </div>

              {/* Selector de Dispositivo basado en el registro central de perfiles */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Dispositivo:
                </span>

                <div
                  className="inline-flex flex-wrap rounded-lg bg-slate-100 p-0.5 border border-slate-200 gap-0.5"
                  role="group"
                  aria-label="Selector de dispositivo Bi-Tech"
                >
                  {ALL_DEVICE_PROFILES.map((item) => {
                    const isSelected = activeDevice === item.id;
                    const activeColor =
                      item.simulatorKind === 'camera-system'
                        ? 'bg-cyan-700 text-white shadow-2xs'
                        : item.simulatorKind === 'nodemcu-system'
                        ? 'bg-indigo-700 text-white shadow-2xs'
                        : 'bg-emerald-700 text-white shadow-2xs';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`select-${item.id}`}
                        onClick={() => onSelectDevice(item.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? activeColor
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {item.simulatorKind === 'camera-system' ? (
                          <Camera className="w-3.5 h-3.5" />
                        ) : item.simulatorKind === 'nodemcu-system' ? (
                          <Cpu className="w-3.5 h-3.5" />
                        ) : (
                          <Sprout className="w-3.5 h-3.5" />
                        )}
                        <span>{item.shortBadge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: Tres modos de trabajo (Programar, Simular, Placa real) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="mode-program"
              onClick={() => {
                setShowBoardNotice(false);
                onSelectWorkMode('program');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer border ${
                workMode === 'program'
                  ? 'bg-[#1b8354] text-white border-[#156a43] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Programar
            </button>

            <button
              type="button"
              data-testid="mode-simulate"
              onClick={() => {
                setShowBoardNotice(false);
                onSelectWorkMode('simulate');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer border ${
                workMode === 'simulate'
                  ? 'bg-[#1b8354] text-white border-[#156a43] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Simular
            </button>

            <div className="relative">
              <button
                type="button"
                data-testid="mode-board"
                onClick={() => setShowBoardNotice((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                title="Disponible en V0.2 (Compilación y carga sobre placa física)"
              >
                <Cpu className="w-4 h-4 text-slate-500" />
                <span>Placa real</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  Próximamente
                </span>
              </button>

              {showBoardNotice && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-amber-200 p-3.5 z-50 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">
                        Modo Placa Real — Planificado para V0.2
                      </p>
                      <p className="mt-1 leading-relaxed">
                        En <strong>V0.1.1</strong> consolidamos los perfiles{' '}
                        <strong>ESP32</strong>, <strong>ESP32-CAM</strong> y{' '}
                        <strong>NodeMCU ESP8266</strong>. La primera validación de
                        carga física por USB se realizará en <strong>V0.2</strong>{' '}
                        iniciando con la placa física NodeMCU ESP8266 disponible.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
