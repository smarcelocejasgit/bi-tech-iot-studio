import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import {
  collectAllSensorsInStatements,
  validateProgramAgainstCapabilities,
} from '../hardware/hardwareValidator';
import { NODEMCU_ESP8266_CONFIG } from '../hardware/nodeMcuConfig';
import {
  CodeLineMapping,
  ConditionNode,
  GeneratedArduinoOutput,
  NumericExpressionNode,
  ParsedProgram,
  SensorKey,
  StatementNode,
} from '../types/studio';

interface SensorVariableMeta {
  varName: string;
  cType: 'int' | 'float';
  funcCall: string;
}

const SENSOR_CODE_META: Record<SensorKey, SensorVariableMeta> = {
  humedadSuelo: {
    varName: 'suelo',
    cType: 'int',
    funcCall: 'leerHumedadSuelo()',
  },
  temperatura: {
    varName: 'temperatura',
    cType: 'float',
    funcCall: 'leerTemperatura()',
  },
  humedadAmbiente: {
    varName: 'humedadAmb',
    cType: 'float',
    funcCall: 'leerHumedadAmbiente()',
  },
  nivelLuz: {
    varName: 'luz',
    cType: 'int',
    funcCall: 'leerNivelLuz()',
  },
  entradaAnalogicaA0: {
    varName: 'valorA0',
    cType: 'int',
    funcCall: 'leerEntradaAnalogicaA0()',
  },
  entradaDigital: {
    varName: 'estadoDigital',
    cType: 'int',
    funcCall: 'leerEntradaDigital()',
  },
};

function formatNumericExprC(
  expr: NumericExpressionNode | undefined,
  useLocalVars: boolean
): string {
  if (!expr) return '0';
  if (expr.kind === 'number_literal') {
    return String(expr.value);
  }
  if (expr.kind === 'sensor_read') {
    return useLocalVars
      ? SENSOR_CODE_META[expr.sensor].varName
      : SENSOR_CODE_META[expr.sensor].funcCall;
  }
  if (expr.kind === 'math_op') {
    return `(${formatNumericExprC(expr.left, useLocalVars)} ${expr.operator} ${
      expr.rightNumber
    })`;
  }
  return '0';
}

function formatConditionC(cond: ConditionNode | null, useLocalVars: boolean): string {
  if (!cond) return 'false';
  if (cond.kind === 'comparison') {
    let left: string;
    if (cond.leftExpr && cond.leftExpr.kind === 'math_op') {
      left = formatNumericExprC(cond.leftExpr, useLocalVars);
    } else if (cond.leftSensor) {
      left = useLocalVars
        ? SENSOR_CODE_META[cond.leftSensor].varName
        : SENSOR_CODE_META[cond.leftSensor].funcCall;
    } else {
      left = String(cond.leftNumber ?? 0);
    }
    return `${left} ${cond.operator} ${cond.rightNumber}`;
  }
  if (cond.kind === 'logical') {
    const op = cond.operator === 'AND' ? '&&' : '||';
    return `(${formatConditionC(cond.left, useLocalVars)} ${op} ${formatConditionC(
      cond.right,
      useLocalVars
    )})`;
  }
  return 'estadoCamara()';
}

function hasStatementKind(
  stmts: StatementNode[],
  predicate: (st: StatementNode) => boolean
): boolean {
  for (const st of stmts) {
    if (predicate(st)) return true;
    if (st.kind === 'if') {
      if (hasStatementKind(st.thenBranch, predicate)) return true;
      if (st.elseBranch && hasStatementKind(st.elseBranch, predicate)) return true;
    }
  }
  return false;
}

