import React, { useCallback, useMemo, useRef, useState } from 'react';
import { buildBiTechAssistantContext } from './assistant/bitechAssistantContext';
import { ArduinoCodePanel } from './components/ArduinoCodePanel';
import { BiTechAssistantPanel } from './components/BiTechAssistantPanel';
import { BlockCategoriesPanel } from './components/BlockCategoriesPanel';
import { BlocklyWorkspacePanel } from './components/BlocklyWorkspacePanel';
import { ContextualManualPanel } from './components/ContextualManualPanel';
import { HardwareConfigModal } from './components/HardwareConfigModal';
import { HeaderBar } from './components/HeaderBar';
import {
  MyProjectsModal,
  NewProjectModal,
} from './components/ProjectManagerModals';
import { RealBoardPanel } from './components/RealBoardPanel';
import { SimulatorControlsPanel } from './components/SimulatorControlsPanel';
import { VirtualSystemPanel } from './components/VirtualSystemPanel';
import { generateArduinoCode } from './generators/arduinoGenerator';
import {
  CameraStreamConnectionInput,
  resolveCameraStreamUrl,
} from './hardware/cameraSerialParser';
import { getDeviceCapabilities } from './hardware/hardwareCapabilities';
import { getManualEntryForDevice } from './manual/contextualManualData';
import {
  createStudioProject,
  deleteStudioProjectFromList,
  getDefaultXmlForDevice,
  INITIAL_GARDEN_SENSORS,
  INITIAL_NODEMCU_SENSORS,
  loadActiveProjectId,
  loadStudioProjects,
  saveActiveDevice,
  saveActiveProjectId,
  saveProjectName,
  saveWorkspaceXml,
  updateStudioProjectInList,
} from './services/localPersistence';
import {
  evaluateCameraProgram,
  evaluateGardenProgram,
  evaluateNodeMcuProgram,
} from './simulator/programEvaluator';
import { DeviceProfileId, WorkMode } from './types/hardware';
import {
  BlockCategoryId,
  GardenSensorState,
  NodeMcuSensorState,
  ParsedProgram,
  StudioProject,
} from './types/studio';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<StudioProject[]>(() =>
    loadStudioProjects()
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const initialList = loadStudioProjects();
    return loadActiveProjectId(initialList);
  });

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  const activeProjectIdRef = useRef<string>(activeProject.id);
  activeProjectIdRef.current = activeProject.id;

  const projectName = activeProject.name;
  const activeDevice = activeProject.device;
  const workspaceXml = activeProject.workspaceXml;

  const [workMode, setWorkMode] = useState<WorkMode>('program');
  const [selectedCategory, setSelectedCategory] =
    useState<BlockCategoryId>('inicio');
  const [pendingInsertBlock, setPendingInsertBlock] = useState<{
    type: string;
    nonce: number;
  } | null>(null);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] =
    useState<boolean>(false);
  const [isMyProjectsModalOpen, setIsMyProjectsModalOpen] =
    useState<boolean>(false);

  // Programa lógico extraído del lienzo Blockly
  const [parsedProgram, setParsedProgram] = useState<ParsedProgram>(() => ({
    device: activeProject.device,
    setupStatements: [],
    loopStatements: [],
  }));

  // Estado de sensores virtuales para Garden Node (ESP32)
  const [sensors, setSensors] = useState<GardenSensorState>(
    INITIAL_GARDEN_SENSORS
  );

  // Estado de sensores virtuales para NodeMCU (ESP8266)
  const [nodeMcuSensors, setNodeMcuSensors] = useState<NodeMcuSensorState>(
    INITIAL_NODEMCU_SENSORS
  );

  // Estado adicional de ciclos manuales para Camera Node
  const [extraCameraCaptures, setExtraCameraCaptures] = useState<number>(3);
  const [manualCaptureTimestamp, setManualCaptureTimestamp] = useState<
    string | null
  >('14:32:15');

  // Bloque seleccionado para el Manual Contextual y resaltado de código
  const [selectedBlockType, setSelectedBlockType] = useState<string>(
    'bitech_if_sensor_compare'
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
    'block_if_soil'
  );
  const [isHardwareModalOpen, setIsHardwareModalOpen] =
    useState<boolean>(false);
  const [cameraStreamConfig, setCameraStreamConfig] =
    useState<CameraStreamConnectionInput>({
      host: '',
      port: '',
      endpointPath: '',
      fullUrl: '',
    });

  const resolvedCameraStreamUrl = useMemo(
    () => resolveCameraStreamUrl(cameraStreamConfig),
    [cameraStreamConfig]
  );

  const syncDefaultCategoryForDevice = (device: DeviceProfileId) => {
    const caps = getDeviceCapabilities(device);
    if (caps.camera) {
      setSelectedCategory('camara');
      setSelectedBlockType('bitech_cam_config');
    } else if (caps.analogInputs === 1) {
      setSelectedCategory('sensores');
      setSelectedBlockType('bitech_sensor_analog_a0');
    } else {
      setSelectedCategory('inicio');
      setSelectedBlockType('bitech_if_sensor_compare');
    }
  };

  const handleProjectNameChange = (name: string) => {
    saveProjectName(name);
    setProjects((prev) =>
      updateStudioProjectInList(prev, activeProjectIdRef.current, { name })
    );
  };

  const handleSelectDevice = (device: DeviceProfileId) => {
    saveActiveDevice(device);
    setProjects((prev) => {
      const current = prev.find((p) => p.id === activeProjectIdRef.current);
      const isDefaultPrev =
        current &&
        current.workspaceXml.trim() ===
          getDefaultXmlForDevice(current.device).trim();
      const nextXml = isDefaultPrev
        ? getDefaultXmlForDevice(device)
        : current?.workspaceXml ?? getDefaultXmlForDevice(device);

      return updateStudioProjectInList(prev, activeProjectIdRef.current, {
        device,
        workspaceXml: nextXml,
      });
    });
    syncDefaultCategoryForDevice(device);
  };

  const handleCreateProject = (name: string, device: DeviceProfileId) => {
    const { projects: nextProjects, created } = createStudioProject(
      name,
      device,
      projects
    );
    activeProjectIdRef.current = created.id;
    setProjects(nextProjects);
    setActiveProjectId(created.id);
    setPendingInsertBlock(null);
    setParsedProgram({
      device: created.device,
      setupStatements: [],
      loopStatements: [],
    });
    syncDefaultCategoryForDevice(created.device);
    setWorkMode('program');
    setIsNewProjectModalOpen(false);
    setIsMyProjectsModalOpen(false);
  };

  const handleSelectExistingProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    activeProjectIdRef.current = target.id;
    saveActiveProjectId(target.id);
    setActiveProjectId(target.id);
    setPendingInsertBlock(null);
    syncDefaultCategoryForDevice(target.device);
    setWorkMode('program');
    setIsMyProjectsModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    const { projects: remaining, nextActiveId } = deleteStudioProjectFromList(
      projects,
      projectId,
      activeProject.id
    );
    activeProjectIdRef.current = nextActiveId;
    setProjects(remaining);
    setActiveProjectId(nextActiveId);
  };

  const handleWorkspaceChange = useCallback(
    (program: ParsedProgram, serializedXml: string) => {
      setParsedProgram(program);
      saveWorkspaceXml(program.device, serializedXml);
      setProjects((prev) =>
        updateStudioProjectInList(prev, activeProjectIdRef.current, {
          workspaceXml: serializedXml,
        })
      );
    },
    []
  );

  const handleSelectBlock = useCallback(
    (blockType: string, blockId?: string) => {
      setSelectedBlockType(blockType);
      setSelectedBlockId(blockId);
    },
    []
  );

  const handleInsertBlock = (blockType: string) => {
    setSelectedBlockType(blockType);
    setPendingInsertBlock({ type: blockType, nonce: Date.now() });
  };

  const handleResetDefaultProgram = () => {
    const exampleXml = getDefaultXmlForDevice(activeDevice);
    saveWorkspaceXml(activeDevice, exampleXml);
    setProjects((prev) =>
      updateStudioProjectInList(prev, activeProjectIdRef.current, {
        workspaceXml: exampleXml,
      })
    );
  };

  const handleInsertSecondAnalogSensorDemo = () => {
    setSelectedBlockType('bitech_sensor_soil');
    setPendingInsertBlock({
      type: 'bitech_if_sensor_compare',
      nonce: Date.now(),
    });
  };

  const handleTriggerManualCapture = () => {
    const now = new Date();
    const formatted = now.toTimeString().slice(0, 8);
    setExtraCameraCaptures((prev) => prev + 1);
    setManualCaptureTimestamp(formatted);
  };

  const handleResetCameraSimulation = () => {
    setExtraCameraCaptures(0);
    setManualCaptureTimestamp('14:32:15');
  };

  // Generación en vivo del código Arduino C/C++ + validación de capacidades
  const generatedCode = useMemo(
    () => generateArduinoCode(parsedProgram),
    [parsedProgram]
  );

  // Evaluación reactiva del simulador para Garden Node (ESP32)
  const gardenActuators = useMemo(
    () => evaluateGardenProgram(parsedProgram, sensors),
    [parsedProgram, sensors]
  );

  // Evaluación reactiva del simulador para NodeMCU (ESP8266)
  const nodeMcuActuators = useMemo(
    () => evaluateNodeMcuProgram(parsedProgram, nodeMcuSensors),
    [parsedProgram, nodeMcuSensors]
  );

  // Evaluación reactiva del simulador para Camera Node (ESP32-CAM)
  const cameraSimulation = useMemo(
    () =>
      evaluateCameraProgram(
        parsedProgram,
        extraCameraCaptures,
        manualCaptureTimestamp
      ),
    [parsedProgram, extraCameraCaptures, manualCaptureTimestamp]
  );

  // Entrada activa del Manual Contextual adaptada al hardware seleccionado
  const manualEntry = useMemo(
    () => getManualEntryForDevice(selectedBlockType, activeDevice),
    [selectedBlockType, activeDevice]
  );

  // Contexto estructurado reutilizable para futura integración con IA en Asistente Bi-Tech
  const assistantContext = useMemo(
    () =>
      buildBiTechAssistantContext({
        activeDevice,
        projectName,
        selectedBlockType,
        selectedBlockId,
        parsedProgram,
        generatedCode,
      }),
    [
      activeDevice,
      projectName,
      selectedBlockType,
      selectedBlockId,
      parsedProgram,
      generatedCode,
    ]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#eaf3ec] text-slate-800 pb-4">
      {/* Cabecera e identidad visual */}
      <HeaderBar
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        activeDevice={activeDevice}
        onSelectDevice={handleSelectDevice}
        workMode={workMode}
        onSelectWorkMode={setWorkMode}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenMyProjectsModal={() => setIsMyProjectsModalOpen(true)}
        projectsCount={projects.length}
        hasValidationIssues={generatedCode.validationIssues.length > 0}
      />

      {/* Contenedor principal separado por modo de trabajo */}
      <main className="max-w-[1600px] w-full mx-auto px-3 mt-2.5 flex-1 flex flex-col gap-2.5">
        {/* ===================================================================
            1. MODO PROGRAMAR: Bloques | Área de programación | Código Arduino
               + Ayuda contextual compacta + Asistente Bi-Tech (sin simulador)
           =================================================================== */}
        {workMode === 'program' && (
          <>
            <div
              data-testid="program-mode-view"
              className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[480px] lg:h-[510px]"
            >
              <div className="lg:col-span-2 h-full overflow-hidden">
                <BlockCategoriesPanel
                  activeDevice={activeDevice}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onInsertBlock={handleInsertBlock}
                />
              </div>

              <div className="lg:col-span-6 h-full overflow-hidden">
                <BlocklyWorkspacePanel
                  key={activeProject.id}
                  activeDevice={activeDevice}
                  workspaceXml={workspaceXml}
                  pendingInsertBlockType={pendingInsertBlock}
                  onConsumePendingInsertBlock={() => setPendingInsertBlock(null)}
                  onWorkspaceChange={handleWorkspaceChange}
                  onSelectBlock={handleSelectBlock}
                  onResetDefaultProgram={handleResetDefaultProgram}
                />
              </div>

              <div className="lg:col-span-4 h-full overflow-hidden">
                <ArduinoCodePanel
                  generatedCode={generatedCode}
                  selectedBlockId={selectedBlockId}
                />
              </div>
            </div>

            {/* Ayuda contextual compacta del bloque seleccionado */}
            <ContextualManualPanel entry={manualEntry} />

            {/* Panel de conversación Asistente Bi-Tech */}
            <BiTechAssistantPanel context={assistantContext} />
          </>
        )}

        {/* ===================================================================
            2. MODO SIMULAR: Controles de Sensores | Smart Garden Virtual
               ocupando el espacio principal + referencia del programa activo
           =================================================================== */}
        {workMode === 'simulate' && (
          <div data-testid="simulate-mode-view" className="space-y-2.5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
              <div className="lg:col-span-6">
                <SimulatorControlsPanel
                  activeDevice={activeDevice}
                  sensors={sensors}
                  onChangeSensors={setSensors}
                  nodeMcuSensors={nodeMcuSensors}
                  onChangeNodeMcuSensors={setNodeMcuSensors}
                  onInsertSecondAnalogSensorDemo={() => {
                    handleInsertSecondAnalogSensorDemo();
                    setWorkMode('program');
                  }}
                  cameraState={cameraSimulation}
                  onTriggerManualCapture={handleTriggerManualCapture}
                  onResetCameraSimulation={handleResetCameraSimulation}
                />
              </div>

              <div className="lg:col-span-6">
                <VirtualSystemPanel
                  activeDevice={activeDevice}
                  sensors={sensors}
                  actuators={gardenActuators}
                  nodeMcuSensors={nodeMcuSensors}
                  nodeMcuActuators={nodeMcuActuators}
                  cameraState={cameraSimulation}
                  configuredStreamUrl={resolvedCameraStreamUrl}
                  onChangeConfiguredStreamUrl={(fullUrl) =>
                    setCameraStreamConfig((prev) => ({ ...prev, fullUrl }))
                  }
                />
              </div>
            </div>

            {/* Referencia compacta del programa en ejecución durante la simulación */}
            <section
              data-testid="simulate-program-reference"
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Programa activo en simulación
                </span>
                <p className="text-xs text-slate-600">
                  El simulador está evaluando en tiempo real tu programa actual
                  ({parsedProgram.setupStatements.length +
                    parsedProgram.loopStatements.length}{' '}
                  instrucción(es) principales).
                </p>
              </div>

              <button
                type="button"
                data-testid="simulate-back-to-program-btn"
                onClick={() => setWorkMode('program')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-xs font-bold transition cursor-pointer"
              >
                Volver a Programar bloques
              </button>
            </section>
          </div>
        )}

        {/* ===================================================================
            3. MODO PLACA REAL: Conexión / Compilación / Carga / Monitor
               + Sketch Arduino compilable (.ino) sin simulador
           =================================================================== */}
        {workMode === 'board' && (
          <div data-testid="board-mode-view" className="space-y-2.5">
            <RealBoardPanel
              activeDevice={activeDevice}
              onSelectDevice={handleSelectDevice}
              sketchCode={generatedCode.compilableSketch}
              validationIssues={generatedCode.validationIssues}
              statementCount={
                parsedProgram.setupStatements.length +
                parsedProgram.loopStatements.length
              }
              cameraStreamConfig={cameraStreamConfig}
              onChangeCameraStreamConfig={setCameraStreamConfig}
            />

            <div className="h-[420px]">
              <ArduinoCodePanel
                generatedCode={generatedCode}
                selectedBlockId={selectedBlockId}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modal para crear un Nuevo proyecto con Blockly vacío */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Modal Mis proyectos para abrir/cambiar entre proyectos locales */}
      <MyProjectsModal
        isOpen={isMyProjectsModalOpen}
        projects={projects}
        activeProjectId={activeProject.id}
        onClose={() => setIsMyProjectsModalOpen(false)}
        onSelectProject={handleSelectExistingProject}
        onOpenNewProject={() => {
          setIsMyProjectsModalOpen(false);
          setIsNewProjectModalOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
      />

      {/* Modal de configuración centralizada y supuestos de hardware */}
      <HardwareConfigModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </div>
  );
};

export default App;
