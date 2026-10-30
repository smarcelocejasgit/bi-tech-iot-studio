import { describe, expect, it } from 'vitest';
import {
  BITECH_ASSISTANT_SUGGESTIONS,
  buildBiTechAssistantContext,
} from '../assistant/bitechAssistantContext';
import {
  EMPTY_WORKSPACE_XML,
  getCatalogForDevice,
} from '../blocks/bitechBlocks';
import { generateArduinoCode } from '../generators/arduinoGenerator';
import { getAlgorithmsForProfile } from '../guide/algorithmsCatalog';
import { getComponentsForProfile } from '../guide/componentsCatalog';
import { getConnectionDiagramsForProfile } from '../guide/connectionDiagrams';
import { PROJECT_GUIDE_PROFILES } from '../guide/projectGuideData';
import {
  algorithmToGuideResource,
  componentToGuideResource,
  diagramToGuideResource,
  projectToGuideResource,
} from '../guide/guideResources';
import {
  createStudioProject,
  loadActiveProjectId,
  loadStudioProjects,
  STORAGE_KEYS,
  updateStudioProjectInList,
} from '../services/localPersistence';
import {
  DEMO_LIVE_STATE,
  DemoGardenLabDataSource,
  HttpGardenLabDataSource,
  UNAVAILABLE_LIVE_STATE,
} from '../lab/smartGardenLive';
import { resolveRoute } from '../routing/appRoute';
import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { resolveCameraGatewayConfig } from '../lab/cameraGateway';
import {
  gardenLatestEndpoint,
  parseBiTechChannel,
} from '../lab/bitechChannels';
import {
  parseCameraSerialOutput,
  resolveCameraStreamUrl,
} from '../hardware/cameraSerialParser';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import {
  sanitizeHardwareLog,
  SerialPortInfo,
} from '../hardware/hardwareBridge';
import {
  getProfileFqbn,
  identifyCompatibleBoard,
} from '../hardware/boardDetection';
import { getDeviceCapabilities } from '../hardware/hardwareCapabilities';
import { validateProgramAgainstCapabilities } from '../hardware/hardwareValidator';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';
import {
  CONTEXTUAL_MANUAL_ENTRIES,
  getManualEntryForDevice,
} from '../manual/contextualManualData';
import {
  evaluateCameraProgram,
  evaluateGardenProgram,
  evaluateNodeMcuProgram,
} from '../simulator/programEvaluator';
import { ParsedProgram } from '../types/studio';

