import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import {
  AlertTriangle,
  LayoutGrid,
  Maximize2,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  parseWorkspaceToProgram,
  registerBiTechBlocks,
} from '../blocks/bitechBlocks';
import { DeviceProfileId } from '../types/hardware';
import { ParsedProgram } from '../types/studio';

interface BlocklyWorkspacePanelProps {
  activeDevice: DeviceProfileId;
  workspaceXml: string;
  pendingInsertBlockType: { type: string; nonce: number } | null;
  onConsumePendingInsertBlock?: () => void;
  onWorkspaceChange: (program: ParsedProgram, serializedXml: string) => void;
  onSelectBlock: (blockType: string, blockId?: string) => void;
  onResetDefaultProgram: () => void;
}

export const BlocklyWorkspacePanel: React.FC<BlocklyWorkspacePanelProps> = ({
  activeDevice,
  workspaceXml,
  pendingInsertBlockType,
  onConsumePendingInsertBlock,
  onWorkspaceChange,
  onSelectBlock,
  onResetDefaultProgram,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const activeDeviceRef = useRef<DeviceProfileId>(activeDevice);
  const isLoadingXmlRef = useRef<boolean>(false);
  const [confirmingLoadExample, setConfirmingLoadExample] =
    useState<boolean>(false);

  activeDeviceRef.current = activeDevice;

  // Inicializar Blockly
  useEffect(() => {
    registerBiTechBlocks();
    if (!containerRef.current) return;

    const ws = Blockly.inject(containerRef.current, {
      trashcan: false,
      sounds: false,
      zoom: {
        controls: false,
        wheel: true,
        startScale: 0.92,
        maxScale: 1.5,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      grid: {
        spacing: 22,
        length: 2,
        colour: '#cbd5e1',
        snap: true,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: false,
      },
      renderer: 'zelos',
    });

    workspaceRef.current = ws;

    const emitCurrentProgram = () => {
      if (isLoadingXmlRef.current) return;
      const parsed = parseWorkspaceToProgram(ws, activeDeviceRef.current);
      const xmlDom = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToText(xmlDom);
      onWorkspaceChange(parsed, xmlText);
    };

    const listener = (event: Blockly.Events.Abstract) => {
      if (event.type === Blockly.Events.SELECTED) {
        const selEvent = event as Blockly.Events.Selected;
        if (selEvent.newElementId) {
          const blk = ws.getBlockById(selEvent.newElementId);
          if (blk) {
            onSelectBlock(blk.type, blk.id);
          }
        }
      }

      if (
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.FINISHED_LOADING
      ) {
        emitCurrentProgram();
      }
    };

    ws.addChangeListener(listener);

    // Cargar XML inicial
    try {
      isLoadingXmlRef.current = true;
      const dom = Blockly.utils.xml.textToDom(workspaceXml);
      Blockly.Xml.clearWorkspaceAndLoadFromXml(dom, ws);
    } catch (err) {
      console.error('Error al cargar XML en Blockly:', err);
    } finally {
      isLoadingXmlRef.current = false;
      emitCurrentProgram();
    }

    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.dispose();
      workspaceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar cuando cambia el dispositivo o se restaura el XML
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const currentDom = Blockly.Xml.workspaceToDom(ws);
    const currentText = Blockly.Xml.domToText(currentDom);
    if (currentText === workspaceXml) return;

    try {
      isLoadingXmlRef.current = true;
      const dom = Blockly.utils.xml.textToDom(workspaceXml);
      Blockly.Xml.clearWorkspaceAndLoadFromXml(dom, ws);
      ws.scrollCenter();
    } catch (err) {
      console.error('Error al actualizar XML del dispositivo:', err);
    } finally {
      isLoadingXmlRef.current = false;
      const parsed = parseWorkspaceToProgram(ws, activeDevice);
      onWorkspaceChange(parsed, workspaceXml);
    }
  }, [activeDevice, workspaceXml, onWorkspaceChange]);

  // Insertar bloque cuando el usuario hace clic en la paleta izquierda
  useEffect(() => {
    if (!pendingInsertBlockType || !workspaceRef.current) return;
    const ws = workspaceRef.current;
    const { type } = pendingInsertBlockType;

    try {
      const newBlock = ws.newBlock(type);
      newBlock.initSvg();
      newBlock.render();

      // Buscar si existe un bloque repetir siempre (bitech_forever) o al iniciar (bitech_on_start)
      const allBlocks = ws
        .getAllBlocks(true)
        .filter((b) => b.id !== newBlock.id);
      const foreverBlock = allBlocks.find((b) => b.type === 'bitech_forever');
      const onStartBlock = allBlocks.find((b) => b.type === 'bitech_on_start');

      if (newBlock.type === 'bitech_on_start') {
        newBlock.moveBy(38, 24);
      } else if (
        newBlock.type === 'bitech_forever' &&
        onStartBlock &&
        onStartBlock.nextConnection &&
        !onStartBlock.getNextBlock() &&
        newBlock.previousConnection
      ) {
        onStartBlock.nextConnection.connect(newBlock.previousConnection);
      } else if (newBlock.previousConnection && foreverBlock) {
        const loopInput = foreverBlock.getInput('LOOP_DO');
        if (loopInput && loopInput.connection) {
          const targetBlock = foreverBlock.getInputTargetBlock('LOOP_DO');
          if (!targetBlock) {
            loopInput.connection.connect(newBlock.previousConnection);
          } else {
            let lastBlock = targetBlock;
            while (lastBlock.getNextBlock()) {
              lastBlock = lastBlock.getNextBlock()!;
            }
            if (lastBlock.nextConnection) {
              lastBlock.nextConnection.connect(newBlock.previousConnection);
            }
          }
        }
      } else if (newBlock.previousConnection && allBlocks.length > 0) {
        // En un proyecto nuevo sin bitech_forever, encadenar al último bloque de sentencia disponible
        const tailCandidate = [...allBlocks]
          .reverse()
          .find((b) => b.nextConnection && !b.getNextBlock());
        if (tailCandidate && tailCandidate.nextConnection) {
          tailCandidate.nextConnection.connect(newBlock.previousConnection);
        } else {
          newBlock.moveBy(
            60 + Math.floor(Math.random() * 40),
            60 + Math.floor(Math.random() * 40)
          );
        }
      } else {
        newBlock.moveBy(
          48 + Math.floor(Math.random() * 30),
          36 + Math.floor(Math.random() * 30)
        );
      }

      newBlock.select();
      onSelectBlock(newBlock.type, newBlock.id);

      const parsed = parseWorkspaceToProgram(ws, activeDeviceRef.current);
      const xmlDom = Blockly.Xml.workspaceToDom(ws);
      onWorkspaceChange(parsed, Blockly.Xml.domToText(xmlDom));
      onConsumePendingInsertBlock?.();
    } catch (err) {
      console.error('No se pudo insertar el bloque:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInsertBlockType]);

  const handleZoom = (delta: number) => {
    if (!workspaceRef.current) return;
    workspaceRef.current.zoomCenter(delta);
  };

  const handleCenter = () => {
    if (!workspaceRef.current) return;
    workspaceRef.current.scrollCenter();
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Cabecera del Área de Programación */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-slate-600" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            ÁREA DE PROGRAMACIÓN
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {confirmingLoadExample ? (
            <div
              data-testid="confirm-load-example-bar"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-950"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="font-semibold">
                ¿Reemplazar bloques por el ejemplo?
              </span>
              <button
                type="button"
                data-testid="confirm-load-example-btn"
                onClick={() => {
                  setConfirmingLoadExample(false);
                  onResetDefaultProgram();
                }}
                className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer"
              >
                Sí, cargar ejemplo
              </button>
              <button
                type="button"
                data-testid="cancel-load-example-btn"
                onClick={() => setConfirmingLoadExample(false)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="reset-program-button"
              onClick={() => {
                const ws = workspaceRef.current;
                const hasBlocks = ws && ws.getAllBlocks(false).length > 0;
                if (hasBlocks) {
                  setConfirmingLoadExample(true);
                } else {
                  onResetDefaultProgram();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              title="Cargar el programa de ejemplo del dispositivo actual (Ejemplo base)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cargar ejemplo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!workspaceRef.current) return;
              workspaceRef.current.clear();
            }}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition cursor-pointer"
            title="Limpiar área de programación"
            aria-label="Limpiar bloques"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contenedor del lienzo Blockly + Botones flotantes de Zoom */}
      <div className="relative flex-1 min-h-[340px] w-full bg-[#f8fafc]">
        <div
          ref={containerRef}
          data-testid="blockly-workspace-container"
          className="absolute inset-0 w-full h-full"
        />

        {/* Controles flotantes de zoom estilo referencia visual */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Acercar bloques"
            aria-label="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Alejar bloques"
            aria-label="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCenter}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Centrar programa"
            aria-label="Centrar"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