function emitStatementsC(
  stmts: StatementNode[],
  indent: string,
  useLocalVars: boolean,
  out: { code: string; blockId?: string }[]
): void {
  for (const st of stmts) {
    switch (st.kind) {
      case 'bomba_on':
        out.push({ code: `${indent}bombaOn();`, blockId: st.blockId });
        break;
      case 'bomba_off':
        out.push({ code: `${indent}bombaOff();`, blockId: st.blockId });
        break;
      case 'luz_on':
        out.push({ code: `${indent}luzOn();`, blockId: st.blockId });
        break;
      case 'luz_off':
        out.push({ code: `${indent}luzOff();`, blockId: st.blockId });
        break;
      case 'relay_on':
        out.push({ code: `${indent}relayOn();`, blockId: st.blockId });
        break;
      case 'relay_off':
        out.push({ code: `${indent}relayOff();`, blockId: st.blockId });
        break;
      case 'digital_out_on':
        out.push({
          code: `${indent}activarSalidaDigital();`,
          blockId: st.blockId,
        });
        break;
      case 'digital_out_off':
        out.push({
          code: `${indent}desactivarSalidaDigital();`,
          blockId: st.blockId,
        });
        break;
      case 'wait': {
        const ms = Math.max(0, Math.round(st.seconds * 1000));
        out.push({ code: `${indent}delay(${ms});`, blockId: st.blockId });
        break;
      }
      case 'if': {
        const condStr = formatConditionC(st.condition, useLocalVars);
        out.push({ code: `${indent}if (${condStr}) {`, blockId: st.blockId });
        if (st.thenBranch.length === 0) {
          out.push({
            code: `${indent}  // Agrega bloques de acción aquí`,
            blockId: st.blockId,
          });
        } else {
          emitStatementsC(st.thenBranch, `${indent}  `, useLocalVars, out);
        }
        if (st.elseBranch && st.elseBranch.length > 0) {
          out.push({ code: `${indent}} else {`, blockId: st.blockId });
          emitStatementsC(st.elseBranch, `${indent}  `, useLocalVars, out);
        }
        out.push({ code: `${indent}}`, blockId: st.blockId });
        break;
      }
      case 'cam_config':
        out.push({ code: `${indent}configurarCamara();`, blockId: st.blockId });
        break;
      case 'cam_resolution':
        out.push({
          code: `${indent}seleccionarResolucion("${st.resolution}");`,
          blockId: st.blockId,
        });
        break;
      case 'cam_quality':
        out.push({
          code: `${indent}configurarCalidad(${st.quality});`,
          blockId: st.blockId,
        });
        break;
      case 'cam_init':
        out.push({ code: `${indent}iniciarCamara();`, blockId: st.blockId });
        break;
      case 'cam_wifi':
        out.push({
          code: `${indent}conectarWiFi(WIFI_SSID, WIFI_PASS); // Red: ${st.ssid}`,
          blockId: st.blockId,
        });
        break;
      case 'cam_stream_start':
        out.push({ code: `${indent}iniciarStreaming();`, blockId: st.blockId });
        break;
      case 'cam_stream_stop':
        out.push({ code: `${indent}detenerStreaming();`, blockId: st.blockId });
        break;
      case 'cam_capture':
        out.push({ code: `${indent}tomarCaptura();`, blockId: st.blockId });
        break;
      case 'data_log': {
        const valExpr = useLocalVars
          ? SENSOR_CODE_META[st.sensor].varName
          : SENSOR_CODE_META[st.sensor].funcCall;
        out.push({
          code: `${indent}registrarDato("${st.label}", ${valExpr});`,
          blockId: st.blockId,
        });
        break;
      }
      case 'iot_publish': {
        const valExpr = useLocalVars
          ? SENSOR_CODE_META[st.sensor].varName
          : SENSOR_CODE_META[st.sensor].funcCall;
        out.push({
          code: `${indent}enviarDatoIoT("${st.topic}", ${valExpr});`,
          blockId: st.blockId,
        });
        break;
      }
    }
  }
}

/**
 * Construye el Sketch Completo (.ino) compilable para NodeMCU ESP8266.
 * Incluye directivas #include según los bloques empleados, mapeo explícito
 * Etiqueta de placa (D0-D8 / A0) -> GPIO real, setup(), loop() y funciones auxiliares.
 */