describe('Guía didáctica contextual por perfil', () => {
  it('muestra componentes del perfil activo y conserva la conexión DHT11 validada', () => {
    const gardenComponents = getComponentsForProfile('garden-node');
    const cameraComponents = getComponentsForProfile('camera-node');
    const dhtDiagram = getConnectionDiagramsForProfile('garden-node').find(
      (diagram) => diagram.id === 'garden-dht11-gpio21'
    );

    expect(gardenComponents.map((component) => component.id)).toEqual(
      expect.arrayContaining([
        'esp32',
        'dht11',
        'soil-moisture',
        'ldr',
        'relay',
        'pump',
        'led',
      ])
    );
    expect(cameraComponents.map((component) => component.id)).toEqual(
      expect.arrayContaining(['esp32-cam', 'ov2640', 'ov3660', 'wifi'])
    );
    expect(cameraComponents.some((component) => component.id === 'pump')).toBe(
      false
    );
    expect(dhtDiagram?.validationStatus).toBe('pending');
    expect(dhtDiagram?.generalConnections).toEqual(
      expect.arrayContaining([
        'DATA / S → GPIO digital disponible',
        'Humedad de suelo y módulo LDR: AO → GPIO con capacidad ADC',
      ])
    );
    expect(dhtDiagram?.prototypeEvidence).toEqual(
      expect.arrayContaining([
        'DHT11: conexión validada en Smart Garden Lab con DATA en GPIO21.',
      ])
    );
  });

  it('explica algoritmos antes que código y el Canal Bi-Tech como agrupador del proyecto', () => {
    const algorithms = getAlgorithmsForProfile('garden-node');
    const overview = algorithms.find(
      (algorithm) => algorithm.id === 'smart-garden-overview'
    );
    const irrigation = algorithms.find(
      (algorithm) => algorithm.id === 'automatic-irrigation'
    );
    const channel = algorithms.find(
      (algorithm) => algorithm.id === 'bitech-channel'
    );

    expect(irrigation?.flow).toEqual([
      'leer humedad',
      'comparar con umbral',
      'decidir',
      'activar bomba',
      'esperar',
      'apagar',
      'volver a medir',
    ]);
    expect(channel?.purpose).toContain('dispositivos');
    expect(channel?.purpose).toContain('mismo proyecto');
    expect(overview?.image).toBe(
      '/resources/guide/algorithms/smart-garden-algorithms.png'
    );
    expect(PROJECT_GUIDE_PROFILES['garden-node'].purpose).toContain(
      'observar condiciones ambientales'
    );
  });

  it('normaliza componentes, diagramas y algoritmos como láminas didácticas', () => {
    const dht = getComponentsForProfile('garden-node').find(
      (component) => component.id === 'dht11'
    );
    const dhtDiagram = getConnectionDiagramsForProfile('garden-node').find(
      (diagram) => diagram.id === 'garden-dht11-gpio21'
    );
    const monitoring = getAlgorithmsForProfile('garden-node').find(
      (algorithm) => algorithm.id === 'environment-monitoring'
    );

    expect(dht && componentToGuideResource(dht)).toMatchObject({
      kind: 'component',
      title: 'DHT11',
      imageSrc: '/resources/guide/components/dht11.png',
      badges: expect.arrayContaining(['Validado en hardware', 'Garden Node']),
      profileScope: expect.arrayContaining(['garden-node']),
    });
    expect(dhtDiagram && diagramToGuideResource(dhtDiagram)).toMatchObject({
      kind: 'diagram',
      imageSrc: '/resources/guide/connections/garden-node-connections.png',
    });
    expect(
      getConnectionDiagramsForProfile('garden-node').find(
        (diagram) => diagram.id === 'garden-energy-system'
      )?.image
    ).toBe('/resources/guide/connections/energy-system.png');
    expect(
      getConnectionDiagramsForProfile('camera-node').find(
        (diagram) => diagram.id === 'camera-module'
      )?.image
    ).toBe('/resources/guide/connections/camera-node-connections.png');
    expect(monitoring && algorithmToGuideResource(monitoring)).toMatchObject({
      kind: 'algorithm',
      imageSrc: '/resources/algorithms/environment-monitoring.svg',
    });
    expect(
      projectToGuideResource(
        'garden-node',
        PROJECT_GUIDE_PROFILES['garden-node']
      )
    ).toMatchObject({
      kind: 'project',
      imageSrc: '/resources/guide/project/garden-node-overview.png',
    });
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Capacidades de Hardware y Perfiles', () => {
  it('mantiene los pines GPIO físicos sin inventar (null) en los 3 perfiles y estados iniciales seguros OFF', () => {
    expect(GARDEN_NODE_CONFIG.pins.dht11.verifiedGpio).toBeNull();
    expect(GARDEN_NODE_CONFIG.pins.soilMoisture.verifiedGpio).toBeNull();
    expect(NODEMCU_ESP8266_CONFIG.pins.dht11.boardLabel).toBe('D5');
    expect(NODEMCU_ESP8266_CONFIG.pins.dht11.verifiedGpio).toBe(14);
    expect(NODEMCU_ESP8266_CONFIG.pins.analogA0.boardLabel).toBe('A0');
    expect(NODEMCU_ESP8266_CONFIG.pins.analogA0.verifiedGpio).toBe('A0');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.boardLabel).toBe('D1');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.verifiedGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.relayConfig.polarity).toBe('PENDING_VERIFICATION');
    expect(NODEMCU_ESP8266_CONFIG.relayConfig.safeInitialState).toEqual({
      relay: 'OFF',
      lighting: 'OFF',
      digitalOutput: 'LOW',
    });
    expect(CAMERA_NODE_CONFIG.streamEndpointUrl).toBeNull();
  });

  it('declara correctamente las capacidades diferenciadas de ESP32, ESP32-CAM y NodeMCU ESP8266', () => {
    const gardenCaps = getDeviceCapabilities('garden-node');
    const camCaps = getDeviceCapabilities('camera-node');
    const nodemcuCaps = getDeviceCapabilities('nodemcu-esp8266');

    expect(gardenCaps.analogInputs).toBeGreaterThan(1);
    expect(nodemcuCaps.analogInputs).toBe(1);
    expect(camCaps.camera).toBe(true);
    expect(nodemcuCaps.camera).toBe(false);
    expect(nodemcuCaps.compatibleActuators).toContain('single_relay');
    expect(nodemcuCaps.compatibleActuators).toContain('digital_output');
  });

  it('filtra categorías y bloques según las capacidades del dispositivo sin condicionales dispersos', () => {
    const nodemcuCatalog = getCatalogForDevice('nodemcu-esp8266');
    const categoryIds = nodemcuCatalog.map((c) => c.id);
    expect(categoryIds).not.toContain('camara');
    expect(categoryIds).toContain('sensores');
    expect(categoryIds).toContain('actuadores');

    const actuatorBlocks =
      nodemcuCatalog.find((c) => c.id === 'actuadores')?.blocks.map((b) => b.type) ?? [];
    expect(actuatorBlocks).toContain('bitech_actuator_relay_on');
    expect(actuatorBlocks).toContain('bitech_actuator_digital_out_on');
    expect(actuatorBlocks).not.toContain('bitech_actuator_pump_on');
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Restricciones de Hardware (NodeMCU A0)', () => {
  it('emite advertencia pedagógica cuando un proyecto en NodeMCU intenta usar más de 1 entrada analógica', () => {
    const invalidNodeMcuProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            leftPin: 'A0',
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [{ kind: 'relay_on' }],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            leftPin: 'A0',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'luz_on' }],
        },
      ],
    };

    const issues = validateProgramAgainstCapabilities(invalidNodeMcuProgram);
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['ANALOG_INPUTS_EXCEEDED', 'PIN_CONFLICT'])
    );
    expect(issues[0].message).toContain(
      'Este proyecto requiere más entradas analógicas'
    );

    const codeOut = generateArduinoCode(invalidNodeMcuProgram);
    expect(codeOut.validationIssues.length).toBeGreaterThanOrEqual(2);
    expect(codeOut.compactCode).toContain('ADVERTENCIA PEDAGÓGICA DE HARDWARE');
  });

  it('permite usar múltiples sensores analógicos en Garden Node (ESP32) sin advertencias', () => {
    const validEsp32Program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            leftPin: 'GPIO34',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on' }],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'nivelLuz',
            leftPin: 'GPIO35',
            operator: '<',
            rightNumber: 300,
          },
          thenBranch: [{ kind: 'luz_on' }],
        },
      ],
    };

    const issues = validateProgramAgainstCapabilities(validEsp32Program);
    expect(issues).toHaveLength(0);
  });

  it('Garden Node ESP32 + WiFi + IoT -> sin warning de cámara (evita regresión de cam_wifi)', () => {
    const gardenWifiIotProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [
        {
          kind: 'cam_wifi',
          ssid: 'SSID_PRUEBA',
          password: 'PASSWORD_PRUEBA_NO_REAL',
        },
      ],
      loopStatements: [
        {
          kind: 'iot_publish',
          topic: 'bitech/nodo1',
          sensor: 'humedadSuelo',
          pin: 'GPIO34',
        },
        { kind: 'wait', seconds: 5 },
      ],
    };

    const issues = validateProgramAgainstCapabilities(gardenWifiIotProgram);
    expect(issues).toHaveLength(0);

    const codeOut = generateArduinoCode(gardenWifiIotProgram);
    expect(codeOut.validationIssues).toHaveLength(0);
    expect(codeOut.compactCode).not.toContain('OV2640');
    expect(codeOut.compactCode).toContain(
      'conectarWiFi(WIFI_SSID, WIFI_PASSWORD);'
    );
    expect(codeOut.compilableSketch).toContain(
      'const char* WIFI_SSID = "SSID_PRUEBA";'
    );
    expect(codeOut.compilableSketch).toContain(
      'const char* WIFI_PASSWORD = "PASSWORD_PRUEBA_NO_REAL";'
    );
    expect(codeOut.compactCode).toContain(
      'enviarDatoIoT("bitech/nodo1", analogRead(34));'
    );

    // En cambio, un bloque real de cámara OV2640 en Garden Node sí debe advertir sobre cámara
    const gardenWithCameraBlock: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [{ kind: 'cam_init' }],
      loopStatements: [],
    };
    const cameraIssues = validateProgramAgainstCapabilities(gardenWithCameraBlock);
    expect(cameraIssues).toHaveLength(1);
    expect(cameraIssues[0].code).toBe('UNSUPPORTED_CAMERA_ON_DEVICE');
  });

  it('vincula Garden Node a un canal Bi-Tech 1–9 sin usarlo como credencial', () => {
    const gardenCatalog = getCatalogForDevice('garden-node');
    const nodemcuCatalog = getCatalogForDevice('nodemcu-esp8266');
    const cameraCatalog = getCatalogForDevice('camera-node');
    const blockTypes = (catalog: ReturnType<typeof getCatalogForDevice>) =>
      catalog.flatMap((category) => category.blocks.map((block) => block.type));

    expect(blockTypes(gardenCatalog)).toContain('bitech_iot_connect_channel');
    expect(blockTypes(nodemcuCatalog)).toContain('bitech_iot_connect_channel');
    expect(blockTypes(cameraCatalog)).not.toContain('bitech_iot_connect_channel');
    expect(parseBiTechChannel(1)).toBe(1);
    expect(parseBiTechChannel('9')).toBe(9);
    expect(parseBiTechChannel(0)).toBeNull();
    expect(parseBiTechChannel(10)).toBeNull();
    expect(gardenLatestEndpoint(2, 'https://gateway.example/')).toBe(
      'https://gateway.example/garden/channel/2/latest'
    );

    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [
        { kind: 'iot_connect_channel', channel: 2, blockId: 'channel-2' },
      ],
      loopStatements: [],
    };
    const output = generateArduinoCode(program);
    expect(output.compactCode).toContain('const uint8_t BITECH_CHANNEL = 2;');
    expect(output.compactCode).toContain(
      'conectarSmartGardenLab(BITECH_CHANNEL);'
    );
    expect(output.compilableSketch).toContain(
      'void conectarSmartGardenLab(uint8_t canal)'
    );
    expect(output.compilableSketch).not.toContain('Bearer');

    const simulation = evaluateGardenProgram(program, {
      temperatura: 20,
      humedadAmbiente: 60,
      humedadSuelo: 500,
      nivelLuz: 500,
    });
    expect(simulation.bitechChannel).toBe(2);
    expect(simulation.explanation).toContain('canal 2');
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Generador Arduino C/C++ y Simuladores', () => {
  it('genera código Arduino C/C++ educativo para NodeMCU ESP8266', () => {
    const nodemcuProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            leftPin: 'A0',
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [
            { kind: 'relay_on' },
            { kind: 'luz_on' },
            { kind: 'wait', seconds: 3 },
            { kind: 'relay_off' },
          ],
        },
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaDigital',
            leftPin: 'D6',
            operator: '==',
            rightNumber: 1,
          },
          thenBranch: [{ kind: 'digital_out_on' }],
        },
      ],
    };

    const out = generateArduinoCode(nodemcuProgram);
    expect(out.validationIssues).toHaveLength(0);
    expect(out.compactCode).toContain('pinMode(RELAY_PIN, OUTPUT);');
    expect(out.compactCode).toContain('pinMode(A0, INPUT);');
    expect(out.compactCode).toContain('pinMode(D6, INPUT);');
    expect(out.compactCode).toContain('analogRead(A0) < 400');
    expect(out.compactCode).toContain('digitalRead(D6) == 1');
    expect(out.compactCode).toContain('relayOn();');
    expect(out.compactCode).toContain('activarSalidaDigital();');

    const simActive = evaluateNodeMcuProgram(nodemcuProgram, {
      temperatura: 25,
      humedadAmbiente: 58,
      entradaAnalogicaA0: 280,
      analogSensorLabel: 'LDR (Luz)',
      entradaDigital: 1,
    });
    expect(simActive.relay).toBe(true);
    expect(simActive.iluminacion).toBe(true);
    expect(simActive.salidaDigital).toBe(true);

    const simInactive = evaluateNodeMcuProgram(nodemcuProgram, {
      temperatura: 25,
      humedadAmbiente: 58,
      entradaAnalogicaA0: 650,
      analogSensorLabel: 'LDR (Luz)',
      entradaDigital: 0,
    });
    expect(simInactive.relay).toBe(false);
    expect(simInactive.iluminacion).toBe(false);
    expect(simInactive.salidaDigital).toBe(false);
  });

  it('conserva intacto el funcionamiento de Garden Node y Camera Node', () => {
    const gardenProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            leftPin: 'GPIO34',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [
            { kind: 'bomba_on' },
            { kind: 'wait', seconds: 5 },
            { kind: 'bomba_off' },
          ],
        },
      ],
    };

    const res = evaluateGardenProgram(gardenProgram, {
      temperatura: 24,
      humedadAmbiente: 60,
      humedadSuelo: 25,
      nivelLuz: 720,
    });
    expect(res.bomba).toBe(true);

    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_init' },
        { kind: 'cam_stream_start' },
      ],
      loopStatements: [{ kind: 'cam_capture' }],
    };
    const camSim = evaluateCameraProgram(camProgram, 2, '14:32:15');
    expect(camSim.activa).toBe(true);
    expect(camSim.streaming).toBe(true);
    expect(camSim.capturas).toBe(3);
  });
});

