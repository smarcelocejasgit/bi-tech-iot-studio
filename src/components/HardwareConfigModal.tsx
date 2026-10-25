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
  const { capabilities: nmCaps } = NODEMCU_ESP8266_CONFIG;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="px-5 py-3.5 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              Capacidades Físicas vs. Perfil Educativo y Mapeo de Pines (V0.1.2)
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

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto text-xs text-slate-700">
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
      </div>
    </div>
  );
};