function buildNodeMcuCompilableSketch(
  program: ParsedProgram,
  compactCode: string,
  usedSensors: Set<SensorKey>
): string {
  const allStatements = [...program.setupStatements, ...program.loopStatements];
  const usesWifi = hasStatementKind(
    allStatements,
    (st) => st.kind === 'cam_wifi' || st.kind === 'iot_publish'
  );
  const usesDht =
    usedSensors.has('temperatura') || usedSensors.has('humedadAmbiente');
  const usesDataLog = hasStatementKind(
    allStatements,
    (st) => st.kind === 'data_log'
  );

  const { pins, capabilities, relayConfig } = NODEMCU_ESP8266_CONFIG;
  const relayGpio = pins.relay.verifiedGpio ?? pins.relay.candidateGpio ?? 5;
  const relayOnLevel = relayConfig.polarity === 'ACTIVE_LOW' ? 'LOW' : 'HIGH';
  const relayOffLevel = relayConfig.polarity === 'ACTIVE_LOW' ? 'HIGH' : 'LOW';
  const lightGpio =
    pins.lighting.verifiedGpio ?? pins.lighting.candidateGpio ?? 4;
  const doutGpio =
    pins.digitalOutput.verifiedGpio ??
    pins.digitalOutput.candidateGpio ??
    'LED_BUILTIN';
  const dinGpio =
    pins.digitalInput.verifiedGpio ?? pins.digitalInput.candidateGpio ?? 12;
  const dhtGpio = pins.dht11.verifiedGpio ?? pins.dht11.candidateGpio ?? 14;

  const includeLines: string[] = ['#include <Arduino.h>'];
  if (usesDht) {
    includeLines.push('#include <DHT.h>');
  }
  if (usesWifi) {
    includeLines.push('#include <ESP8266WiFi.h>');
  }

  const helperLines: string[] = [
    '// ============================================================================',
    '// FUNCIONES AUXILIARES DE HARDWARE (Implementación compilable NodeMCU ESP8266)',
    '// ============================================================================',
    '',
    'int leerEntradaAnalogicaA0() {',
    '  // Lectura cruda del ADC de 10 bits (0 - 1023).',
    `  // Rango eléctrico A0 (adcInputVoltageRange): ${capabilities.adcInputVoltageRange} (depende del divisor resistivo de la placa).`,
    '  return analogRead(ANALOG_A0_PIN);',
    '}',
    '',
    'int leerEntradaDigital() {',
    '  return digitalRead(ENTRADA_DIG_PIN);',
    '}',
    '',
    'void relayOn() {',
    `  // Polaridad configurada en perfil: ${relayConfig.polarity}`,
    `  digitalWrite(RELAY_PIN, ${relayOnLevel});`,
    '  Serial.println("Relay ON");',
    '}',
    '',
    'void relayOff() {',
    `  digitalWrite(RELAY_PIN, ${relayOffLevel});`,
    '  Serial.println("Relay OFF");',
    '}',
    '',
    'void luzOn() {',
    '  digitalWrite(LUZ_PIN, HIGH);',
    '}',
    '',
    'void luzOff() {',
    '  digitalWrite(LUZ_PIN, LOW);',
    '}',
    '',
    'void activarSalidaDigital() {',
    '  // En NodeMCU ESP8266, LED_BUILTIN es activo en nivel bajo (LOW enciende el LED integrado)',
    '  digitalWrite(SALIDA_DIG_PIN, LOW);',
    '  Serial.println("Salida ON");',
    '}',
    '',
    'void desactivarSalidaDigital() {',
    '  digitalWrite(SALIDA_DIG_PIN, HIGH);',
    '  Serial.println("Salida OFF");',
    '}',
  ];

  if (usesDht) {
    helperLines.push(
      '',
      'float leerTemperatura() {',
      '  return dht.readTemperature();',
      '}',
      '',
      'float leerHumedadAmbiente() {',
      '  return dht.readHumidity();',
      '}'
    );
  }

  if (usesDataLog) {
    helperLines.push(
      '',
      'void registrarDato(const char* etiqueta, float valor) {',
      '  Serial.print(etiqueta);',
      '  Serial.print(": ");',
      '  if (isnan(valor)) {',
      '    Serial.println("Error de lectura (NaN)");',
      '    return;',
      '  }',
      '  Serial.print(valor, 1);',
      '  if (strncmp(etiqueta, "Temp", 4) == 0 || strncmp(etiqueta, "temp", 4) == 0) {',
      '    Serial.println(" °C");',
      '  } else if (strncmp(etiqueta, "Hum", 3) == 0 || strncmp(etiqueta, "hum", 3) == 0) {',
      '    Serial.println(" %");',
      '  } else {',
      '    Serial.println();',
      '  }',
      '}'
    );
  }

  if (usesWifi) {
    helperLines.push(
      '',
      'const char* WIFI_SSID = "Red_Escolar_BiTech";',
      'const char* WIFI_PASS = "pendiente_configuracion";',
      '',
      'void conectarWiFi(const char* ssid, const char* pass) {',
      '  WiFi.mode(WIFI_STA);',
      '  WiFi.begin(ssid, pass);',
      '}',
      '',
      'void enviarDatoIoT(const char* topico, float valor) {',
      '  Serial.print("[BI-TECH IoT] ");',
      '  Serial.print(topico);',
      '  Serial.print(" -> ");',
      '  Serial.println(valor);',
      '}'
    );
  }

  return [
    '// ============================================================================',
    '// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)',
    `// Perfil: ${NODEMCU_ESP8266_CONFIG.name} (${NODEMCU_ESP8266_CONFIG.mcu})`,
    `// FQBN verificado: ${NODEMCU_ESP8266_CONFIG.verifiedFqbn}`,
    `// adcInputVoltageRange: ${capabilities.adcInputVoltageRange} (escala cruda 0-1023)`,
    '// NOTA: Asignación de pines con distinción Etiqueta de placa (Dx) -> GPIO real.',
    '// Cableado definitivo de aula pendiente de verificación física.',
    '// ============================================================================',
    '',
    ...includeLines,
    '',
    '// --- Mapeo de pines: Etiqueta serigrafiada en placa NodeMCU -> GPIO ESP8266 ---',
    `#define ANALOG_A0_PIN   A0  // ${pins.analogA0.candidateBoardLabel} -> ${pins.analogA0.candidateGpio} (${pins.analogA0.component})`,
    `#define RELAY_PIN       ${relayGpio}   // ${pins.relay.candidateBoardLabel} -> GPIO${relayGpio} (${pins.relay.component})`,
    `#define DHT_PIN         ${dhtGpio}  // ${pins.dht11.candidateBoardLabel} -> GPIO${dhtGpio} (${pins.dht11.component})`,
    `#define ENTRADA_DIG_PIN ${dinGpio}  // ${pins.digitalInput.candidateBoardLabel} -> GPIO${dinGpio} (${pins.digitalInput.component})`,
    `#define LUZ_PIN         ${lightGpio}   // ${pins.lighting.candidateBoardLabel} -> GPIO${lightGpio} (${pins.lighting.component})`,
    `#define SALIDA_DIG_PIN  ${doutGpio}  // ${pins.digitalOutput.candidateBoardLabel} (${pins.digitalOutput.component})`,
    ...(usesDht
      ? [
          '',
          '// --- Instancia del sensor DHT11 ---',
          '#define DHT_TYPE        DHT11',
          'DHT dht(DHT_PIN, DHT_TYPE);',
        ]
      : []),
    '',
    '// --- Prototipos de funciones ---',
    'int leerEntradaAnalogicaA0();',
    'int leerEntradaDigital();',
    'void relayOn();',
    'void relayOff();',
    'void luzOn();',
    'void luzOff();',
    'void activarSalidaDigital();',
    'void desactivarSalidaDigital();',
    ...(usesDht
      ? ['float leerTemperatura();', 'float leerHumedadAmbiente();']
      : []),
    ...(usesDataLog
      ? ['void registrarDato(const char* etiqueta, float valor);']
      : []),
    ...(usesWifi
      ? [
          'void conectarWiFi(const char* ssid, const char* pass);',
          'void enviarDatoIoT(const char* topico, float valor);',
        ]
      : []),
    '',
    compactCode,
    '',
    ...helperLines,
    '',
  ].join('\n');
}

