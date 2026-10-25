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
        const call = SENSOR_CODE_META[st.sensor].funcCall;
        out.push({
          code: `${indent}registrarDato("${st.label}", ${call});`,
          blockId: st.blockId,
        });
        break;
      }
      case 'iot_publish': {
        const call = SENSOR_CODE_META[st.sensor].funcCall;
        out.push({
          code: `${indent}enviarDatoIoT("${st.topic}", ${call});`,
          blockId: st.blockId,
        });
        break;
      }
    }
  }
}

/**
 * Genera el código Arduino C/C++ educativo a partir del programa estructurado (AST)
 * y valida que los recursos solicitados sean compatibles con las capacidades del dispositivo.
 */
export function generateArduinoCode(program: ParsedProgram): GeneratedArduinoOutput {
  const validationIssues = validateProgramAgainstCapabilities(program);
  const profile = getDeviceProfile(program.device);
  const rawLines: { code: string; blockId?: string }[] = [];

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
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    const usedSensors = new Set<SensorKey>();
    collectAllSensorsInStatements(program.loopStatements, usedSensors);

    for (const sensorKey of usedSensors) {
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

    rawLines.push({ code: 'void setup() {' });
    rawLines.push({ code: '  Serial.begin(115200);' });
    rawLines.push({ code: `  pinMode(${relay.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${lighting.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${digitalOutput.symbolicName}, OUTPUT);` });
    rawLines.push({ code: `  pinMode(${digitalInput.symbolicName}, INPUT);` });
    if (program.setupStatements.length > 0) {
      emitStatementsC(program.setupStatements, '  ', false, rawLines);
    }
    rawLines.push({ code: '}' });
    rawLines.push({ code: '' });
    rawLines.push({ code: 'void loop() {' });

    const usedSensors = new Set<SensorKey>();
    collectAllSensorsInStatements(program.loopStatements, usedSensors);

    for (const sensorKey of usedSensors) {
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
  if (profile.simulatorKind === 'garden-system') {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · Dispositivo: Garden Node Bi-Tech (ESP32)',
      '// NOTA: Los pines GPIO son simbólicos hasta su validación física en laboratorio.',
      '// Estado seguro inicial de actuadores: Bomba OFF · Iluminación OFF',
      '// ============================================================================',
      '',
      `// Configuración centralizada (${GARDEN_NODE_CONFIG.name})`,
      '// #define DHT_PIN   <GPIO_PENDIENTE_VERIFICACION>',
      '// #define SUELO_PIN <ADC1_PENDIENTE_VERIFICACION>',
      '// #define LDR_PIN   <ADC1_PENDIENTE_VERIFICACION>',
      '// #define BOMBA_PIN <GPIO_PENDIENTE_VERIFICACION>',
      '// #define LUZ_PIN   <GPIO_PENDIENTE_VERIFICACION>',
      '',
      'float leerTemperatura();',
      'float leerHumedadAmbiente();',
      'int leerHumedadSuelo();',
      'int leerNivelLuz();',
      'void bombaOn();',
      'void bombaOff();',
      'void luzOn();',
      'void luzOff();',
      '',
      compactCode,
    ].join('\n');
  } else if (profile.simulatorKind === 'nodemcu-system') {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · Dispositivo: NodeMCU (ESP8266)',
      '// Capacidades: 1 entrada analógica (A0: 0-1023), E/S digitales, DHT11, Relay, Wi-Fi.',
      '// NOTA: Los pines GPIO son simbólicos hasta su validación en placa física.',
      '// Estado seguro inicial: Relay OFF · Iluminación OFF · Salida Digital LOW',
      '// ============================================================================',
      '',
      '// #include <ESP8266WiFi.h>',
      '// #define DHT_PIN         <GPIO_PENDIENTE_VERIFICACION>',
      '// #define ANALOG_A0_PIN   A0',
      '// #define ENTRADA_DIG_PIN <GPIO_PENDIENTE_VERIFICACION>',
      '// #define SALIDA_DIG_PIN  <GPIO_PENDIENTE_VERIFICACION>',
      '// #define RELAY_PIN       <GPIO_PENDIENTE_VERIFICACION>',
      '// #define LUZ_PIN         <GPIO_PENDIENTE_VERIFICACION>',
      '',
      'float leerTemperatura();',
      'float leerHumedadAmbiente();',
      'int leerEntradaAnalogicaA0();',
      'int leerEntradaDigital();',
      'void relayOn();',
      'void relayOff();',
      'void luzOn();',
      'void luzOff();',
      'void activarSalidaDigital();',
      'void desactivarSalidaDigital();',
      '',
      compactCode,
    ].join('\n');
  } else {
    headerAndHelpers = [
      '// ============================================================================',
      '// BI-TECH IoT STUDIO · Dispositivo: Camera Node Bi-Tech (ESP32-CAM · OV2640)',
      '// Canal de programación: USB | Canal de comunicación y streaming: Wi-Fi',
      '// NOTA: Credenciales Wi-Fi y endpoint de streaming se configuran localmente.',
      '// ============================================================================',
      '',
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
    ].join('\n');
  }

  return {
    fullCode: headerAndHelpers,
    compactCode,
    lines,
    validationIssues,
  };
}