describe('Bi-Tech IoT Studio V0.1.1 — Manual Contextual Adaptativo', () => {
  it('incluye explicaciones de limitaciones del ESP8266 cuando se selecciona NodeMCU', () => {
    expect(CONTEXTUAL_MANUAL_ENTRIES.bitech_sensor_analog_a0).toBeDefined();
    const entryOnNodeMcu = getManualEntryForDevice(
      'bitech_if_sensor_compare',
      'nodemcu-esp8266'
    );
    expect(entryOnNodeMcu.technicalNotes).toContain('NodeMCU');
  });
});

describe('Bi-Tech IoT Studio V0.1.2 — Hardware Readiness y Sketch Compilable (.ino)', () => {
  it('distingue explícitamente capacidades físicas (9 GPIO D0-D8) vs asignación educativa en NodeMCU', () => {
    const caps = getDeviceCapabilities('nodemcu-esp8266');
    expect(caps.physicalCapabilities.totalUsableGpios).toBe(9);
    expect(caps.physicalCapabilities.analogInputs).toBe(1);
    expect(caps.physicalCapabilities.analogMaxRawValue).toBe(1023);
    expect(caps.educationalAllocation.digitalInputsExposed).toBe(1);
    expect(caps.educationalAllocation.digitalOutputsExposed).toBe(3);
    expect(caps.educationalAllocation.simplificationExplanation).toContain('boot-strapping');
  });

  it('registra adcInputVoltageRange como unverified y mantiene el mapeo Etiqueta de Placa (Dx) -> GPIO real', () => {
    expect(NODEMCU_ESP8266_CONFIG.capabilities.adcInputVoltageRange).toBe('unverified');
    expect(NODEMCU_ESP8266_CONFIG.verifiedFqbn).toBe('esp8266:esp8266:nodemcuv2');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.candidateBoardLabel).toBe('D1');
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.candidateGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.pins.relay.verifiedGpio).toBe(5);
    expect(NODEMCU_ESP8266_CONFIG.pinReferenceTable.length).toBeGreaterThanOrEqual(10);
  });

  it('genera de forma separada la Vista educativa y el Sketch compilable (.ino) para el programa mínimo de validación', () => {
    const minValidationProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [{ kind: 'relay_off' }],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            leftPin: 'A0',
            leftExpr: {
              kind: 'sensor_read',
              sensor: 'entradaAnalogicaA0',
              pin: 'A0',
            },
            operator: '<',
            rightNumber: 400,
          },
          thenBranch: [{ kind: 'relay_on' }],
          elseBranch: [{ kind: 'relay_off' }],
        },
      ],
    };

    const output = generateArduinoCode(minValidationProgram);
    expect(output.validationIssues).toHaveLength(0);

    // 1. Vista educativa limpia y enfocada en setup() + loop()
    expect(output.compactCode).toContain('void setup()');
    expect(output.compactCode).toContain('relayOff();');
    expect(output.compactCode).toContain('if (analogRead(A0) < 400) {');
    expect(output.compactCode).toContain('relayOn();');
    expect(output.compactCode).toContain('} else {');
    expect(output.compactCode).not.toContain('#include <Arduino.h>');

    // 2. Sketch compilable completo (.ino) sin librerías externas innecesarias
    expect(output.compilableSketch).toContain('#include <Arduino.h>');
    expect(output.compilableSketch).not.toContain('#include <ESP8266WiFi.h>');
    expect(output.compilableSketch).not.toContain('#include <DHT.h>');
    expect(output.compilableSketch).toContain('#define RELAY_PIN       5   // D1 -> GPIO5');
    expect(output.compilableSketch).toContain('#define ANALOG_A0_PIN   A0  // A0 -> A0');
    expect(output.compilableSketch).toContain('adcInputVoltageRange: unverified');
    expect(output.compilableSketch).toContain('int leerEntradaAnalogicaA0() {');
    expect(output.compilableSketch).toContain('void relayOn() {');
    expect(output.compilableSketch).toContain('void relayOff() {');

    // 3. Al utilizar bloques de temperatura y humedad ambiente, incluye <DHT.h> y dht.begin()
    const dhtProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        { kind: 'data_log', label: 'Temperatura', sensor: 'temperatura' },
        { kind: 'data_log', label: 'Humedad', sensor: 'humedadAmbiente' },
        { kind: 'wait', seconds: 2 },
      ],
    };
    const dhtOutput = generateArduinoCode(dhtProgram);
    expect(dhtOutput.compilableSketch).toContain('#include <DHT.h>');
    expect(dhtOutput.compilableSketch).toContain('DHT dht(DHT_PIN, DHT_TYPE);');
    expect(dhtOutput.compilableSketch).toContain('dht.begin();');
    expect(dhtOutput.compilableSketch).toContain('return dht.readTemperature();');
    expect(dhtOutput.compilableSketch).toContain('return dht.readHumidity();');
  });
});

