import React, { useState } from 'react';
import { Check, Code2, Copy, FileCode2 } from 'lucide-react';
import { GeneratedArduinoOutput } from '../types/studio';

interface ArduinoCodePanelProps {
  generatedCode: GeneratedArduinoOutput;
  selectedBlockId?: string;
}

/**
 * Resaltador sintáctico ligero y seguro para código Arduino C/C++ educativo,
 * siguiendo la paleta cromática de la referencia visual V0.1.
 */
function renderHighlightedLine(line: string): React.ReactNode {
  if (line.trim().startsWith('//')) {
    return <span className="text-emerald-700/80 italic">{line}</span>;
  }

  // Tokenización simple por palabras, números, cadenas y símbolos
  const tokenRegex =
    /(".*?"|\b(?:void|int|float|bool|const|char|if|else|true|false)\b|\b(?:setup|loop|pinMode|Serial|begin|delay|leerTemperatura|leerHumedadAmbiente|leerHumedadSuelo|leerNivelLuz|bombaOn|bombaOff|luzOn|luzOff|configurarCamara|seleccionarResolucion|configurarCalidad|iniciarCamara|conectarWiFi|iniciarStreaming|detenerStreaming|tomarCaptura|estadoCamara|registrarDato|enviarDatoIoT)\b|\b(?:OUTPUT|INPUT|BOMBA_PIN|LUZ_PIN|DHT_PIN|SUELO_PIN|LDR_PIN|WIFI_SSID|WIFI_PASS)\b|\b\d+\b)/g;

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
    if (/^(void|int|float|bool|const|char|if|else|true|false)$/.test(part)) {
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
      /^(OUTPUT|INPUT|BOMBA_PIN|LUZ_PIN|DHT_PIN|SUELO_PIN|LDR_PIN|WIFI_SSID|WIFI_PASS)$/.test(
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
      /^(setup|loop|pinMode|Serial|begin|delay|leerTemperatura|leerHumedadAmbiente|leerHumedadSuelo|leerNivelLuz|bombaOn|bombaOff|luzOn|luzOff|configurarCamara|seleccionarResolucion|configurarCalidad|iniciarCamara|conectarWiFi|iniciarStreaming|detenerStreaming|tomarCaptura|estadoCamara|registrarDato|enviarDatoIoT)$/.test(
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
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullSketch, setShowFullSketch] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        showFullSketch ? generatedCode.fullCode : generatedCode.compactCode
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const fullLines = generatedCode.fullCode.split('\n');

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Cabecera de Código Arduino */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            CÓDIGO ARDUINO
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            se actualiza en vivo
          </span>
        </div>
      </div>

      {/* Área de código con numeración de líneas y botón de copiar */}
      <div className="relative flex-1 bg-[#f9fbfd] overflow-auto p-3 font-mono text-[13px] leading-6">
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={() => setShowFullSketch((prev) => !prev)}
            className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-sans font-medium flex items-center gap-1 shadow-2xs transition cursor-pointer"
            title="Alternar entre vista educativa resumida y sketch completo con declaraciones"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{showFullSketch ? 'Vista resumida' : 'Ver declaraciones'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer"
            title="Copiar código Arduino C/C++"
            aria-label="Copiar código"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <pre
          data-testid="arduino-code-display"
          className="text-slate-800 select-text pt-1"
        >
          {showFullSketch
            ? fullLines.map((lineText, idx) => (
                <div
                  key={idx}
                  className="flex items-baseline px-1.5 rounded hover:bg-slate-100/80"
                >
                  <span className="w-7 shrink-0 text-right pr-3 text-xs text-slate-400 select-none">
                    {idx + 1}
                  </span>
                  <code className="whitespace-pre">{renderHighlightedLine(lineText)}</code>
                </div>
              ))
            : generatedCode.lines.map((lineObj) => {
                const isHighlighted =
                  Boolean(selectedBlockId) && lineObj.blockId === selectedBlockId;
                return (
                  <div
                    key={lineObj.lineNumber}
                    className={`flex items-baseline px-1.5 rounded transition-colors ${
                      isHighlighted
                        ? 'bg-amber-100/90 ring-1 ring-amber-300'
                        : 'hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="w-7 shrink-0 text-right pr-3 text-xs text-slate-400 select-none">
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
    </section>
  );
};
