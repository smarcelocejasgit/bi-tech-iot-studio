import React from 'react';
import { Cpu, ShieldAlert, X } from 'lucide-react';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';

interface HardwareConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareConfigModal: React.FC<HardwareConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const pinsList = Object.values(GARDEN_NODE_CONFIG.pins);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="px-5 py-3.5 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              Configuración Centralizada de Hardware (V0.1)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-slate-700">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supuestos pendientes de validación física</p>
              <p className="mt-0.5 leading-relaxed">
                Siguiendo la arquitectura de Bi-Tech IoT Studio, no se inventan números de
                GPIO ni endpoints fijos de streaming. El código generado utiliza constantes
                simbólicas centralizadas en <code>src/hardware/</code>.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              1. {GARDEN_NODE_CONFIG.name} ({GARDEN_NODE_CONFIG.mcu})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2 font-bold">Constante C/C++</th>
                    <th className="p-2 font-bold">Modo</th>
                    <th className="p-2 font-bold">Componente</th>
                    <th className="p-2 font-bold">Estado GPIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pinsList.map((pin) => (
                    <tr key={pin.symbolicName}>
                      <td className="p-2 font-mono font-bold text-emerald-800">
                        {pin.symbolicName}
                      </td>
                      <td className="p-2 font-mono text-slate-500">{pin.mode}</td>
                      <td className="p-2">{pin.component}</td>
                      <td className="p-2 text-amber-700 font-medium">
                        {pin.verifiedGpio ?? 'Pendiente verificar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Estado seguro inicial de relés: <strong>Bomba = OFF</strong>,{' '}
              <strong>Iluminación = OFF</strong>. Polaridad activa:{' '}
              <code>{GARDEN_NODE_CONFIG.relayConfig.polarity}</code>.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              2. {CAMERA_NODE_CONFIG.name} ({CAMERA_NODE_CONFIG.mcu} ·{' '}
              {CAMERA_NODE_CONFIG.sensor})
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p>
                <strong>Canal de programación:</strong> {CAMERA_NODE_CONFIG.programmingChannel}
              </p>
              <p>
                <strong>Canal de comunicación y streaming:</strong>{' '}
                {CAMERA_NODE_CONFIG.streamingChannel}
              </p>
              <p>
                <strong>Resolución inicial por defecto:</strong>{' '}
                {CAMERA_NODE_CONFIG.defaultResolution} (Calidad JPEG:{' '}
                {CAMERA_NODE_CONFIG.defaultQuality})
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
      </div>
    </div>
  );
};