describe('Bi-Tech IoT Studio V0.3 — Placa real y HardwareBridge', () => {
  it('sanitiza direcciones MAC, rutas locales y contraseñas en detalles técnicos', () => {
    const sampleMac = Array(6).fill('aa').join(':');
    const rawLog =
      `Chip is ESP8266EX\nMAC: ${sampleMac}\nPath: C:\\Users\\Alumno\\AppData\\Local\\Arduino15\\packages\n` +
      'const char* WIFI_PASSWORD = "PASSWORD_PRUEBA_NO_REAL";';
    const clean = sanitizeHardwareLog(rawLog);
    expect(clean).toContain('MAC: [REDACTED]');
    expect(clean).not.toContain(sampleMac);
    expect(clean).toContain('<LOCAL_USER_PATH>');
    expect(clean).not.toContain('C:\\Users\\Alumno');
    expect(clean).not.toContain('PASSWORD_PRUEBA_NO_REAL');
    expect(clean).toContain('WIFI_PASSWORD = "[REDACTED]"');
  });

  it('selecciona Garden Node automáticamente cuando Arduino CLI identifica ESP32 Dev Module', () => {
    const portAddress = 'PORT_GARDEN_TEST';
    const port: SerialPortInfo = {
      address: portAddress,
      label: `${portAddress} — Puerto USB`,
      protocol: 'serial',
      protocolLabel: 'Serial Port (USB)',
      isUsb: true,
      usbProduct: 'USB-Enhanced-SERIAL CH9102',
      usbManufacturer: 'WCH',
      matchingBoards: [
        {
          name: 'ESP32 Dev Module',
          fqbn: 'esp32:esp32:esp32',
        },
      ],
      chipModel: 'ESP32-D0WD-V3 (revision v3.0)',
      flashSize: '4 MB',
    };

    const detected = identifyCompatibleBoard(port);
    expect(detected.port.address).toBe(portAddress);
    expect(detected.family).toBe('esp32');
    expect(detected.usbSerialChip).toBe('WCH CH9102');
    expect(detected.suggestedProfileId).toBe('garden-node');
    expect(detected.recommendedFqbn).toBe('esp32:esp32:esp32');
  });

  it('sólo sugiere Camera Node cuando ESP32-CAM está identificada explícitamente', () => {
    const basePort: SerialPortInfo = {
      address: '/dev/ttyUSB0',
      label: '/dev/ttyUSB0 — Puerto USB',
      protocol: 'serial',
      protocolLabel: 'Serial Port (USB)',
      isUsb: true,
      usbProduct: null,
      usbManufacturer: null,
      matchingBoards: [
        {
          name: 'AI Thinker ESP32-CAM',
          fqbn: 'esp32:esp32:esp32cam',
        },
      ],
      chipModel: 'ESP32-D0WD',
      flashSize: null,
    };

    const camera = identifyCompatibleBoard(basePort);
    expect(camera.family).toBe('esp32-cam');
    expect(camera.suggestedProfileId).toBe('camera-node');
    expect(camera.recommendedFqbn).toBe('esp32:esp32:esp32cam');
  });

  it('exige selección manual para un ESP32 genérico sin match específico y resuelve el FQBN del perfil elegido', () => {
    const genericEsp32 = identifyCompatibleBoard({
      address: 'PORT_ESP32_AMBIGUOUS_TEST',
      label: 'Puerto USB de prueba',
      protocol: 'serial',
      protocolLabel: 'Serial Port (USB)',
      isUsb: true,
      usbProduct: 'USB Serial Port',
      usbManufacturer: 'FTDI',
      matchingBoards: [],
      chipModel: 'ESP32-D0WD-V3 (revision v3.1)',
      flashSize: null,
    });

    expect(genericEsp32.family).toBe('esp32');
    expect(genericEsp32.displayName).toBe(
      'Placa ESP32 detectada — seleccioná el perfil'
    );
    expect(genericEsp32.suggestedProfileId).toBeNull();
    expect(genericEsp32.recommendedFqbn).toBeNull();
    expect(genericEsp32.requiresProfileSelection).toBe(true);
    expect(getProfileFqbn('camera-node')).toBe('esp32:esp32:esp32cam');
    expect(getProfileFqbn('garden-node')).toBe('esp32:esp32:esp32');
  });

  it('asocia ESP8266 con el perfil NodeMCU y deja seleccionar perfil si la familia es desconocida', () => {
    const nodemcu = identifyCompatibleBoard({
      address: 'PORT_NODEMCU_TEST',
      label: 'Puerto NodeMCU de prueba',
      protocol: 'serial',
      protocolLabel: 'Serial Port (USB)',
      isUsb: true,
      usbProduct: 'CP2102 USB to UART Bridge Controller',
      usbManufacturer: 'Silicon Labs',
      matchingBoards: [],
      chipModel: 'ESP8266EX',
      flashSize: null,
    });
    expect(nodemcu.family).toBe('esp8266');
    expect(nodemcu.usbSerialChip).toBe('Silicon Labs CP2102');
    expect(nodemcu.suggestedProfileId).toBe('nodemcu-esp8266');
    expect(nodemcu.recommendedFqbn).toBe(
      'esp8266:esp8266:nodemcuv2'
    );

    const unknown = identifyCompatibleBoard({
      address: 'PORT_UNKNOWN_TEST',
      label: 'Puerto USB desconocido de prueba',
      protocol: 'serial',
      protocolLabel: 'Serial Port (USB)',
      isUsb: true,
      usbProduct: 'USB Serial Device',
      usbManufacturer: null,
      matchingBoards: [],
      chipModel: null,
      flashSize: null,
    });
    expect(unknown.family).toBe('unknown');
    expect(unknown.suggestedProfileId).toBeNull();
    expect(unknown.requiresProfileSelection).toBe(true);
  });
});

