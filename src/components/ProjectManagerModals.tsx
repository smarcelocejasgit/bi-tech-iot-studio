import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cpu,
  FolderOpen,
  Plus,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import { DeviceProfileId } from '../types/hardware';
import { StudioProject } from '../types/studio';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, device: DeviceProfileId) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState<string>('Proyecto sin título');
  const [device, setDevice] = useState<DeviceProfileId>('garden-node');

  useEffect(() => {
    if (isOpen) {
      setName('Proyecto sin título');
      setDevice('garden-node');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(name.trim() || 'Proyecto sin título', device);
  };

  return (
    <div
      data-testid="new-project-modal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-[#d4ecd8] to-[#e5f4e8] border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Nuevo proyecto
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de nuevo proyecto"
            className="p-1 rounded-lg text-slate-500 hover:bg-white/70 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre del proyecto */}
          <div>
            <label
              htmlFor="new-project-name"
              className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1"
            >
              Nombre del proyecto
            </label>
            <input
              id="new-project-name"
              type="text"
              data-testid="new-project-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Proyecto sin título"
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          {/* Dispositivo */}
          <div className="space-y-2">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Dispositivo
            </span>

            {/* Perfiles principales */}
            <div className="space-y-1.5">
              <button
                type="button"
                data-testid="new-project-device-garden-node"
                onClick={() => setDevice('garden-node')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  device === 'garden-node'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Garden Node Bi-Tech — ESP32
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Perfil principal predeterminado · Sensores y riego
                    </span>
                  </div>
                </div>
                {device === 'garden-node' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
              </button>

              <button
                type="button"
                data-testid="new-project-device-camera-node"
                onClick={() => setDevice('camera-node')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  device === 'camera-node'
                    ? 'bg-cyan-50 border-cyan-600 ring-2 ring-cyan-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-cyan-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Camera Node Bi-Tech — ESP32-CAM
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Perfil principal · Cámara OV2640 y streaming Wi-Fi
                    </span>
                  </div>
                </div>
                {device === 'camera-node' && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-700 shrink-0" />
                )}
              </button>
            </div>

            {/* Placas compatibles */}
            <div className="pt-1.5 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-500 mb-1">
                Placas compatibles:
              </span>
              <button
                type="button"
                data-testid="new-project-device-nodemcu-esp8266"
                onClick={() => setDevice('nodemcu-esp8266')}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  device === 'nodemcu-esp8266'
                    ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">
                    NodeMCU ESP8266
                  </span>
                </div>
                {device === 'nodemcu-esp8266' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
            El proyecto se abrirá con el área de programación Blockly vacía para
            que puedas construir tu programa desde cero.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="confirm-create-project-btn"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface MyProjectsModalProps {
  isOpen: boolean;
  projects: StudioProject[];
  activeProjectId: string;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({
  isOpen,
  projects,
  activeProjectId,
  onClose,
  onSelectProject,
  onOpenNewProject,
  onDeleteProject,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="my-projects-modal"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-[#d4ecd8] to-[#e5f4e8] border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Mis proyectos
              </h2>
              <p className="text-[11px] text-slate-600">
                Proyectos guardados en este navegador ({projects.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="my-projects-create-new-btn"
              onClick={onOpenNewProject}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar Mis proyectos"
              className="p-1 rounded-lg text-slate-500 hover:bg-white/70 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const profile = getDeviceProfile(proj.device);
            const isConfirmingDelete = confirmDeleteId === proj.id;

            return (
              <div
                key={proj.id}
                data-testid={`project-item-${proj.id}`}
                className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-400'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">
                      {proj.name}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">
                      {profile.shortBadge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {projects.length > 1 &&
                    (isConfirmingDelete ? (
                      <button
                        type="button"
                        data-testid={`confirm-delete-project-${proj.id}`}
                        onClick={() => {
                          onDeleteProject(proj.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        ¿Confirmar?
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid={`delete-project-${proj.id}`}
                        onClick={() => setConfirmDeleteId(proj.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar proyecto"
                        aria-label={`Eliminar ${proj.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ))}

                  <button
                    type="button"
                    data-testid={`open-project-${proj.id}`}
                    onClick={() => onSelectProject(proj.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {isActive ? 'Abierto' : 'Abrir'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