/**
 * Construye el Sketch Completo (.ino) para Garden Node Bi-Tech (ESP32).
 */
function buildGardenNodeCompilableSketch(compactCode: string): string {
  const { pins } = GARDEN_NODE_CONFIG;
  const dhtGpio = pins.dht11.verifiedGpio ?? pins.dht11.candidateGpio ?? 4;
  const soilGpio =
    pins.soilMoisture.verifiedGpio ?? pins.soilMoisture.candidateGpio ?? 34;
  const ldrGpio = pins.ldr.verifiedGpio ?? pins.ldr.candidateGpio ?? 35;
  const pumpGpio =
    pins.relayChannel1Pump.verifiedGpio ??
    pins.relayChannel1Pump.candidateGpio ??
    26;
  const lightGpio =
    pins.relayChannel2Light.verifiedGpio ??
    pins.relayChannel2Light.candidateGpio ??
    27;

  return [
    '// ============================================================================',
    '// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)',
    `// Perfil: ${GARDEN_NODE_CONFIG.name} (${GARDEN_NODE_CONFIG.mcu})`,
    '// NOTA: Pines candidatos sujetos a validación física en placa.',
    '// ============================================================================',
    '',
    '#include <Arduino.h>',
    '',
    `#define DHT_PIN   ${dhtGpio}  // ${pins.dht11.candidateBoardLabel} -> GPIO${dhtGpio}`,
    `#define SUELO_PIN ${soilGpio} // ${pins.soilMoisture.candidateBoardLabel} -> GPIO${soilGpio}`,
    `#define LDR_PIN   ${ldrGpio} // ${pins.ldr.candidateBoardLabel} -> GPIO${ldrGpio}`,
    `#define BOMBA_PIN ${pumpGpio} // ${pins.relayChannel1Pump.candidateBoardLabel} -> GPIO${pumpGpio}`,
    `#define LUZ_PIN   ${lightGpio} // ${pins.relayChannel2Light.candidateBoardLabel} -> GPIO${lightGpio}`,
    '',
    'float leerTemperatura() { return 24.0f; }',
    'float leerHumedadAmbiente() { return 55.0f; }',
    'int leerHumedadSuelo() { return analogRead(SUELO_PIN); }',
    'int leerNivelLuz() { return analogRead(LDR_PIN); }',
    'void bombaOn() { digitalWrite(BOMBA_PIN, HIGH); }',
    'void bombaOff() { digitalWrite(BOMBA_PIN, LOW); }',
    'void luzOn() { digitalWrite(LUZ_PIN, HIGH); }',
    'void luzOff() { digitalWrite(LUZ_PIN, LOW); }',
    'void registrarDato(const char* etiqueta, float valor) {',
    '  Serial.print(etiqueta); Serial.print(": "); Serial.println(valor);',
    '}',
    'void enviarDatoIoT(const char* topico, float valor) {',
    '  Serial.print(topico); Serial.print(" -> "); Serial.println(valor);',
    '}',
    '',
    compactCode,
    '',
  ].join('\n');
}

