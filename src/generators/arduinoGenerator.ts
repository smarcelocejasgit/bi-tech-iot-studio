import { CAMERA_NODE_CONFIG } from '../hardware/cameraNodeConfig';
import { GARDEN_NODE_CONFIG } from '../hardware/gardenNodeConfig';
import {
  getDeviceProfile,
  resolveInputPin,
} from '../hardware/hardwareCapabilities';
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
  useLocalVars: boolean,
  device: ParsedProgram['device']
): string {
  if (!expr) return '0';
  if (expr.kind === 'number_literal') {
    return String(expr.value);
  }
  if (expr.kind === 'sensor_read') {
    return formatSensorReadC(expr.sensor, expr.pin, useLocalVars, device);
  }
  if (expr.kind === 'math_op') {
    return `(${formatNumericExprC(expr.left, useLocalVars, device)} ${expr.operator} ${
      expr.rightNumber
    })`;
  }
  return '0';
}

function inputKindForSensor(
  sensor: SensorKey
): 'analog' | 'digital' | null {
  if (sensor === 'entradaAnalogicaA0') return 'analog';
  if (sensor === 'entradaDigital') return 'digital';
  return null;
}

function formatSensorReadC(
  sensor: SensorKey,
  pin: string | undefined,
  useLocalVars: boolean,
  device: ParsedProgram['device']
): string {
  const kind = inputKindForSensor(sensor);
  if (kind) {
    const resolved = resolveInputPin(device, kind, pin);
    if (!resolved) return '0';
    const readFunction = kind === 'analog' ? 'analogRead' : 'digitalRead';
    return `${readFunction}(${resolved.arduinoExpression})`;
  }
  return useLocalVars
    ? SENSOR_CODE_META[sensor].varName
    : SENSOR_CODE_META[sensor].funcCall;
}