describe('Bi-Tech IoT Studio V0.4A — Preparación de Camera Node Bi-Tech (ESP32-CAM)', () => {
  it('resuelve únicamente gateways HTTP(S) y exige HTTPS para producción', () => {
    expect(resolveCameraGatewayConfig(undefined)).toBeNull();
    expect(resolveCameraGatewayConfig('ftp://camera.example')).toBeNull();
    expect(
      resolveCameraGatewayConfig('http://127.0.0.1:8787', true)
    ).toBeNull();

    expect(
      resolveCameraGatewayConfig('https://camera.example/')
    ).toEqual({
      baseUrl: 'https://camera.example',
      captureUrl: 'https://camera.example/camera/capture',
      streamUrl: 'https://camera.example/camera/stream',
    });
  });

  it('mantiene verifiedFqbn en null (pendiente de placa física) y define candidateFqbn esp32:esp32:esp32cam sin URLs hardcodeadas', () => {
    expect(CAMERA_NODE_CONFIG.verifiedFqbn).toBeNull();
    expect(CAMERA_NODE_CONFIG.candidateFqbn).toBe('esp32:esp32:esp32cam');
    expect(CAMERA_NODE_CONFIG.streamEndpointUrl).toBeNull();
    expect(CAMERA_NODE_CONFIG.captureEndpointUrl).toBeNull();
    expect(resolveCameraStreamUrl({})).toBeNull();
  });

  it('genera un sketch Arduino C/C++ completo y compilable para ESP32-CAM con placeholders seguros de Wi-Fi', () => {
    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_resolution', resolution: 'SVGA (800x600)' },
        { kind: 'cam_quality', quality: 10 },
        { kind: 'cam_init' },
        {
          kind: 'cam_wifi',
          ssid: 'SSID_PRUEBA',
          password: 'PASSWORD_PRUEBA_NO_REAL',
        },
        { kind: 'cam_stream_start' },
      ],
      loopStatements: [
        { kind: 'cam_capture' },
        { kind: 'wait', seconds: 10 },
      ],
    };

    const output = generateArduinoCode(camProgram);
    expect(output.validationIssues).toHaveLength(0);
    expect(output.compilableSketch).toContain('#include "esp_camera.h"');
    expect(output.compilableSketch).toContain('#include <WiFi.h>');
    expect(output.compilableSketch).toContain('#include "esp_http_server.h"');
    expect(output.compilableSketch).toContain(
      'const char* WIFI_SSID = "SSID_PRUEBA";'
    );
    expect(output.compilableSketch).toContain(
      'const char* WIFI_PASSWORD = "PASSWORD_PRUEBA_NO_REAL";'
    );
    expect(output.compilableSketch).toContain(
      'conectarWiFi(WIFI_SSID, WIFI_PASSWORD);'
    );
    expect(output.compilableSketch).toContain('esp_camera_init(&cameraConfig)');
    expect(output.compilableSketch).toContain('httpd_start(&streamHttpd, &config)');
    expect(output.compilableSketch).toContain('esp_camera_fb_get()');
  });

  it('parsea de forma tolerante y configurable los mensajes serie futuros de Camera Node', () => {
    const sampleLog = [
      'Bi-Tech Camera Node booting...',
      'Camera ready',
      'WiFi connected',
      'IP: 192.168.1.120',
      'Streaming started',
    ].join('\n');

    const parsed = parseCameraSerialOutput(sampleLog);
    expect(parsed.cameraReady).toBe(true);
    expect(parsed.wifiConnected).toBe(true);
    expect(parsed.detectedIp).toBe('192.168.1.120');
    expect(parsed.streamingStarted).toBe(true);

    const emptyParsed = parseCameraSerialOutput('Esperando conexión física...');
    expect(emptyParsed.cameraReady).toBe(false);
    expect(emptyParsed.wifiConnected).toBe(false);
    expect(emptyParsed.detectedIp).toBeNull();
    expect(emptyParsed.streamingStarted).toBe(false);
  });
});

