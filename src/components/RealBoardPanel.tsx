import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileCode2,
  Loader2,
  Play,
  Plug,
  Radio,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Trash2,
  Unplug,
  Upload,
  Wifi,
} from 'lucide-react';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import {
  CameraStreamConnectionInput,
  parseCameraSerialOutput,
  resolveCameraStreamUrl,
} from '../hardware/cameraSerialParser';
import {
  CompileResult,
  defaultHardwareBridge,
  HardwareBridge,
  isHostedWebEnvironment,
  SerialMonitorSession,
  SerialPortInfo,
  UploadPhase,
  UploadResult,
} from '../hardware/hardwareBridge';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';
import { DeviceProfileId, HardwareValidationIssue } from '../types/hardware';

interface RealBoardPanelProps {
  activeDevice: DeviceProfileId;
  onSelectDevice: (device: DeviceProfileId) => void;
  sketchCode: string;
  validationIssues: HardwareValidationIssue[];
  statementCount: number;
  cameraStreamConfig?: CameraStreamConnectionInput;
  onChangeCameraStreamConfig?: (config: CameraStreamConnectionInput) => void;
  bridge?: HardwareBridge;
}

type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';
type UploadStatus = 'idle' | 'connecting' | 'uploading' | 'completed' | 'error';

export const RealBoardPanel: React.FC<RealBoardPanelProps> = ({
  activeDevice,
  onSelectDevice,
  sketchCode,
  validationIssues,
  statementCount,
  cameraStreamConfig,
  onChangeCameraStreamConfig,
  bridge = defaultHardwareBridge,
}) => {
  // 3. Puerto
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isScanningPorts, setIsScanningPorts] = useState<boolean>(false);
  const [portScanMessage, setPortScanMessage] = useState<string | null>(null);

  // 4. Compilar
  const [compileStatus, setCompileStatus] = useState<CompileStatus>('idle');
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [compiledSketchSnapshot, setCompiledSketchSnapshot] =
    useState<string>('');
  const [showCompileDetails, setShowCompileDetails] = useState<boolean>(false);

  // 5. Cargar & 6. Ejecutar
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadPercentage, setUploadPercentage] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showUploadDetails, setShowUploadDetails] = useState<boolean>(false);

  // Monitor de la placa (Monitor Serie)
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [isMonitorConnected, setIsMonitorConnected] = useState<boolean>(false);
  const [serialOutput, setSerialOutput] = useState<string>('');
  const [serialError, setSerialError] = useState<string | null>(null);
  const monitorSessionRef = useRef<SerialMonitorSession | null>(null);
  const serialConsoleRef = useRef<HTMLPreElement | null>(null);

  // Configuración local de streaming para Camera Node (sin valores hardcodeados)
  const [localStreamInput, setLocalStreamInput] =
    useState<CameraStreamConnectionInput>(
      cameraStreamConfig ?? {
        host: '',
        port: '',
        endpointPath: '',
        fullUrl: '',
      }
    );

  const effectiveStreamInput = cameraStreamConfig ?? localStreamInput;

  const updateStreamInput = (patch: Partial<CameraStreamConnectionInput>) => {
    const next = { ...effectiveStreamInput, ...patch };
    setLocalStreamInput(next);
    onChangeCameraStreamConfig?.(next);
  };

  // Parser tolerante para mensajes futuros del Monitor Serie en Camera Node
  const parsedCameraSerial = useMemo(
    () => parseCameraSerialOutput(serialOutput),
    [serialOutput]
  );

  // Si el parser detecta una IP en el Monitor Serie y el campo host está vacío, sugerirla
  useEffect(() => {
    if (
      activeDevice === 'camera-node' &&
      parsedCameraSerial.detectedIp &&
      !effectiveStreamInput.host
    ) {
      updateStreamInput({ host: parsedCameraSerial.detectedIp });
    }
  }, [activeDevice, parsedCameraSerial.detectedIp]);

  const resolvedStreamUrl = useMemo(
    () => resolveCameraStreamUrl(effectiveStreamInput),
    [effectiveStreamInput]
  );

  const isSketchCurrentlyCompiled =
    compileStatus === 'success' && compiledSketchSnapshot === sketchCode;

  // Resetear estado de compilación al cambiar de dispositivo o modificar el sketch
  useEffect(() => {
    if (
      compileStatus === 'success' &&
      compiledSketchSnapshot &&
      compiledSketchSnapshot !== sketchCode
    ) {
      setCompileStatus('idle');
    }
  }, [sketchCode, compileStatus, compiledSketchSnapshot]);

  // Auto-scroll en consola serie
  useEffect(() => {
    if (serialConsoleRef.current) {
      serialConsoleRef.current.scrollTop =
        serialConsoleRef.current.scrollHeight;
    }
  }, [serialOutput]);

  // Limpiar sesión de monitor al desmontar
  useEffect(() => {
    return () => {
      if (monitorSessionRef.current) {
        void monitorSessionRef.current.disconnect();
        monitorSessionRef.current = null;
      }
    };
  }, []);

  const handleScanPorts = async () => {
    setIsScanningPorts(true);
    setPortScanMessage(null);
    try {
      const detected = await bridge.listPorts();
      setPorts(detected);

      if (detected.length === 0) {
        setSelectedPort('');
        setPortScanMessage(
          'No se detectaron puertos serie. Conectá la placa por USB y volvé a buscar.'
        );
      } else if (activeDevice === 'nodemcu-esp8266') {
        const stillExists = detected.some((p) => p.address === selectedPort);
        if (!stillExists) {
          const preferredUsb = detected.find((p) => p.isUsb) ?? detected[0];
          setSelectedPort(preferredUsb.address);
        }
      }
    } catch {
      setPortScanMessage(
        'No fue posible consultar los puertos serie del equipo.'
      );
    } finally {
      setIsScanningPorts(false);
    }
  };

  useEffect(() => {
    if (
      !isHostedWebEnvironment() &&
      (activeDevice === 'nodemcu-esp8266' || activeDevice === 'camera-node')
    ) {
      void handleScanPorts();
    }
  }, [activeDevice]);

  const handleCompile = async () => {
    setCompileStatus('compiling');
    setCompileResult(null);
    setShowCompileDetails(false);
    setUploadStatus('idle');
    setUploadResult(null);

    const targetDevice =
      activeDevice === 'camera-node' ? 'camera-node' : 'nodemcu-esp8266';
    const targetFqbn =
      activeDevice === 'camera-node'
        ? CAMERA_NODE_CONFIG.verifiedFqbn ?? CAMERA_NODE_CONFIG.candidateFqbn
        : NODEMCU_ESP8266_CONFIG.verifiedFqbn ?? 'esp8266:esp8266:nodemcuv2';

    try {
      const result = await bridge.compile({
        device: targetDevice,
        fqbn: targetFqbn,
        sketchCode,
      });
      setCompileResult(result);
      if (result.success) {
        setCompileStatus('success');
        setCompiledSketchSnapshot(sketchCode);
      } else {
        setCompileStatus('error');
      }
    } catch (err) {
      setCompileStatus('error');
      setCompileResult({
        success: false,
        summaryMessage: 'No se pudo conectar con el compilador local.',
        technicalDetails: String(err),
        compiledAt: new Date().toISOString(),
      });
    }
  };

  const disconnectSerialMonitor = async () => {
    if (monitorSessionRef.current) {
      await monitorSessionRef.current.disconnect();
      monitorSessionRef.current = null;
    }
    setIsMonitorConnected(false);
  };

  const handleUpload = async () => {
    if (!selectedPort || !isSketchCurrentlyCompiled) {
      return;
    }

    if (isMonitorConnected) {
      await disconnectSerialMonitor();
    }

    const targetDevice =
      activeDevice === 'camera-node' ? 'camera-node' : 'nodemcu-esp8266';
    const targetFqbn =
      activeDevice === 'camera-node'
        ? CAMERA_NODE_CONFIG.verifiedFqbn ?? CAMERA_NODE_CONFIG.candidateFqbn
        : NODEMCU_ESP8266_CONFIG.verifiedFqbn ?? 'esp8266:esp8266:nodemcuv2';

    setUploadStatus('connecting');
    setUploadPercentage(5);
    setUploadStatusText(`Conectando con la placa en ${selectedPort}...`);
    setUploadResult(null);
    setShowUploadDetails(false);

    try {
      const result = await bridge.upload(
        {
          device: targetDevice,
          fqbn: targetFqbn,
          port: selectedPort,
          sketchCode,
        },
        (progress) => {
          const nextStatus: Record<UploadPhase, UploadStatus> = {
            connecting: 'connecting',
            uploading: 'uploading',
            completed: 'completed',
            error: 'error',
          };
          setUploadStatus(nextStatus[progress.phase]);
          if (progress.percentage !== null) {
            setUploadPercentage(progress.percentage);
          }
          setUploadStatusText(progress.statusText);
        }
      );

      setUploadResult(result);
      if (result.success) {
        setUploadStatus('completed');
        setUploadPercentage(100);
        setUploadStatusText('Carga completada (100%)');
      } else {
        setUploadStatus('error');
        setUploadStatusText('Error en la carga');
      }
    } catch (err) {
      setUploadStatus('error');
      setUploadStatusText('Error al comunicarse con la placa');
      setUploadResult({
        success: false,
        summaryMessage: 'No se pudo realizar la carga en la placa.',
        technicalDetails: String(err),
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleToggleSerialMonitor = async () => {
    if (isMonitorConnected) {
      await disconnectSerialMonitor();
      return;
    }

    if (!selectedPort) {
      setSerialError('Seleccioná un puerto en el Paso 3 antes de conectar.');
      return;
    }

    setSerialError(null);
    setIsMonitorConnected(true);

    try {
      const session = await bridge.openSerialMonitor(
        { port: selectedPort, baudRate },
        {
          onData: (chunk) => {
            setSerialOutput((prev) => prev + chunk);
          },
          onError: (msg) => {
            setSerialError(msg);
          },
          onClose: () => {
            setIsMonitorConnected(false);
          },
        }
      );
      monitorSessionRef.current = session;
    } catch (err) {
      setSerialError(String(err));
      setIsMonitorConnected(false);
    }
  };

  const sketchLinesCount = sketchCode.split('\n').length;

  // ============================================================================
  // VERSIÓN WEB ALOJADA (FIREBASE HOSTING): SIN ACCESO A ARDUINO CLI DEL SERVIDOR
  // ============================================================================
  if (isHostedWebEnvironment()) {
    return (
      <section
        data-testid="real-board-panel-web-hosted"
        className="bg-white rounded-2xl border border-indigo-300/90 shadow-2xs px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span
              data-testid="web-hosted-board-banner"
              className="inline-block text-xs sm:text-sm font-extrabold text-indigo-950"
            >
              Conexión con placa física — próximamente disponible desde el
              navegador
            </span>
            <p className="text-xs text-slate-600">
              Podés programar con bloques, simular en tiempo real y descargar el
              sketch <code>.ino</code> desde el panel{' '}
              <strong>Código Arduino</strong>.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-semibold shrink-0">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Carga USB directa habilitada en entorno local
        </span>
      </section>
    );
  }

  // ============================================================================
  // MODO PLACA REAL PARA CAMERA NODE BI-TECH (ESP32-CAM · V0.4A SOFTWARE READINESS)
  // ============================================================================
  if (activeDevice === 'camera-node') {
    return (
      <section
        data-testid="real-board-panel-camera"
        className="bg-white rounded-2xl border-2 border-cyan-600/80 shadow-sm p-4 space-y-4"
      >
        {/* Cabecera Camera Node Placa real */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center shadow-2xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900">
                  Placa real — Camera Node Bi-Tech (ESP32-CAM · OV2640)
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-900 border border-cyan-200">
                  FQBN candidato: {CAMERA_NODE_CONFIG.candidateFqbn}
                </span>
                <span
                  data-testid="camera-hardware-pending-pill"
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300"
                >
                  Pendiente de validación con hardware
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Entorno de compilación ESP32, placeholders seguros de Wi-Fi y
                panel de streaming listos para conectar mañana la ESP32-CAM
                física.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1 text-[11px] font-bold">
            {[
              { label: '1. PROGRAMA', done: true },
              { label: '2. SKETCH', done: true },
              { label: '4. COMPILAR', done: isSketchCurrentlyCompiled },
              { label: '3/5/6/7/8/9 HARDWARE', pending: true },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.label}>
                <span
                  className={`px-2 py-1 rounded-lg border ${
                    item.done
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {item.label}
                </span>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Grilla de los 9 pasos de Camera Node + Monitor Serie preparado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Izquierda: Pasos 1 a 9 */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Fila: 1. Programa y 2. Sketch generado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Programa */}
              <div
                data-testid="cam-step-1-program"
                className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                    1. Programa
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    Programa Blockly listo
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {statementCount} bloque(s) configurados (OV2640 + Wi-Fi +
                    Streaming)
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              {/* 2. Sketch generado */}
              <div
                data-testid="cam-step-2-sketch"
                className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                    2. Sketch generado
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    Sketch .ino completo ({sketchLinesCount} líneas)
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Incluye esp_camera.h, WiFi.h y esp_http_server.h
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            </div>

            {/* 3. Puerto USB */}
            <div
              data-testid="cam-step-3-port"
              className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                    3. Puerto USB
                  </span>
                  <p className="text-xs text-slate-700">
                    Seleccioná el puerto cuando conectes la ESP32-CAM física.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Pendiente de validación con hardware
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  data-testid="board-port-select"
                  aria-label="Seleccionar puerto USB para ESP32-CAM"
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                >
                  <option value="">
                    -- Sin ESP32-CAM conectada (seleccionar mañana) --
                  </option>
                  {ports.map((p) => (
                    <option key={p.address} value={p.address}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  data-testid="detect-ports-btn"
                  onClick={handleScanPorts}
                  disabled={isScanningPorts}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-cyan-700 ${
                      isScanningPorts ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Detectar puertos</span>
                </button>
              </div>
            </div>

            {/* 4. Compilar */}
            <div
              data-testid="cam-step-4-compile"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-800">
                    4. Compilar (Validación de software habilitada hoy)
                  </span>
                  <p className="text-xs text-slate-600">
                    Compila el sketch de Camera Node con el core oficial ESP32 (
                    <code>{CAMERA_NODE_CONFIG.candidateFqbn}</code>).
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="board-compile-btn"
                  onClick={handleCompile}
                  disabled={compileStatus === 'compiling'}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:bg-cyan-400 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
                >
                  {compileStatus === 'compiling' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Compilando...</span>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="w-4 h-4" />
                      <span>Compilar programa</span>
                    </>
                  )}
                </button>
              </div>

              {compileStatus === 'compiling' && (
                <div
                  data-testid="compile-status-compiling"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-900"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-700" />
                  <span>
                    Compilando proyecto Camera Node para ESP32-CAM...
                  </span>
                </div>
              )}

              {compileStatus === 'success' && compileResult && (
                <div
                  data-testid="compile-status-success"
                  className="space-y-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Compilación correcta (ESP32-CAM)</span>
                    </div>

                    <button
                      type="button"
                      data-testid="toggle-compile-technical-details"
                      onClick={() => setShowCompileDetails((prev) => !prev)}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver detalles técnicos</span>
                      {showCompileDetails ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {compileResult.summaryMessage}
                  </p>
                  {showCompileDetails && (
                    <pre
                      data-testid="compile-technical-details"
                      className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                    >
                      {compileResult.technicalDetails}
                    </pre>
                  )}
                </div>
              )}

              {compileStatus === 'error' && compileResult && (
                <div
                  data-testid="compile-status-error"
                  className="space-y-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Error de compilación</span>
                    </div>
                    <button
                      type="button"
                      data-testid="toggle-compile-technical-details"
                      onClick={() => setShowCompileDetails((prev) => !prev)}
                      className="text-[11px] font-semibold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver detalles técnicos</span>
                      {showCompileDetails ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    {compileResult.summaryMessage}
                  </p>
                  {showCompileDetails && (
                    <pre
                      data-testid="compile-technical-details"
                      className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                    >
                      {compileResult.technicalDetails}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Pasos 5, 6, 7 y 8: requieren cámara física */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 5. Cargar */}
              <div
                data-testid="cam-step-5-upload"
                className={`p-3 rounded-xl border space-y-2 ${
                  uploadStatus === 'completed'
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                      5. Cargar
                    </span>
                    <p className="text-[11px] text-slate-700">
                      {!selectedPort
                        ? 'Seleccioná primero el puerto USB en el Paso 3.'
                        : !isSketchCurrentlyCompiled
                        ? 'Compilá primero el sketch en el Paso 4.'
                        : `Listo para cargar en ESP32-CAM por ${selectedPort}.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="board-upload-btn"
                    onClick={handleUpload}
                    disabled={
                      !selectedPort ||
                      !isSketchCurrentlyCompiled ||
                      uploadStatus === 'connecting' ||
                      uploadStatus === 'uploading'
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    {uploadStatus === 'connecting' ||
                    uploadStatus === 'uploading' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {uploadStatus === 'connecting'
                            ? 'Conectando...'
                            : `Cargando${
                                uploadPercentage !== null
                                  ? ` (${uploadPercentage}%)`
                                  : '...'
                              }`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cargar en la placa</span>
                      </>
                    )}
                  </button>
                </div>

                {(uploadStatus === 'connecting' ||
                  uploadStatus === 'uploading') && (
                  <div
                    data-testid="upload-progress-box"
                    className="space-y-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-950"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{uploadStatusText}</span>
                      {uploadPercentage !== null && (
                        <span>{uploadPercentage}%</span>
                      )}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-cyan-200 overflow-hidden">
                      <div
                        className="h-full bg-cyan-600 transition-all duration-200"
                        style={{ width: `${uploadPercentage ?? 10}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadStatus === 'completed' && uploadResult && (
                  <div
                    data-testid="upload-status-completed"
                    className="space-y-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Carga completada en {selectedPort}
                      </span>
                      <button
                        type="button"
                        data-testid="toggle-upload-technical-details"
                        onClick={() => setShowUploadDetails((prev) => !prev)}
                        className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver detalles técnicos</span>
                        {showUploadDetails ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {showUploadDetails && (
                      <pre
                        data-testid="upload-technical-details"
                        className="mt-1 p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-36 whitespace-pre-wrap"
                      >
                        {uploadResult.technicalDetails}
                      </pre>
                    )}
                  </div>
                )}

                {uploadStatus === 'error' && uploadResult && (
                  <div
                    data-testid="upload-status-error"
                    className="space-y-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Error en la carga
                      </span>
                      <button
                        type="button"
                        data-testid="toggle-upload-technical-details"
                        onClick={() => setShowUploadDetails((prev) => !prev)}
                        className="text-[11px] font-semibold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver detalles técnicos</span>
                        {showUploadDetails ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      {uploadResult.summaryMessage}
                    </p>
                    {showUploadDetails && (
                      <pre
                        data-testid="upload-technical-details"
                        className="mt-1 p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-36 whitespace-pre-wrap"
                      >
                        {uploadResult.technicalDetails}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Monitor Serie */}
              <div
                data-testid="cam-step-6-serial"
                className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                    6. Monitor Serie
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Pendiente de validación con hardware
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Parser tolerante preparado para reconocer{' '}
                  <code>Camera ready</code>, <code>WiFi connected</code>,{' '}
                  <code>IP</code> y <code>Streaming started</code>.
                </p>
              </div>

              {/* 7. Wi-Fi */}
              <div
                data-testid="cam-step-7-wifi"
                className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-amber-800" />
                    7. Wi-Fi
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Pendiente de validación con hardware
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Placeholders seguros activos (<code>WIFI_SSID</code> /{' '}
                  <code>WIFI_PASS</code> en <code>wifi_credentials.h</code>{' '}
                  excluido por <code>.gitignore</code>).
                </p>
              </div>

              {/* 8. Cámara */}
              <div
                data-testid="cam-step-8-camera"
                className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-800" />
                    8. Cámara (OV2640)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Pendiente de validación con hardware
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Inicialización física del sensor OV2640 sujeta a conexión de
                  la placa ESP32-CAM.
                </p>
              </div>
            </div>

            {/* 9. Streaming */}
            <div
              data-testid="cam-step-9-streaming"
              className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-800" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                    9. Streaming (Configuración sin IP/Puerto/Endpoint
                    hardcodeados)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Pendiente de validación con hardware
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    IP / Host (detectado o manual)
                  </label>
                  <input
                    type="text"
                    data-testid="camera-stream-host-input"
                    placeholder="Pendiente de conexión Wi-Fi"
                    value={effectiveStreamInput.host ?? ''}
                    onChange={(e) => updateStreamInput({ host: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Puerto (opcional)
                  </label>
                  <input
                    type="text"
                    data-testid="camera-stream-port-input"
                    placeholder="Sin fijar"
                    value={effectiveStreamInput.port ?? ''}
                    onChange={(e) => updateStreamInput({ port: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Endpoint (opcional)
                  </label>
                  <input
                    type="text"
                    data-testid="camera-stream-path-input"
                    placeholder="Sin fijar"
                    value={effectiveStreamInput.endpointPath ?? ''}
                    onChange={(e) =>
                      updateStreamInput({ endpointPath: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-700">
                <span>
                  URL de streaming resuelta:{' '}
                  <code
                    data-testid="resolved-camera-stream-url"
                    className="font-mono font-bold text-slate-900"
                  >
                    {resolvedStreamUrl ??
                      'Pendiente (se completará al conectar la ESP32-CAM a Wi-Fi)'}
                  </code>
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Sin credenciales ni IPs fijadas en código
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: Monitor Serie preparado con estado del parser de Camera Node */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden min-h-[380px]">
            <div className="px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-extrabold tracking-wide text-white">
                  Monitor Serie — Camera Node
                </span>
                <span
                  data-testid="serial-status-pill"
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isMonitorConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {isMonitorConnected
                    ? `Conectado (${selectedPort})`
                    : 'Pendiente de validación con hardware'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  data-testid="serial-baud-select"
                  aria-label="Velocidad en baudios Camera Node"
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  disabled={isMonitorConnected}
                  className="px-2 py-1 rounded bg-slate-700 text-slate-100 text-[11px] font-mono border border-slate-600"
                >
                  <option value={115200}>115200 baud</option>
                  <option value={9600}>9600 baud</option>
                </select>

                <button
                  type="button"
                  data-testid="serial-clear-btn"
                  onClick={() => setSerialOutput('')}
                  className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                  title="Limpiar consola"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  data-testid="serial-connect-btn"
                  onClick={handleToggleSerialMonitor}
                  disabled={
                    !selectedPort ||
                    uploadStatus === 'connecting' ||
                    uploadStatus === 'uploading'
                  }
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                    isMonitorConnected
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-700 disabled:text-slate-400'
                  }`}
                >
                  {isMonitorConnected ? (
                    <>
                      <Unplug className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </>
                  ) : (
                    <>
                      <Plug className="w-3.5 h-3.5" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Indicadores del parser tolerante de Camera Node */}
            <div className="px-3.5 py-2 bg-slate-800/50 border-b border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="px-2 py-1 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">Camera ready:</span>
                <span
                  className={
                    parsedCameraSerial.cameraReady
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-300'
                  }
                >
                  {parsedCameraSerial.cameraReady ? 'Detectado' : 'Pendiente'}
                </span>
              </div>
              <div className="px-2 py-1 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">WiFi connected:</span>
                <span
                  className={
                    parsedCameraSerial.wifiConnected
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-300'
                  }
                >
                  {parsedCameraSerial.wifiConnected ? 'Detectado' : 'Pendiente'}
                </span>
              </div>
              <div className="px-2 py-1 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">IP detectada:</span>
                <span className="text-cyan-300">
                  {parsedCameraSerial.detectedIp ?? 'Pendiente'}
                </span>
              </div>
              <div className="px-2 py-1 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-400">Streaming:</span>
                <span
                  className={
                    parsedCameraSerial.streamingStarted
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-300'
                  }
                >
                  {parsedCameraSerial.streamingStarted
                    ? 'Iniciado'
                    : 'Pendiente'}
                </span>
              </div>
            </div>

            <pre
              ref={serialConsoleRef}
              data-testid="serial-monitor-output"
              className="flex-1 p-3.5 font-mono text-xs text-cyan-200 overflow-y-auto whitespace-pre-wrap leading-relaxed"
            >
              {serialOutput ||
                [
                  '[V0.4A — Preparación de Software Camera Node Bi-Tech]',
                  'Estado actual: Pendiente de validación con hardware (ESP32-CAM física no conectada hoy).',
                  '',
                  'Parser Serie configurado y listo para detectar mañana:',
                  '  • Camera ready',
                  '  • WiFi connected',
                  '  • IP: xxx.xxx.xxx.xxx',
                  '  • Streaming started',
                ].join('\n')}
            </pre>
          </div>
        </div>
      </section>
    );
  }

  // Si el dispositivo activo es Garden Node (ESP32), informar alcance actual
  if (activeDevice !== 'nodemcu-esp8266') {
    return (
      <section
        data-testid="real-board-panel-unsupported"
        className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Modo Placa real — Habilitado para NodeMCU ESP8266 y preparado
                para Camera Node (ESP32-CAM)
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Seleccioná <strong>NodeMCU — ESP8266</strong> para cargar en
                placa física o <strong>Camera Node Bi-Tech — ESP32-CAM</strong>{' '}
                para compilar y preparar el nodo de cámara.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="switch-to-nodemcu-btn"
              onClick={() => onSelectDevice('nodemcu-esp8266')}
              className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Cpu className="w-4 h-4" />
              NodeMCU — ESP8266
            </button>
            <button
              type="button"
              data-testid="switch-to-camera-btn"
              onClick={() => onSelectDevice('camera-node')}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Camera className="w-4 h-4" />
              Camera Node — ESP32-CAM
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="real-board-panel"
      className="bg-white rounded-2xl border-2 border-indigo-500/80 shadow-sm p-4 space-y-4"
    >
      {/* Cabecera pedagógica: recorrido evidente del estudiante */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Placa real — NodeMCU ESP8266
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                DHT11: D5 · Suelo: A0 · Relay: D1
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Compilá tu programa de bloques, cargalo por USB en la NodeMCU y
              observá qué ocurre en vivo.
            </p>
          </div>
        </div>

        {/* Secuencia visual PROGRAMAR -> SIMULAR -> PLACA REAL -> COMPILAR -> CARGAR -> OBSERVAR */}
        <div
          data-testid="student-flow-steps"
          className="flex items-center flex-wrap gap-1 text-[11px] font-bold"
        >
          {[
            { label: 'PROGRAMAR', done: true },
            { label: 'SIMULAR', done: true },
            { label: 'PLACA REAL', active: true },
            { label: 'COMPILAR', done: isSketchCurrentlyCompiled },
            { label: 'CARGAR', done: uploadStatus === 'completed' },
            { label: 'OBSERVAR', done: isMonitorConnected },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.label}>
              <span
                className={`px-2 py-1 rounded-lg border ${
                  step.done
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : step.active
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {step.label}
              </span>
              {idx < arr.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grilla principal: Izquierda pasos 1 a 6 | Derecha Monitor de la placa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna izquierda: 6 pasos del modo Placa real */}
        <div className="lg:col-span-7 space-y-3">
          {/* Paso 1 y Paso 2 en fila compacta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Programa */}
            <div
              data-testid="step-1-program"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  1. Programa
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {validationIssues.length === 0
                    ? 'Programa Blockly listo'
                    : 'Revisar advertencia de hardware'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {statementCount > 0
                    ? `${statementCount} bloque(s) activos en tu algoritmo`
                    : 'Estructura base lista'}
                </p>
              </div>
              {validationIssues.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
            </div>

            {/* 2. Sketch */}
            <div
              data-testid="step-2-sketch"
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  2. Sketch
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  Sketch .ino generado
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {sketchLinesCount} líneas de código C/C++ listas
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          </div>

          {/* 3. Puerto */}
          <div
            data-testid="step-3-port"
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  3. Puerto USB de la placa
                </span>
                <p className="text-xs text-slate-600">
                  Detectá los puertos disponibles y elegí dónde está conectada
                  la NodeMCU.
                </p>
              </div>

              <button
                type="button"
                data-testid="detect-ports-btn"
                onClick={handleScanPorts}
                disabled={isScanningPorts}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-indigo-600 ${
                    isScanningPorts ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {isScanningPorts ? 'Buscando...' : 'Detectar puertos'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                data-testid="board-port-select"
                aria-label="Seleccionar puerto serie"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Seleccionar puerto --</option>
                {ports.map((p) => (
                  <option key={p.address} value={p.address}>
                    {p.label}
                  </option>
                ))}
              </select>

              {selectedPort && (
                <span
                  data-testid="selected-port-badge"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                >
                  <Plug className="w-3.5 h-3.5 text-emerald-600" />
                  Puerto seleccionado: {selectedPort}
                </span>
              )}
            </div>

            {portScanMessage && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {portScanMessage}
              </p>
            )}
          </div>

          {/* 4. Compilar */}
          <div
            data-testid="step-4-compile"
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  4. Compilar
                </span>
                <p className="text-xs text-slate-600">
                  Verificá que el código Arduino generado no tenga errores antes
                  de enviarlo a la placa.
                </p>
              </div>

              <button
                type="button"
                data-testid="board-compile-btn"
                onClick={handleCompile}
                disabled={
                  compileStatus === 'compiling' ||
                  uploadStatus === 'connecting' ||
                  uploadStatus === 'uploading'
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                {compileStatus === 'compiling' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compilando...</span>
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-4 h-4" />
                    <span>Compilar programa</span>
                  </>
                )}
              </button>
            </div>

            {/* Estado de compilación */}
            {compileStatus === 'compiling' && (
              <div
                data-testid="compile-status-compiling"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900"
              >
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Compilando... preparando el programa para NodeMCU.</span>
              </div>
            )}

            {compileStatus === 'success' && compileResult && (
              <div
                data-testid="compile-status-success"
                className="space-y-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Compilación correcta</span>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-compile-technical-details"
                    onClick={() => setShowCompileDetails((prev) => !prev)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalles técnicos</span>
                    {showCompileDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-emerald-800">
                  {compileResult.summaryMessage}
                </p>

                {showCompileDetails && (
                  <pre
                    data-testid="compile-technical-details"
                    className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                  >
                    {compileResult.technicalDetails}
                  </pre>
                )}
              </div>
            )}

            {compileStatus === 'error' && compileResult && (
              <div
                data-testid="compile-status-error"
                className="space-y-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>No se pudo compilar el programa</span>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-compile-technical-details"
                    onClick={() => setShowCompileDetails((prev) => !prev)}
                    className="text-[11px] font-semibold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalles técnicos</span>
                    {showCompileDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-rose-800">
                  {compileResult.summaryMessage}
                </p>

                {showCompileDetails && (
                  <pre
                    data-testid="compile-technical-details"
                    className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                  >
                    {compileResult.technicalDetails}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* 5. Cargar */}
          <div
            data-testid="step-5-upload"
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                  5. Cargar en la placa
                </span>
                <p className="text-xs text-slate-600">
                  {!selectedPort
                    ? 'Elegí primero un puerto serie en el Paso 3.'
                    : !isSketchCurrentlyCompiled
                    ? 'Compilá primero el programa actual en el Paso 4.'
                    : `Listo para transferir a la NodeMCU por ${selectedPort}.`}
                </p>
              </div>

              <button
                type="button"
                data-testid="board-upload-btn"
                onClick={handleUpload}
                disabled={
                  !selectedPort ||
                  !isSketchCurrentlyCompiled ||
                  uploadStatus === 'connecting' ||
                  uploadStatus === 'uploading'
                }
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                {uploadStatus === 'connecting' ||
                uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {uploadStatus === 'connecting'
                        ? 'Conectando...'
                        : `Cargando${
                            uploadPercentage !== null
                              ? ` (${uploadPercentage}%)`
                              : '...'
                          }`}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Cargar en la placa</span>
                  </>
                )}
              </button>
            </div>

            {/* Progreso de carga en vivo */}
            {(uploadStatus === 'connecting' ||
              uploadStatus === 'uploading') && (
              <div
                data-testid="upload-progress-box"
                className="space-y-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-950"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{uploadStatusText}</span>
                  {uploadPercentage !== null && (
                    <span>{uploadPercentage}%</span>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-200 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${uploadPercentage ?? 10}%` }}
                  />
                </div>
              </div>
            )}

            {/* Resultado de carga exitosa */}
            {uploadStatus === 'completed' && uploadResult && (
              <div
                data-testid="upload-status-completed"
                className="space-y-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Carga completada en {selectedPort}</span>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-upload-technical-details"
                    onClick={() => setShowUploadDetails((prev) => !prev)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalles técnicos</span>
                    {showUploadDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showUploadDetails && (
                  <pre
                    data-testid="upload-technical-details"
                    className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                  >
                    {uploadResult.technicalDetails}
                  </pre>
                )}
              </div>
            )}

            {/* Error de carga */}
            {uploadStatus === 'error' && uploadResult && (
              <div
                data-testid="upload-status-error"
                className="space-y-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Error al cargar en la placa</span>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-upload-technical-details"
                    onClick={() => setShowUploadDetails((prev) => !prev)}
                    className="text-[11px] font-semibold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver detalles técnicos</span>
                    {showUploadDetails ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-rose-800">
                  {uploadResult.summaryMessage}
                </p>

                {showUploadDetails && (
                  <pre
                    data-testid="upload-technical-details"
                    className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap"
                  >
                    {uploadResult.technicalDetails}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* 6. Ejecutar */}
          <div
            data-testid="step-6-execute"
            className={`p-3.5 rounded-xl border transition ${
              uploadStatus === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Play
                  className={`w-5 h-5 shrink-0 ${
                    uploadStatus === 'completed'
                      ? 'text-white fill-current'
                      : 'text-slate-400'
                  }`}
                />
                <div>
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      uploadStatus === 'completed'
                        ? 'text-emerald-100'
                        : 'text-indigo-700'
                    }`}
                  >
                    6. Ejecutar
                  </span>
                  <p
                    data-testid="board-execution-message"
                    className={`text-sm font-extrabold ${
                      uploadStatus === 'completed'
                        ? 'text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {uploadStatus === 'completed'
                      ? 'Programa cargado. La placa está ejecutando tu proyecto.'
                      : 'Pendiente de carga en la placa.'}
                  </p>
                </div>
              </div>

              {uploadStatus === 'completed' && !isMonitorConnected && (
                <button
                  type="button"
                  data-testid="open-monitor-after-upload-btn"
                  onClick={handleToggleSerialMonitor}
                  className="px-3 py-1.5 rounded-lg bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold cursor-pointer shrink-0 shadow-2xs"
                >
                  Abrir Monitor de la placa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: Monitor de la placa (Monitor Serie en vivo) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden min-h-[380px]">
          <div className="px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold tracking-wide text-white">
                Monitor de la placa
              </span>
              <span
                data-testid="serial-status-pill"
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMonitorConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isMonitorConnected
                  ? `Conectado (${selectedPort})`
                  : 'Desconectado'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                data-testid="serial-baud-select"
                aria-label="Velocidad en baudios"
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                disabled={isMonitorConnected}
                className="px-2 py-1 rounded bg-slate-700 text-slate-100 text-[11px] font-mono border border-slate-600"
              >
                <option value={115200}>115200 baud</option>
                <option value={9600}>9600 baud</option>
              </select>

              <button
                type="button"
                data-testid="serial-clear-btn"
                onClick={() => setSerialOutput('')}
                className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                title="Limpiar consola"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                data-testid="serial-connect-btn"
                onClick={handleToggleSerialMonitor}
                disabled={
                  !selectedPort ||
                  uploadStatus === 'connecting' ||
                  uploadStatus === 'uploading'
                }
                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                  isMonitorConnected
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-700 disabled:text-slate-400'
                }`}
              >
                {isMonitorConnected ? (
                  <>
                    <Unplug className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </>
                ) : (
                  <>
                    <Plug className="w-3.5 h-3.5" />
                    <span>Conectar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {serialError && (
            <div className="px-3 py-1.5 bg-rose-950/90 border-b border-rose-800 text-rose-200 text-[11px]">
              {serialError}
            </div>
          )}

          <pre
            ref={serialConsoleRef}
            data-testid="serial-monitor-output"
            className="flex-1 p-3.5 font-mono text-xs text-emerald-300 overflow-y-auto whitespace-pre-wrap leading-relaxed"
          >
            {serialOutput ||
              (isMonitorConnected
                ? 'Esperando datos desde la placa NodeMCU...\n'
                : 'Conectá el Monitor de la placa para observar en vivo las lecturas de los sensores y el estado del relay.\n')}
          </pre>
        </div>
      </div>
    </section>
  );
};