/**
 * Construye el Sketch Completo (.ino) para Camera Node Bi-Tech (ESP32-CAM).
 */
function buildCameraNodeCompilableSketch(compactCode: string): string {
  return [
    '// ============================================================================',
    '// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)',
    `// Perfil: ${CAMERA_NODE_CONFIG.name} (${CAMERA_NODE_CONFIG.mcu})`,
    '// Canal programación: USB | Canal streaming: Wi-Fi',
    '// ============================================================================',
    '',
    '#include <Arduino.h>',
    '',
    'const char* WIFI_SSID = "Red_Escolar_BiTech";',
    'const char* WIFI_PASS = "pendiente_configuracion";',
    '',
    'void configurarCamara() {}',
    'void seleccionarResolucion(const char* resolucion) { (void)resolucion; }',
    'void configurarCalidad(int calidad) { (void)calidad; }',
    'void iniciarCamara() {}',
    'void conectarWiFi(const char* ssid, const char* pass) { (void)ssid; (void)pass; }',
    'void iniciarStreaming() {}',
    'void detenerStreaming() {}',
    'void tomarCaptura() {}',
    'bool estadoCamara() { return true; }',
    '',
    compactCode,
    '',
  ].join('\n');
}

/**
 * Genera tanto la Vista Educativa como el Sketch Completo Compilable (.ino)
 * a partir del programa estructurado (AST) y valida que los recursos solicitados
 * sean compatibles con las capacidades del dispositivo.
 */