describe('Bi-Tech IoT Studio — Contexto estructurado para Asistente Bi-Tech', () => {
  it('construye BiTechAssistantContext con el dispositivo activo, bloques, código educativo, sketch .ino y validaciones', () => {
    const sampleProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          blockId: 'block_if_soil',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            leftPin: 'GPIO34',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on' }],
        },
      ],
    };

    const generatedCode = generateArduinoCode(sampleProgram);
    const context = buildBiTechAssistantContext({
      activeDevice: 'garden-node',
      projectName: 'Riego inteligente',
      selectedBlockType: 'bitech_if_sensor_compare',
      selectedBlockId: 'block_if_soil',
      parsedProgram: sampleProgram,
      generatedCode,
    });

    expect(context.activeDevice).toBe('garden-node');
    expect(context.projectName).toBe('Riego inteligente');
    expect(context.selectedBlockType).toBe('bitech_if_sensor_compare');
    expect(context.selectedBlockId).toBe('block_if_soil');
    expect(context.generatedEducationalCode).toContain('void setup()');
    expect(context.generatedSketch).toContain('#include <Arduino.h>');
    expect(context.validationIssues).toEqual([]);
    expect(BITECH_ASSISTANT_SUGGESTIONS).toEqual([
      'Explicame este programa',
      '¿Qué me falta configurar?',
      'Explicame este bloque',
      'Ayudame a encontrar el error',
    ]);
  });
});

