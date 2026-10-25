import React from 'react';
import { Cpu, ShieldAlert, X } from 'lucide-react';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';

interface HardwareConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareConfigModal: React.FC<HardwareConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const gardenPins = Object.values(GARDEN_NODE_CONFIG.pins);
  const nodemcuPins = Object.values(NODEMCU_ESP8266_CONFIG.pins);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="px-5 py-3.5 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              Capacidades y Configuración Centralizada de Hardware (V0.1.1)
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

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs text-slate-700">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Arquitectura guiada por capacidades (Hardware Capabilities)
              </p>
              <p className="mt-0.5 leading-relaxed">
                Cada dispositivo declara sus capacidades físicas (entradas
                analógicas, E/S digitales, canales de relay, Wi-Fi, cámara). No se
                inventan números de GPIO definitivos: el generador utiliza constantes
                simbólicas centralizadas en <code>src/hardware/</code>.
              </p>
            </div>
          </div>

          {/* 1. Garden Node */}
          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              1. {GARDEN_NODE_CONFIG.shortBadge} — ADC:{' '}
              {GARDEN_NODE_CONFIG.capabilities.analogInputs} · Relay:{' '}
              {GARDEN_NODE_CONFIG.capabilities.relayChannels}
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
                  {gardenPins.map((pin) => (
                    <tr key={pin.symbolicName}>
                      <td className="p-2 font-mono font-bold text-emerald-800">
                        {pin.symbolicName}
                      </td>
                      <td className="p-2 font-mono text-slate-500">
                        {pin.mode}
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

          {/* 2. NodeMCU ESP8266 */}
          <div>
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
              2. {NODEMCU_ESP8266_CONFIG.shortBadge} — ADC:{' '}
              {NODEMCU_ESP8266_CONFIG.capabilities.analogInputs} (Solo A0) · Relay:{' '}
              {NODEMCU_ESP8266_CONFIG.capabilities.relayChannels}
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
                  {nodemcuPins.map((pin) => (
                    <tr key={pin.symbolicName}>
                      <td className="p-2 font-mono font-bold text-indigo-800">
                        {pin.symbolicName}
                      </td>
                      <td className="p-2 font-mono text-slate-500">
                        {pin.mode}
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
            <p className="mt-1.5 text-[11px] text-slate-500">
              {NODEMCU_ESP8266_CONFIG.capabilities.pedagogicalResourceNote}
            </p>
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
      </div>
    </div>
  );
};