function formatConditionC(
  cond: ConditionNode | null,
  useLocalVars: boolean,
  device: ParsedProgram['device']
): string {
  if (!cond) return 'false';
  if (cond.kind === 'comparison') {
    let left: string;
    if (cond.leftExpr) {
      left = formatNumericExprC(cond.leftExpr, useLocalVars, device);
    } else if (cond.leftSensor) {
      left = formatSensorReadC(
        cond.leftSensor,
        cond.leftPin,
        useLocalVars,
        device
      );
    } else {
      left = String(cond.leftNumber ?? 0);
    }
    return `${left} ${cond.operator} ${cond.rightNumber}`;
  }
  if (cond.kind === 'logical') {
    const op = cond.operator === 'AND' ? '&&' : '||';
    return `(${formatConditionC(cond.left, useLocalVars, device)} ${op} ${formatConditionC(
      cond.right,
      useLocalVars,
      device
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

function findBiTechChannel(stmts: StatementNode[]): {
  channel: number;
  blockId?: string;
} | null {
  for (const statement of stmts) {
    if (statement.kind === 'iot_connect_channel') {
      return {
        channel: Math.min(9, Math.max(1, Math.round(statement.channel))),
        blockId: statement.blockId,
      };
    }
    if (statement.kind === 'if') {
      const nested =
        findBiTechChannel(statement.thenBranch) ??
        findBiTechChannel(statement.elseBranch ?? []);
      if (nested) return nested;
    }
  }
  return null;
}

interface WifiCredentials {
  ssid: string;
  password: string;
}

function findWifiCredentials(stmts: StatementNode[]): WifiCredentials | null {
  for (const statement of stmts) {
    if (statement.kind === 'cam_wifi') {
      return { ssid: statement.ssid, password: statement.password };
    }
    if (statement.kind === 'if') {
      const nested =
        findWifiCredentials(statement.thenBranch) ??
        findWifiCredentials(statement.elseBranch ?? []);
      if (nested) return nested;
    }
  }
  return null;
}

function escapeArduinoString(value: string): string {
  return Array.from(value, (character) => {
    switch (character) {
      case '\\':
        return '\\\\';
      case '"':
        return '\\"';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\t':
        return '\\t';
      default: {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127
          ? `\\${code.toString(8).padStart(3, '0')}`
          : character;
      }
    }
  }).join('');
}

function wifiCredentialLines(program: ParsedProgram): string[] {
  const credentials =
    findWifiCredentials(program.setupStatements) ??
    findWifiCredentials(program.loopStatements);
  const ssid = credentials?.ssid || 'SSID_PENDIENTE_CONFIGURACION';
  const password =
    credentials?.password || 'PASSWORD_PENDIENTE_CONFIGURACION';

  return [
    '// --- Credenciales Wi-Fi definidas por el bloque conectar a Wi-Fi ---',
    `const char* WIFI_SSID = "${escapeArduinoString(ssid)}";`,
    `const char* WIFI_PASSWORD = "${escapeArduinoString(password)}";`,
  ];
}

function collectInputPinsFromExpression(
  expression: NumericExpressionNode | undefined,
  device: ParsedProgram['device'],
  pins: Map<string, string>
): void {
  if (!expression) return;
  if (expression.kind === 'sensor_read') {
    const kind = inputKindForSensor(expression.sensor);
    if (!kind) return;
    const resolved = resolveInputPin(device, kind, expression.pin);
    if (resolved) pins.set(`${kind}:${resolved.id}`, resolved.arduinoExpression);
    return;
  }
  if (expression.kind === 'math_op') {
    collectInputPinsFromExpression(expression.left, device, pins);
  }
}

function collectInputPinsFromCondition(
  condition: ConditionNode | null,
  device: ParsedProgram['device'],
  pins: Map<string, string>
): void {
  if (!condition) return;
  if (condition.kind === 'comparison') {
    collectInputPinsFromExpression(condition.leftExpr, device, pins);
    if (condition.leftSensor) {
      const kind = inputKindForSensor(condition.leftSensor);
      const resolved = kind
        ? resolveInputPin(device, kind, condition.leftPin)
        : null;
      if (kind && resolved) {
        pins.set(`${kind}:${resolved.id}`, resolved.arduinoExpression);
      }
    }
    return;
  }
  if (condition.kind === 'logical') {
    collectInputPinsFromCondition(condition.left, device, pins);
    collectInputPinsFromCondition(condition.right, device, pins);
  }
}

function collectSelectedInputPins(
  statements: StatementNode[],
  device: ParsedProgram['device'],
  pins: Map<string, string>
): void {
  for (const statement of statements) {
    if (statement.kind === 'data_log' || statement.kind === 'iot_publish') {
      const kind = inputKindForSensor(statement.sensor);
      const resolved = kind
        ? resolveInputPin(device, kind, statement.pin)
        : null;
      if (kind && resolved) {
        pins.set(`${kind}:${resolved.id}`, resolved.arduinoExpression);
      }
    } else if (statement.kind === 'if') {
      collectInputPinsFromCondition(statement.condition, device, pins);
      collectSelectedInputPins(statement.thenBranch, device, pins);
      collectSelectedInputPins(statement.elseBranch ?? [], device, pins);
    }
  }
}

function inputPinModeLines(program: ParsedProgram): string[] {
  const pins = new Map<string, string>();
  collectSelectedInputPins(program.setupStatements, program.device, pins);
  collectSelectedInputPins(program.loopStatements, program.device, pins);
  return Array.from(pins.values()).map(
    (arduinoExpression) => `  pinMode(${arduinoExpression}, INPUT);`
  );
}

function emitStatementsC(
  stmts: StatementNode[],
  indent: string,
  useLocalVars: boolean,
  out: { code: string; blockId?: string }[],
  device: ParsedProgram['device']
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
        const condStr = formatConditionC(st.condition, useLocalVars, device);
        out.push({ code: `${indent}if (${condStr}) {`, blockId: st.blockId });
        if (st.thenBranch.length === 0) {
          out.push({
            code: `${indent}  // Agrega bloques de acción aquí`,
            blockId: st.blockId,
          });
        } else {
          emitStatementsC(
            st.thenBranch,
            `${indent}  `,
            useLocalVars,
            out,
            device
          );
        }
        if (st.elseBranch && st.elseBranch.length > 0) {
          out.push({ code: `${indent}} else {`, blockId: st.blockId });
          emitStatementsC(
            st.elseBranch,
            `${indent}  `,
            useLocalVars,
            out,
            device
          );
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
          code: `${indent}conectarWiFi(WIFI_SSID, WIFI_PASSWORD);`,
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
        const valExpr = formatSensorReadC(
          st.sensor,
          st.pin,
          useLocalVars,
          device
        );
        out.push({
          code: `${indent}registrarDato("${st.label}", ${valExpr});`,
          blockId: st.blockId,
        });
        break;
      }
      case 'iot_connect_channel':
        out.push({
          code: `${indent}conectarSmartGardenLab(BITECH_CHANNEL);`,
          blockId: st.blockId,
        });
        break;
      case 'iot_publish': {
        const valExpr = formatSensorReadC(
          st.sensor,
          st.pin,
          useLocalVars,
          device
        );
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
      || st.kind === 'iot_connect_channel'
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
    'int leerHumedadSuelo() {',
    '  // En NodeMCU ESP8266 el sensor analógico de humedad de suelo se conecta al único canal A0 (0 - 1023).',
    '  return analogRead(ANALOG_A0_PIN);',
    '}',
    '',
    'int leerNivelLuz() {',
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
      '  if (strstr(etiqueta, "suelo") != NULL || strstr(etiqueta, "Suelo") != NULL || strstr(etiqueta, "A0") != NULL) {',
      '    Serial.println((int)valor);',
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
      'void conectarWiFi(const char* ssid, const char* pass) {',
      '  WiFi.mode(WIFI_STA);',
      '  WiFi.begin(ssid, pass);',
      '}',
      '',
      'void conectarSmartGardenLab(uint8_t canal) {',
      '  Serial.print("[BI-TECH] Canal Smart Garden Lab: ");',
      '  Serial.println(canal);',
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
    ...(usesWifi ? ['', ...wifiCredentialLines(program)] : []),
    '',
    '// --- Prototipos de funciones ---',
    'int leerEntradaAnalogicaA0();',
    'int leerHumedadSuelo();',
    'int leerNivelLuz();',
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
          'void conectarSmartGardenLab(uint8_t canal);',
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
function buildGardenNodeCompilableSketch(
  program: ParsedProgram,
  compactCode: string
): string {
  const allStatements = [...program.setupStatements, ...program.loopStatements];
  const usesWifi = hasStatementKind(
    allStatements,
    (statement) =>
      statement.kind === 'cam_wifi' ||
      statement.kind === 'iot_publish' ||
      statement.kind === 'iot_connect_channel'
  );
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
    ...(usesWifi ? ['#include <WiFi.h>'] : []),
    '',
    `#define DHT_PIN   ${dhtGpio}  // ${pins.dht11.candidateBoardLabel} -> GPIO${dhtGpio}`,
    `#define SUELO_PIN ${soilGpio} // ${pins.soilMoisture.candidateBoardLabel} -> GPIO${soilGpio}`,
    `#define LDR_PIN   ${ldrGpio} // ${pins.ldr.candidateBoardLabel} -> GPIO${ldrGpio}`,
    `#define BOMBA_PIN ${pumpGpio} // ${pins.relayChannel1Pump.candidateBoardLabel} -> GPIO${pumpGpio}`,
    `#define LUZ_PIN   ${lightGpio} // ${pins.relayChannel2Light.candidateBoardLabel} -> GPIO${lightGpio}`,
    ...(usesWifi ? ['', ...wifiCredentialLines(program)] : []),
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
    'void conectarSmartGardenLab(uint8_t canal) {',
    '  Serial.print("[BI-TECH] Canal Smart Garden Lab: ");',
    '  Serial.println(canal);',
    '}',
    ...(usesWifi
      ? [
          'void conectarWiFi(const char* ssid, const char* password) {',
          '  WiFi.mode(WIFI_STA);',
          '  WiFi.begin(ssid, password);',
          '}',
        ]
      : []),
    '',
    compactCode,
    '',
  ].join('\n');
}