describe('Bi-Tech IoT Studio — Gestión de Nuevo Proyecto y Multi-Proyecto Local', () => {
  it('migra Riego inteligente como primer StudioProject sin borrar claves previas y permite crear proyectos nuevos con Blockly vacío', () => {
    const store = new Map<string, string>();
    const fakeLocalStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: fakeLocalStorage,
      configurable: true,
      writable: true,
    });

    // Simular usuario existente con Riego inteligente guardado en el formato previo
    store.set(STORAGE_KEYS.projectName, 'Riego inteligente');
    store.set(STORAGE_KEYS.activeDevice, 'garden-node');
    store.set(
      STORAGE_KEYS.gardenXml,
      '<xml xmlns="https://developers.google.com/blockly/xml"><block type="bitech_on_start"></block></xml>'
    );

    const initialProjects = loadStudioProjects();
    expect(initialProjects).toHaveLength(1);
    expect(initialProjects[0].name).toBe('Riego inteligente');
    expect(initialProjects[0].device).toBe('garden-node');
    expect(initialProjects[0].workspaceXml).toContain('bitech_on_start');
    // No se borran las claves previas durante la migración
    expect(store.get(STORAGE_KEYS.projectName)).toBe('Riego inteligente');

    // Crear un segundo proyecto nuevo ("Proyecto prueba") -> abre con Blockly vacío
    const { projects: afterCreate, created } = createStudioProject(
      'Proyecto prueba',
      'garden-node',
      initialProjects
    );
    expect(afterCreate).toHaveLength(2);
    expect(created.name).toBe('Proyecto prueba');
    expect(created.workspaceXml).toBe(EMPTY_WORKSPACE_XML);
    expect(loadActiveProjectId(afterCreate)).toBe(created.id);

    // Modificar únicamente "Proyecto prueba" y verificar que "Riego inteligente" permanece intacto
    const customXml =
      '<xml xmlns="https://developers.google.com/blockly/xml"><block type="bitech_actuator_pump_on"></block></xml>';
    const afterUpdate = updateStudioProjectInList(
      afterCreate,
      created.id,
      { workspaceXml: customXml }
    );

    const riego = afterUpdate.find((p) => p.name === 'Riego inteligente')!;
    const prueba = afterUpdate.find((p) => p.name === 'Proyecto prueba')!;
    expect(riego.workspaceXml).toContain('bitech_on_start');
    expect(riego.workspaceXml).not.toContain('bitech_actuator_pump_on');
    expect(prueba.workspaceXml).toContain('bitech_actuator_pump_on');

    // Verificar que un proyecto vacío genera sólo la estructura mínima del dispositivo
    const emptyCode = generateArduinoCode({
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [],
    });
    expect(emptyCode.compactCode).toContain('void setup() {');
    expect(emptyCode.compactCode).toContain(
      '// Construye tu programa arrastrando bloques aquí'
    );
  });
});

