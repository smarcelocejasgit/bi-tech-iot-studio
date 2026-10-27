import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  Plug,
  RefreshCw,
  Usb,
} from 'lucide-react';
import {
  DetectedBoardInfo,
  getProfileFqbn,
  SUPPORTED_DETECTION_PROFILES,
} from '../hardware/boardDetection';
import { DeviceProfileId } from '../types/hardware';

interface BoardDetectionPanelProps {
  boards: DetectedBoardInfo[];
  selectedPort: string;
  activeDevice: DeviceProfileId;
  hasScanned: boolean;
  isScanning: boolean;
  message: string | null;
  onDetect: () => void;
  onSelectPort: (port: string) => void;
  onUseBoard: (profile: DeviceProfileId, port: string) => void;
}

export const BoardDetectionPanel: React.FC<BoardDetectionPanelProps> = ({
  boards,
  selectedPort,
  activeDevice,
  hasScanned,
  isScanning,
  message,
  onDetect,
  onSelectPort,
  onUseBoard,
}) => {
  const selectedBoard = useMemo(
    () => boards.find((board) => board.port.address === selectedPort) ?? boards[0],
    [boards, selectedPort]
  );
  const [manualProfile, setManualProfile] = useState<DeviceProfileId | ''>('');

  useEffect(() => {
    if (selectedBoard?.suggestedProfileId) {
      setManualProfile(selectedBoard.suggestedProfileId);
    } else {
      setManualProfile('');
    }
  }, [selectedBoard?.port.address, selectedBoard?.suggestedProfileId]);

  const profileToUse = selectedBoard?.suggestedProfileId ?? manualProfile;
  const fqbnToUse =
    selectedBoard?.recommendedFqbn ??
    (profileToUse ? getProfileFqbn(profileToUse) : null);
  const isAlreadyInUse =
    Boolean(selectedBoard) &&
    Boolean(profileToUse) &&
    activeDevice === profileToUse &&
    selectedPort === selectedBoard.port.address;

  return (
    <section
      data-testid="board-detection-panel"
      className="rounded-2xl border-2 border-emerald-300 bg-white p-4 shadow-sm space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Detección automática USB
            </p>
            <h2 className="text-base font-extrabold text-slate-900">
              {isScanning
                ? 'Identificando la placa conectada...'
                : selectedBoard
                ? selectedBoard.displayName
                : 'No se detectó ninguna placa compatible.'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {selectedBoard
                ? 'Arduino CLI y la metadata USB identificaron el puerto y el perfil compatible.'
                : hasScanned
                ? 'Conectá una placa compatible por USB y volvé a detectar.'
                : 'Conectá la placa por USB. IoT Studio buscará su puerto y familia automáticamente.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="detect-board-btn"
          onClick={onDetect}
          disabled={isScanning}
          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isScanning ? 'Detectando...' : 'Detectar placa'}
        </button>
      </div>

      {selectedBoard && (
        <div
          data-testid="detected-board-details"
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Placa detectada
            </span>

            {boards.length > 1 && (
              <select
                data-testid="detected-board-select"
                aria-label="Seleccionar placa detectada"
                value={selectedBoard.port.address}
                onChange={(event) => onSelectPort(event.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
              >
                {boards.map((board) => (
                  <option key={board.port.address} value={board.port.address}>
                    {board.port.address} — {board.familyLabel}
                  </option>
                ))}
              </select>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              <dt className="text-slate-500 font-semibold">Placa</dt>
              <dd data-testid="detected-board-family" className="font-bold text-slate-900">
                {selectedBoard.familyLabel}
              </dd>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              <dt className="text-slate-500 font-semibold">Puerto</dt>
              <dd data-testid="detected-board-port" className="font-bold text-slate-900">
                {selectedBoard.port.address}
              </dd>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              <dt className="text-slate-500 font-semibold">USB-Serial</dt>
              <dd data-testid="detected-board-usb-chip" className="font-bold text-slate-900">
                {selectedBoard.usbSerialChip ?? 'No informado'}
              </dd>
            </div>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              <dt className="text-slate-500 font-semibold">Chip</dt>
              <dd data-testid="detected-board-chip" className="font-bold text-slate-900">
                {selectedBoard.chipModel ?? selectedBoard.familyLabel}
              </dd>
            </div>
            {selectedBoard.flashSize && (
              <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <dt className="text-slate-500 font-semibold">Flash</dt>
                <dd className="font-bold text-slate-900">{selectedBoard.flashSize}</dd>
              </div>
            )}
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              <dt className="text-slate-500 font-semibold">FQBN recomendado</dt>
              <dd data-testid="detected-board-fqbn" className="font-mono font-bold text-slate-900 break-all">
                {fqbnToUse ?? 'Seleccioná un perfil'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-emerald-200 pt-3">
            <div className="min-w-[240px] flex-1">
              <p className="text-[11px] font-semibold text-slate-500 mb-1">
                Perfil de hardware compatible
              </p>
              {selectedBoard.requiresProfileSelection ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    La familia no pudo distinguirse con seguridad.
                  </p>
                  <select
                    data-testid="manual-detected-profile-select"
                    value={manualProfile}
                    onChange={(event) =>
                      setManualProfile(
                        event.target.value as DeviceProfileId | ''
                      )
                    }
                    className="w-full max-w-md px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="">-- Seleccioná un perfil --</option>
                    {SUPPORTED_DETECTION_PROFILES.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.label} — {getProfileFqbn(profile.id)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p data-testid="detected-board-profile" className="text-sm font-extrabold text-emerald-900">
                  {selectedBoard.suggestedProfileLabel}
                </p>
              )}
            </div>

            <button
              type="button"
              data-testid="use-detected-board-btn"
              disabled={!profileToUse || isAlreadyInUse}
              onClick={() => {
                if (profileToUse) {
                  onUseBoard(profileToUse, selectedBoard.port.address);
                }
              }}
              className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:text-slate-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:cursor-default"
            >
              {isAlreadyInUse ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Plug className="w-4 h-4" />
              )}
              {isAlreadyInUse
                ? 'Placa en uso'
                : profileToUse
                ? 'Usar esta placa'
                : 'Seleccioná un perfil'}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
    </section>
  );
};