/**
 * Construye el Sketch Completo (.ino) compilable para Camera Node Bi-Tech (ESP32-CAM · OV2640).
 * Soporta configuración de cámara, resolución, calidad JPEG, inicialización OV2640,
 * conexión Wi-Fi con placeholders seguros, servidor HTTP MJPEG de streaming y captura de fotogramas.
 */
function buildCameraNodeCompilableSketch(
  program: ParsedProgram,
  compactCode: string
): string {
  return [
    '// ============================================================================',
    '// BI-TECH IoT STUDIO · SKETCH COMPILABLE PARA HARDWARE REAL (.ino)',
    `// Perfil: ${CAMERA_NODE_CONFIG.name} (${CAMERA_NODE_CONFIG.mcu} · ${CAMERA_NODE_CONFIG.sensor})`,
    `// FQBN candidato de compilación: ${CAMERA_NODE_CONFIG.candidateFqbn}`,
    `// Supuesto de modelo: ${CAMERA_NODE_CONFIG.boardModelAssumption}`,
    '// Canal programación: USB | Canal streaming: Wi-Fi',
    '// Credenciales Wi-Fi: definidas por el bloque y ocultas por defecto en la interfaz',
    '// ============================================================================',
    '',
    '#include <Arduino.h>',
    '#include <WiFi.h>',
    '#include "esp_camera.h"',
    '#include "esp_http_server.h"',
    '',
    ...wifiCredentialLines(program),
    '',
    '// --- Mapa de pines candidato: AI-Thinker ESP32-CAM (OV2640) ---',
    '// NOTA: Sujeto a verificación física al conectar la placa en V0.4B.',
    '#define PWDN_GPIO_NUM     32',
    '#define RESET_GPIO_NUM    -1',
    '#define XCLK_GPIO_NUM      0',
    '#define SIOD_GPIO_NUM     26',
    '#define SIOC_GPIO_NUM     27',
    '#define Y9_GPIO_NUM       35',
    '#define Y8_GPIO_NUM       34',
    '#define Y7_GPIO_NUM       39',
    '#define Y6_GPIO_NUM       36',
    '#define Y5_GPIO_NUM       21',
    '#define Y4_GPIO_NUM       19',
    '#define Y3_GPIO_NUM       18',
    '#define Y2_GPIO_NUM        5',
    '#define VSYNC_GPIO_NUM    25',
    '#define HREF_GPIO_NUM     23',
    '#define PCLK_GPIO_NUM     22',
    '',
    '// --- Prototipos de funciones ---',
    'void configurarCamara();',
    'void seleccionarResolucion(const char* resolucion);',
    'void configurarCalidad(int calidad);',
    'void iniciarCamara();',
    'void conectarWiFi(const char* ssid, const char* pass);',
    'void iniciarStreaming();',
    'void detenerStreaming();',
    'void tomarCaptura();',
    'bool estadoCamara();',
    '',
    compactCode,
    '',
    '// ============================================================================',
    '// FUNCIONES AUXILIARES DE HARDWARE (Implementación compilable ESP32-CAM)',
    '// ============================================================================',
    '',
    'static camera_config_t cameraConfig;',
    'static bool cameraConfigured = false;',
    'static bool cameraInitialized = false;',
    'static httpd_handle_t streamHttpd = NULL;',
    '',
    'static framesize_t mapearResolucion(const char* resolucion) {',
    '  if (strstr(resolucion, "QVGA") != NULL) return FRAMESIZE_QVGA;',
    '  if (strstr(resolucion, "CIF") != NULL)  return FRAMESIZE_CIF;',
    '  if (strstr(resolucion, "VGA") != NULL && strstr(resolucion, "SVGA") == NULL) return FRAMESIZE_VGA;',
    '  if (strstr(resolucion, "XGA") != NULL)  return FRAMESIZE_XGA;',
    '  return FRAMESIZE_SVGA;',
    '}',
    '',
    'void configurarCamara() {',
    '  cameraConfig.ledc_channel = LEDC_CHANNEL_0;',
    '  cameraConfig.ledc_timer = LEDC_TIMER_0;',
    '  cameraConfig.pin_d0 = Y2_GPIO_NUM;',
    '  cameraConfig.pin_d1 = Y3_GPIO_NUM;',
    '  cameraConfig.pin_d2 = Y4_GPIO_NUM;',
    '  cameraConfig.pin_d3 = Y5_GPIO_NUM;',
    '  cameraConfig.pin_d4 = Y6_GPIO_NUM;',
    '  cameraConfig.pin_d5 = Y7_GPIO_NUM;',
    '  cameraConfig.pin_d6 = Y8_GPIO_NUM;',
    '  cameraConfig.pin_d7 = Y9_GPIO_NUM;',
    '  cameraConfig.pin_xclk = XCLK_GPIO_NUM;',
    '  cameraConfig.pin_pclk = PCLK_GPIO_NUM;',
    '  cameraConfig.pin_vsync = VSYNC_GPIO_NUM;',
    '  cameraConfig.pin_href = HREF_GPIO_NUM;',
    '  cameraConfig.pin_sccb_sda = SIOD_GPIO_NUM;',
    '  cameraConfig.pin_sccb_scl = SIOC_GPIO_NUM;',
    '  cameraConfig.pin_pwdn = PWDN_GPIO_NUM;',
    '  cameraConfig.pin_reset = RESET_GPIO_NUM;',
    '  cameraConfig.xclk_freq_hz = 20000000;',
    '  cameraConfig.pixel_format = PIXFORMAT_JPEG;',
    '  cameraConfig.frame_size = FRAMESIZE_SVGA;',
    '  cameraConfig.jpeg_quality = 10;',
    '  cameraConfig.fb_count = psramFound() ? 2 : 1;',
    '  cameraConfigured = true;',
    '}',
    '',
    'void seleccionarResolucion(const char* resolucion) {',
    '  if (!cameraConfigured) configurarCamara();',
    '  framesize_t fs = mapearResolucion(resolucion);',
    '  cameraConfig.frame_size = fs;',
    '  if (cameraInitialized) {',
    '    sensor_t* s = esp_camera_sensor_get();',
    '    if (s != NULL) s->set_framesize(s, fs);',
    '  }',
    '}',
    '',
    'void configurarCalidad(int calidad) {',
    '  if (!cameraConfigured) configurarCamara();',
    '  int q = calidad < 10 ? 10 : (calidad > 63 ? 63 : calidad);',
    '  cameraConfig.jpeg_quality = q;',
    '  if (cameraInitialized) {',
    '    sensor_t* s = esp_camera_sensor_get();',
    '    if (s != NULL) s->set_quality(s, q);',
    '  }',
    '}',
    '',
    'void iniciarCamara() {',
    '  if (!cameraConfigured) configurarCamara();',
    '  esp_err_t err = esp_camera_init(&cameraConfig);',
    '  if (err != ESP_OK) {',
    '    Serial.printf("Camera init error: 0x%x\\n", err);',
    '    cameraInitialized = false;',
    '    return;',
    '  }',
    '  cameraInitialized = true;',
    '  Serial.println("Camera ready");',
    '}',
    '',
    'void conectarWiFi(const char* ssid, const char* pass) {',
    '  if (strcmp(ssid, "SSID_PENDIENTE_CONFIGURACION") == 0) {',
    '    Serial.println("WiFi placeholder activo: configurar SSID y PASS antes de la prueba fisica.");',
    '    return;',
    '  }',
    '  WiFi.mode(WIFI_STA);',
    '  WiFi.begin(ssid, pass);',
    '  Serial.print("Connecting to WiFi");',
    '  int intentos = 0;',
    '  while (WiFi.status() != WL_CONNECTED && intentos < 30) {',
    '    delay(500);',
    '    Serial.print(".");',
    '    intentos++;',
    '  }',
    '  Serial.println();',
    '  if (WiFi.status() == WL_CONNECTED) {',
    '    Serial.println("WiFi connected");',
    '    Serial.print("IP: ");',
    '    Serial.println(WiFi.localIP());',
    '  } else {',
    '    Serial.println("WiFi connection timeout");',
    '  }',
    '}',
    '',
    'static esp_err_t captureHandler(httpd_req_t* req) {',
    '  camera_fb_t* fb = esp_camera_fb_get();',
    '  if (!fb) {',
    '    httpd_resp_send_500(req);',
    '    return ESP_FAIL;',
    '  }',
    '  httpd_resp_set_type(req, "image/jpeg");',
    '  esp_err_t res = httpd_resp_send(req, (const char*)fb->buf, fb->len);',
    '  esp_camera_fb_return(fb);',
    '  return res;',
    '}',
    '',
    'void iniciarStreaming() {',
    '  if (!cameraInitialized || streamHttpd != NULL) return;',
    '  httpd_config_t config = HTTPD_DEFAULT_CONFIG();',
    '  if (httpd_start(&streamHttpd, &config) == ESP_OK) {',
    '    httpd_uri_t captureUri = {',
    '      .uri       = "/capture",',
    '      .method    = HTTP_GET,',
    '      .handler   = captureHandler,',
    '      .user_ctx  = NULL',
    '    };',
    '    httpd_register_uri_handler(streamHttpd, &captureUri);',
    '    Serial.println("Streaming started");',
    '  }',
    '}',
    '',
    'void detenerStreaming() {',
    '  if (streamHttpd != NULL) {',
    '    httpd_stop(streamHttpd);',
    '    streamHttpd = NULL;',
    '    Serial.println("Streaming stopped");',
    '  }',
    '}',
    '',
    'void tomarCaptura() {',
    '  if (!cameraInitialized) return;',
    '  camera_fb_t* fb = esp_camera_fb_get();',
    '  if (!fb) {',
    '    Serial.println("Capture failed");',
    '    return;',
    '  }',
    '  Serial.printf("Capture OK (%u bytes)\\n", (unsigned int)fb->len);',
    '  esp_camera_fb_return(fb);',
    '}',
    '',
    'bool estadoCamara() {',
    '  return cameraInitialized;',
    '}',
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
  const selectedChannel = findBiTechChannel([
    ...program.setupStatements,
    ...program.loopStatements,
  ]);

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

  if (selectedChannel) {
    rawLines.push({
      code: `const uint8_t BITECH_CHANNEL = ${selectedChannel.channel};`,
      blockId: selectedChannel.blockId,
    });
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
    inputPinModeLines(program).forEach((code) => rawLines.push({ code }));
    if (program.setupStatements.length > 0) {
      emitStatementsC(
        program.setupStatements,
        '  ',
        false,
        rawLines,
        program.device
      );
    } else {
      rawLines.push({ code: '  bombaOff();' });
      rawLines.push({ code: '  luzOff();' });
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    for (const sensorKey of usedSensorsInLoop) {
      if (inputKindForSensor(sensorKey)) continue;
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
      emitStatementsC(
        program.loopStatements,
        '  ',
        true,
        rawLines,
        program.device
      );
    }

    rawLines.push({ code: '}' });
  } else if (profile.simulatorKind === 'nodemcu-system') {
    const { relay, lighting, digitalOutput } =
      NODEMCU_ESP8266_CONFIG.pins;

    const usesDhtInProgram =
      allUsedSensors.has('temperatura') || allUsedSensors.has('humedadAmbiente');

    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    rawLines.push({ code: `  pinMode(${relay.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${lighting.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${digitalOutput.symbolicName}, OUTPUT);` });
    inputPinModeLines(program).forEach((code) => rawLines.push({ code }));
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
      emitStatementsC(
        program.setupStatements,
        '  ',
        false,
        rawLines,
        program.device
      );
    } else if (!usesDhtInProgram) {
      rawLines.push({ code: '  relayOff();' });
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    for (const sensorKey of usedSensorsInLoop) {
      if (inputKindForSensor(sensorKey)) continue;
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
      emitStatementsC(
        program.loopStatements,
        '  ',
        true,
        rawLines,
        program.device
      );
    }

    rawLines.push({ code: '}' });
  } else {
    // Camera Node Bi-Tech (ESP32-CAM)
    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    if (program.setupStatements.length > 0) {
      emitStatementsC(
        program.setupStatements,
        '  ',
        false,
        rawLines,
        program.device
      );
    } else if (program.loopStatements.length > 0) {
      rawLines.push({ code: '  configurarCamara();' });
      rawLines.push({
        code: `  seleccionarResolucion("${CAMERA_NODE_CONFIG.defaultResolution}");`,
      });
      rawLines.push({
        code: `  configurarCalidad(${CAMERA_NODE_CONFIG.defaultQuality});`,
      });
      rawLines.push({ code: '  iniciarCamara();' });
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });
    if (program.loopStatements.length === 0) {
      rawLines.push({
        code: '  // Construye tu programa arrastrando bloques aquí',
      });
    } else {
      emitStatementsC(
        program.loopStatements,
        '  ',
        false,
        rawLines,
        program.device
      );
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
    compilableSketch = buildGardenNodeCompilableSketch(program, compactCode);
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
    compilableSketch = buildCameraNodeCompilableSketch(program, compactCode);
  }

  return {
    fullCode: headerAndHelpers,
    compactCode,
    compilableSketch,
    lines,
    validationIssues,
  };
}