describe('Bi-Tech IoT Studio V0.5A — Rutas y Smart Garden Lab (demostración)', () => {
  it('resuelve /studio y /lab y redirige la raíz y rutas desconocidas a /studio', () => {
    expect(resolveRoute('/studio')).toEqual({ route: 'studio', needsRedirect: false });
    expect(resolveRoute('/studio/')).toEqual({ route: 'studio', needsRedirect: false });
    expect(resolveRoute('/lab')).toEqual({ route: 'lab', needsRedirect: false });
    expect(resolveRoute('/lab/')).toEqual({ route: 'lab', needsRedirect: false });
    expect(resolveRoute('/')).toEqual({ route: 'studio', needsRedirect: true });
    expect(resolveRoute('/otra-ruta')).toEqual({ route: 'studio', needsRedirect: true });
    expect(resolveRoute('/laboratorio')).toEqual({ route: 'studio', needsRedirect: true });
  });

  it('DemoGardenLabDataSource entrega datos simulados y NUNCA reporta hardware conectado', () => {
    const ds = new DemoGardenLabDataSource();
    const snap = ds.getSnapshot();
    expect(ds.isDemo).toBe(true);
    expect(snap.source).toBe('demo');
    expect(snap.temperature).toBe(24.0);
    expect(snap.ambientHumidity).toBe(60);
    expect(snap.soilMoisture).toBe(650);
    expect(snap.lightLevel).toBe(720);
    expect(snap.pump).toBe(false);
    expect(snap.lighting).toBe(false);
    expect(snap.gardenNodeConnected).toBe(false);
    expect(snap.cameraNodeConnected).toBe(false);
    expect(snap.networkConnected).toBe(false);
    expect(snap.cameraStreamUrl).toBeUndefined();
    expect(DEMO_LIVE_STATE.cameraStreamUrl).toBeUndefined();

    let received: number | null = null;
    const unsubscribe = ds.subscribe((s) => {
      received = s.soilMoisture;
    });
    expect(received).toBe(650);
    expect(typeof unsubscribe).toBe('function');
  });

  it('HttpGardenLabDataSource reemplaza sólo temperatura y humedad con telemetría real', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          channel: 1,
          temperature: 17.3,
          humidity: 60,
          status: 'online',
          timestamp: 1793059200000,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    const ds = new HttpGardenLabDataSource(
      'https://gateway.example/garden/channel/1/latest',
      DEMO_LIVE_STATE,
      fetchImpl
    );

    expect(ds.getSnapshot().source).toBe('demo');
    expect(await ds.refresh()).toBe(true);

    const snap = ds.getSnapshot();
    expect(snap.source).toBe('real');
    expect(snap.temperature).toBe(17.3);
    expect(snap.ambientHumidity).toBe(60);
    expect(snap.gardenNodeConnected).toBe(true);
    expect(snap.networkConnected).toBe(true);
    expect(snap.soilMoisture).toBeNull();
    expect(snap.lightLevel).toBeNull();
    expect(snap.pump).toBeNull();
    expect(snap.lighting).toBeNull();
    expect(snap.cameraNodeConnected).toBe(false);
    expect(snap.channel).toBe(1);
  });

  it('la fuente HTTP inicia sin valores demo mientras espera telemetría real', () => {
    const ds = new HttpGardenLabDataSource(
      'https://gateway.example/garden/channel/1/latest',
      undefined,
      async () => new Response(null, { status: 503 })
    );

    const snap = ds.getSnapshot();
    expect(snap).toEqual(UNAVAILABLE_LIVE_STATE);
    expect(snap.source).toBe('unavailable');
    expect(snap.temperature).toBeNull();
    expect(snap.ambientHumidity).toBeNull();
    expect(snap.soilMoisture).toBeNull();
    expect(snap.lightLevel).toBeNull();
  });
});