export function generateArduinoCode(program: ParsedProgram): GeneratedArduinoOutput {
  const validationIssues = validateProgramAgainstCapabilities(program);
  const profile = getDeviceProfile(program.device);
  const rawLines: { code: string; blockId?: string }[] = [];

  const usedSensorsInLoop = new Set<SensorKey>();
  collectAllSensorsInStatements(program.loopStatements, usedSensorsInLoop);

  const allUsedSensors = new Set<SensorKey>(usedSensorsInLoop);
  collectAllSensorsInStatements(program.setupStatements, allUsedSensors);
  if (program.usedSensors) {
    for (const s of program.usedSensors) {
      allUsedSensors.add(s);
    }
  }

  if (validationIssues.length > 0) {
    rawLines.push({
      code: '// ⚠️ ADVERTENCIA PEDAGÓGICA DE HARDWARE:',
    });
    for (const issue of validationIssues) {
      rawLines.push({
        code: `// ${issue.message}`,
      });
    }
    rawLines.push({ code: '' });
  }

  if (profile.simulatorKind === 'garden-system') {
    const { relayChannel1Pump, relayChannel2Light } = GARDEN_NODE_CONFIG.pins;

    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    rawLines.push({
      code: `  pinMode(${relayChannel1Pump.symbolicName}, OUTPUT);`,
    });
    rawLines.push({
      code: `  pinMode(${relayChannel2Light.symbolicName}, OUTPUT);`,
    });
    if (program.setupStatements.length > 0) {
      emitStatementsC(program.setupStatements, '  ', false, rawLines);
    } else {
      rawLines.push({ code: '  bombaOff();' });
      rawLines.push({ code: '  luzOff();' });
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    for (const sensorKey of usedSensorsInLoop) {
      const meta = SENSOR_CODE_META[sensorKey];
      rawLines.push({
        code: `  ${meta.cType} ${meta.varName} = ${meta.funcCall};`,
      });
    }

    if (program.loopStatements.length === 0) {
      rawLines.push({
        code: '  // Construye tu programa arrastrando bloques aquí',
      });
    } else {
      emitStatementsC(program.loopStatements, '  ', true, rawLines);
    }

    rawLines.push({ code: '}' });
  } else if (profile.simulatorKind === 'nodemcu-system') {
    const { relay, lighting, digitalOutput, digitalInput } =
      NODEMCU_ESP8266_CONFIG.pins;

    const usesDhtInProgram =
      allUsedSensors.has('temperatura') || allUsedSensors.has('humedadAmbiente');

    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    rawLines.push({ code: `  pinMode(${relay.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${lighting.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${digitalOutput.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${digitalInput.symbolicName}, INPUT);` });
    if (usesDhtInProgram) {
      rawLines.push({ code: '  dht.begin();' });
    }
    rawLines.push({ code: '  Serial.println();' });
    rawLines.push({ code: '  Serial.println("Bi-Tech IoT Studio");' });
    rawLines.push({
      code: usesDhtInProgram
        ? '  Serial.println("DHT11 conectado");'
        : '  Serial.println("NodeMCU conectada");',
    });
    if (program.setupStatements.length > 0) {
      emitStatementsC(program.setupStatements, '  ', false, rawLines);
    } else if (!usesDhtInProgram) {
      rawLines.push({ code: '  relayOff();' });
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    for (const sensorKey of usedSensorsInLoop) {
      const meta = SENSOR_CODE_META[sensorKey];
      rawLines.push({
        code: `  ${meta.cType} ${meta.varName} = ${meta.funcCall};`,
      });
    }

    if (program.loopStatements.length === 0) {
      rawLines.push({
        code: '  // Construye tu programa para NodeMCU ESP8266 aquí',
      });
    } else {
      emitStatementsC(program.loopStatements, '  ', true, rawLines);
    }

    rawLines.push({ code: '}' });
  } else {
    // Camera Node Bi-Tech (ESP32-CAM)
    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    if (program.setupStatements.length === 0) {
      rawLines.push({ code: '  configurarCamara();' });
      rawLines.push({
        code: `  seleccionarResolucion("${CAMERA_NODE_CONFIG.defaultResolution}");`,
      });
      rawLines.push({
        code: `  configurarCalidad(${CAMERA_NODE_CONFIG.defaultQuality});`,
      });
      rawLines.push({ code: '  iniciarCamara();' });
    } else {
      emitStatementsC(program.setupStatements, '  ', false, rawLines);
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });
    if (program.loopStatements.length === 0) {
      rawLines.push({ code: '  // Bloques repetitivos de Camera Node' });
    } else {
      emitStatementsC(program.loopStatements, '  ', false, rawLines);
    }
    rawLines.push({ code: '}' });
  }

  const lines: CodeLineMapping[] = rawLines.map((item, idx) => ({
    lineNumber: idx + 1,
    code: item.code,
    blockId: item.blockId,
  }));

  const compactCode = lines.map((l) => l.code).join('\n');

  let headerAndHelpers: string;
  let compilableSketch: string;

  if (profile.simulatorKind === 'garden-system') {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · VISTA EDUCATIVA · Garden Node Bi-Tech (ESP32)',
      '// NOTA: Los pines GPIO son simbólicos hasta su validación física en laboratorio.',
      '// Estado seguro inicial de actuadores: Bomba OFF · Iluminación OFF',
      '// ============================================================================',
      '',
      compactCode,
    ].join('\n');
    compilableSketch = buildGardenNodeCompilableSketch(compactCode);
  } else if (profile.simulatorKind === 'nodemcu-system') {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · VISTA EDUCATIVA · NodeMCU (ESP8266)',
      '// Capacidad física: 9 GPIO digitales (D0-D8) + 1 ADC A0 (0-1023).',
      `// adcInputVoltageRange: ${NODEMCU_ESP8266_CONFIG.capabilities.adcInputVoltageRange} · Mapeo candidato: D1 -> GPIO5 (Relay)`,
      '// ============================================================================',
      '',
      compactCode,
    ].join('\n');
    compilableSketch = buildNodeMcuCompilableSketch(
      program,
      compactCode,
      allUsedSensors
    );
  } else {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · VISTA EDUCATIVA · Camera Node Bi-Tech (ESP32-CAM · OV2640)',
      '// Canal de programación: USB | Canal de comunicación y streaming: Wi-Fi',
      '// ============================================================================',
      '',
      compactCode,
    ].join('\n');
    compilableSketch = buildCameraNodeCompilableSketch(compactCode);
  }

  return {
    fullCode: headerAndHelpers,
    compactCode,
    compilableSketch,
    lines,
    validationIssues,
  };
}
