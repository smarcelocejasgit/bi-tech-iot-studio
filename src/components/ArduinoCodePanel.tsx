import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode2,
} from 'lucide-react';
import { DidacticInterpreterView } from './DidacticInterpreterView';
import { interpretProgram } from '../interpreter/programInterpreter';
import { WorkMode } from '../types/hardware';
import { GeneratedArduinoOutput, ParsedProgram } from '../types/studio';
import {
  containsWifiCredentials,
  redactWifiCredentials,
} from '../security/wifiCredentials';

interface ArduinoCodePanelProps {
  generatedCode: GeneratedArduinoOutput;
  selectedBlockId?: string;
  parsedProgram?: ParsedProgram;
  workMode?: WorkMode;
}

type ProgramTab = 'interpret' | 'arduino';
type CodeViewMode = 'educational' | 'compilable';

/**
 * Resaltador sintáctico ligero y seguro para código Arduino C/C++ (Vista educativa y Sketch .ino).
 */
function renderHighlightedLine(line: string): React.ReactNode {
  if (line.trim().startsWith('// ⚠️')) {
    return (
      <span className="text-amber-800 font-bold bg-amber-100/90 px-1 rounded">
        {line}
      </span>
    );
  }
  if (line.trim().startsWith('//')) {
    return <span className="text-emerald-700/80 italic">{line}</span>;
  }
  if (line.trim().startsWith('#include') || line.trim().startsWith('#define')) {
    return <span className="text-teal-800 font-semibold">{line}</span>;
  }

  const tokenRegex =
    /(".*?"|\b(?:void|int|float|bool|const|char|if|else|return|true|false)\b|\b(?:setup|loop|pinMode|digitalWrite|digitalRead|analogRead|Serial|begin|print|println|delay|WiFi|mode|leerTemperatura|leerHumedadAmbiente|leerHumedadSuelo|leerNivelLuz|leerEntradaAnalogicaA0|leerEntradaDigital|bombaOn|bombaOff|luzOn|luzOff|relayOn|relayOff|activarSalidaDigital|desactivarSalidaDigital|configurarCamara|seleccionarResolucion|configurarCalidad|iniciarCamara|conectarWiFi|conectarSmartGardenLab|iniciarStreaming|detenerStreaming|tomarCaptura|estadoCamara|registrarDato|enviarDatoIoT)\b|\b(?:OUTPUT|INPUT|HIGH|LOW|A0|WIFI_STA|BOMBA_PIN|LUZ_PIN|DHT_PIN|SUELO_PIN|LDR_PIN|RELAY_PIN|ANALOG_A0_PIN|ENTRADA_DIG_PIN|SALIDA_DIG_PIN|WIFI_SSID|WIFI_PASSWORD|BITECH_CHANNEL)\b|\b\d+\b)/g;

  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('"')) {
      return (
        <span key={idx} className="text-amber-700 font-medium">
          {part}
        </span>
      );
    }
    if (
      /^(void|int|float|bool|const|char|if|else|return|true|false)$/.test(part)
    ) {
      return (
        <span key={idx} className="text-purple-700 font-semibold">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={idx} className="text-orange-600 font-semibold">
          {part}
        </span>
      );
    }
    if (
      /^(OUTPUT|INPUT|HIGH|LOW|A0|WIFI_STA|BOMBA_PIN|LUZ_PIN|DHT_PIN|SUELO_PIN|LDR_PIN|RELAY_PIN|ANALOG_A0_PIN|ENTRADA_DIG_PIN|SALIDA_DIG_PIN|WIFI_SSID|WIFI_PASSWORD)$/.test(
        part
      )
    ) {
      return (
        <span key={idx} className="text-sky-700 font-semibold">
          {part}
        </span>
      );
    }
    if (
      /^(setup|loop|pinMode|digitalWrite|digitalRead|analogRead|Serial|begin|print|println|delay|WiFi|mode|leerTemperatura|leerHumedadAmbiente|leerHumedadSuelo|leerNivelLuz|leerEntradaAnalogicaA0|leerEntradaDigital|bombaOn|bombaOff|luzOn|luzOff|relayOn|relayOff|activarSalidaDigital|desactivarSalidaDigital|configurarCamara|seleccionarResolucion|configurarCalidad|iniciarCamara|conectarWiFi|conectarSmartGardenLab|iniciarStreaming|detenerStreaming|tomarCaptura|estadoCamara|registrarDato|enviarDatoIoT)$/.test(
        part
      )
    ) {
      return (
        <span key={idx} className="text-blue-700 font-medium">
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export const ArduinoCodePanel: React.FC<ArduinoCodePanelProps> = ({
  generatedCode,
  selectedBlockId,
  parsedProgram,
  workMode = 'program',
}) => {
  const [copied, setCopied] = useState(false);
  const [showWifiCredentials, setShowWifiCredentials] = useState(false);
  const [primaryTab, setPrimaryTab] = useState<ProgramTab>('interpret');
  const [viewMode, setViewMode] = useState<CodeViewMode>(
    workMode === 'board' ? 'compilable' : 'educational'
  );

  const interpretation = useMemo(() => {
    if (parsedProgram) {
      return interpretProgram(parsedProgram);
    }
    return interpretProgram({
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [],
    });
  }, [parsedProgram]);

  const hasWifiCredentials = containsWifiCredentials(
    generatedCode.compilableSketch
  );
  const visibleCompilableSketch = showWifiCredentials
    ? generatedCode.compilableSketch
    : redactWifiCredentials(generatedCode.compilableSketch);
  const activeText =
    viewMode === 'compilable'
      ? visibleCompilableSketch
      : generatedCode.compactCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const handleDownloadIno = () => {
    const blob = new Blob([generatedCode.compilableSketch], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bitech_hardware_sketch.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const compilableLines = visibleCompilableSketch.split('\n');
  const hasIssues = generatedCode.validationIssues.length > 0;

  // En Modo Placa Real, el código Arduino puro es el único protagonista
  const isRealBoardMode = workMode === 'board';

  return (
    <section
      data-testid="program-output-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden"
    >
      {/* ===================================================================
          1. ENCABEZADO PRINCIPAL
          - En modo Programar: Pestañas "Interpretar programa" (principal) vs "Ver código Arduino" (secundaria)
          - En modo Placa real: "CÓDIGO ARDUINO" como protagonista
          - Descargar .ino SIEMPRE disponible
         =================================================================== */}
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap bg-white">
        {isRealBoardMode ? (
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              CÓDIGO ARDUINO
            </h2>
          </div>
        ) : (
          <div
            className="inline-flex rounded-lg bg-slate-100 p-0.5 gap-0.5"
            role="tablist"
            aria-label="Modo del panel"
          >
            <button
              type="button"
              role="tab"
              aria-selected={primaryTab === 'interpret'}
              data-testid="tab-interpret-program"
              onClick={() => setPrimaryTab('interpret')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                primaryTab === 'interpret'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Interpretar programa</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={primaryTab === 'arduino'}
              data-testid="tab-view-arduino-code"
              onClick={() => setPrimaryTab('arduino')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                primaryTab === 'arduino'
                  ? 'bg-white text-indigo-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-700" />
              <span>Ver código Arduino</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Botón Descargar .ino disponible de forma permanente */}
          <button
            type="button"
            data-testid="download-ino-btn"
            onClick={handleDownloadIno}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
            title="Descargar sketch compilable (.ino) listo para Arduino CLI / IDE"
          >
            <Download className="w-3 h-3" />
            <span>Descargar .ino</span>
          </button>

          {hasIssues ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900">
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              restricción
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              en vivo
            </span>
          )}
        </div>
      </div>

      {/* ===================================================================
          2. VISTA 1: INTÉRPRETE DIDÁCTICO DEL PROGRAMA
          (Activo por defecto en modo Programar)
         =================================================================== */}
      {!isRealBoardMode && primaryTab === 'interpret' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {hasIssues && (
            <div
              data-testid="hardware-validation-warning"
              className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {generatedCode.validationIssues[0].message}
                </p>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                  {generatedCode.validationIssues[0].pedagogicalExplanation}
                </p>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <DidacticInterpreterView
              interpretation={interpretation}
              selectedBlockId={selectedBlockId}
            />
          </div>
        </div>
      )}

      {/* ===================================================================
          3. VISTA 2: CÓDIGO ARDUINO
          (Secundaria en modo Programar, Protagonista en modo Placa Real)
         =================================================================== */}
      {(isRealBoardMode || primaryTab === 'arduino') && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Selector de subvista: Vista educativa vs Sketch compilable */}
          <div className="px-3 py-1.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
            <div
              className="inline-flex rounded-lg bg-slate-200/80 p-0.5 gap-0.5"
              role="tablist"
              aria-label="Tipo de salida de código Arduino"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'educational'}
                data-testid="tab-educational-view"
                onClick={() => setViewMode('educational')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'educational'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Vista educativa</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'compilable'}
                data-testid="tab-compilable-sketch"
                onClick={() => setViewMode('compilable')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'compilable'
                    ? 'bg-white text-indigo-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode2 className="w-3 h-3" />
                <span>Sketch compilable (.ino)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {viewMode === 'compilable' && hasWifiCredentials && (
                <button
                  type="button"
                  data-testid="toggle-wifi-credentials"
                  aria-pressed={showWifiCredentials}
                  onClick={() => setShowWifiCredentials((visible) => !visible)}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  title={
                    showWifiCredentials
                      ? 'Ocultar credenciales Wi-Fi'
                      : 'Mostrar credenciales Wi-Fi'
                  }
                >
                  {showWifiCredentials ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>{showWifiCredentials ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Copiar código visible"
                aria-label="Copiar código"
              >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
              </button>
            </div>
          </div>

          {/* Advertencia pedagógica visible cuando el programa excede capacidades del dispositivo */}
          {hasIssues && (
            <div
              data-testid="hardware-validation-warning"
              className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {generatedCode.validationIssues[0].message}
                </p>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                  {generatedCode.validationIssues[0].pedagogicalExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Área de código con numeración de líneas y resaltado */}
          <div className="relative flex-1 bg-[#f9fbfd] overflow-auto p-3 font-mono text-[13px] leading-6">
            <pre
              data-testid="arduino-code-display"
              className="text-slate-800 select-text"
            >
              {viewMode === 'compilable'
                ? compilableLines.map((lineText, idx) => (
                    <div
                      key={idx}
                      className="flex items-baseline px-1.5 rounded hover:bg-slate-100/80"
                    >
                      <span className="w-8 shrink-0 text-right pr-3 text-xs text-slate-400 select-none">
                        {idx + 1}
                      </span>
                      <code className="whitespace-pre">
                        {renderHighlightedLine(lineText)}
                      </code>
                    </div>
                  ))
                : generatedCode.lines.map((lineObj) => {
                    const isHighlighted =
                      Boolean(selectedBlockId) &&
                      lineObj.blockId === selectedBlockId;
                    return (
                      <div
                        key={lineObj.lineNumber}
                        className={`flex items-baseline px-1.5 rounded transition-colors ${
                          isHighlighted
                            ? 'bg-amber-100/90 ring-1 ring-amber-300'
                            : 'hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="w-8 shrink-0 text-right pr-3 text-xs text-slate-400 select-none">
                          {lineObj.lineNumber}
                        </span>
                        <code className="whitespace-pre">
                          {renderHighlightedLine(lineObj.code)}
                        </code>
                      </div>
                    );
                  })}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
