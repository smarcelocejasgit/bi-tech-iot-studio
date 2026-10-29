import { getDeviceProfile } from '../hardware/hardwareCapabilities';
import { DeviceProfileId } from '../types/hardware';
import { ContextualManualEntry } from '../types/studio';

export const CONTEXTUAL_MANUAL_ENTRIES: Record<string, ContextualManualEntry> = {
  bitech_on_start: {
    blockType: 'bitech_on_start',
    title: 'Al iniciar (setup)',
    category: 'inicio',
    previewLabel: '▶ al iniciar',
    previewColor: '#109856',
    description:
      'Ejecuta una sola vez las instrucciones iniciales cuando se enciende o reinicia el microcontrolador. Prepara la comunicación serie y deja los actuadores en estado seguro (APAGADOS).',
    physicalComponent: 'Microcontrolador (ESP32 / ESP32-CAM / NodeMCU ESP8266)',
    dataUsed:
      'Configuración de pines de entrada/salida y velocidad del puerto serie (115200 baudios)',
    dataType: 'Estructura de control inicial (void setup)',
    behavior:
      'Configura los pines simbólicos como entradas o salidas y garantiza que relés, bombas o luces comiencen apagados.',
    arduinoCode:
      'void setup() {\n  Serial.begin(115200);\n  pinMode(RELAY_PIN, OUTPUT);\n  pinMode(LUZ_PIN, OUTPUT);\n}',
    technicalNotes:
      'En sistemas reales de automatización, inicializar los relés en OFF evita activaciones accidentales al energizar la placa.',
  },

  bitech_forever: {
    blockType: 'bitech_forever',
    title: 'Repetir siempre (loop)',
    category: 'inicio',
    previewLabel: '↻ repetir siempre',
    previewColor: '#9b3df5',
    description:
      'Todo lo que coloques dentro de este bloque se repite de manera continua mientras el dispositivo esté encendido. Es el corazón del control automático.',
    physicalComponent: 'Procesador principal del microcontrolador',
    dataUsed:
      'Ciclo continuo de lectura de sensores, evaluación lógica y control de actuadores',
    dataType: 'Ciclo infinito (void loop)',
    behavior:
      'Lee sensores actualizados en cada vuelta del ciclo, evalúa las condiciones "si / entonces" y actualiza los actuadores.',
    arduinoCode:
      'void loop() {\n  // Instrucciones que se repiten continuamente\n}',
    technicalNotes:
      'En ESP8266 (NodeMCU), el ciclo loop() también cede tiempo al stack Wi-Fi interno en cada iteración o llamada a delay().',
  },

  bitech_wait: {
    blockType: 'bitech_wait',
    title: 'Esperar segundos (delay)',
    category: 'inicio',
    previewLabel: '🕒 esperar 5 segundos',
    previewColor: '#2573e8',
    description:
      'Detiene temporalmente la ejecución del programa durante la cantidad de segundos indicada antes de pasar al siguiente bloque.',
    physicalComponent: 'Temporizador interno del microcontrolador',
    dataUsed: 'Tiempo en segundos (convertido a milisegundos en Arduino C/C++)',
    dataType: 'Numérico entero (milisegundos, ej. 5 s = 5000 ms)',
    behavior:
      'Mantiene el estado actual de los actuadores durante los segundos configurados antes de continuar.',
    arduinoCode: 'delay(5000);',
    technicalNotes:
      'En Arduino C/C++, la función delay() recibe milisegundos: 1 segundo equivale a 1000 milisegundos.',
  },

  bitech_if_sensor_compare: {
    blockType: 'bitech_if_sensor_compare',
    title: 'Condicional: Si [sensor] [comparador] [valor] entonces',
    category: 'control',
    previewLabel: '💧 si [ humedad del suelo ] [ < ] [ 30 ] entonces',
    previewColor: '#2e8af7',
    description:
      'Este bloque lee el valor de un sensor y compara si cumple la condición (por ejemplo, menor que un umbral). Si la condición se cumple, ejecuta los bloques que están dentro.',
    physicalComponent: 'Unidad lógica del microcontrolador + Sensor seleccionado',
    dataUsed: 'Lectura actual del sensor comparada contra un valor umbral numérico',
    dataType: 'Booleano (verdadero / falso)',
    behavior:
      'Sirve para tomar decisiones automáticas según los datos de los sensores o para controlar actuadores.',
    arduinoCode:
      'int suelo = leerHumedadSuelo();\nif (suelo < 30) {\n  // acciones si se cumple\n}',
    technicalNotes:
      'Expresa de forma visible la cadena pedagógica: sensor → dato → comparación → decisión → actuación.',
    deviceNotes: {
      'nodemcu-esp8266':
        'NodeMCU dispone de recursos diferentes a ESP32: posee solo 1 entrada analógica (A0). Si combinas dos sensores analógicos distintos en tus condicionales, el entorno te mostrará una advertencia de hardware.',
    },
  },

  bitech_if_else: {
    blockType: 'bitech_if_else',
    title: 'Condicional doble: Si / Entonces / Si no',
    category: 'control',
    previewLabel: '🔀 si [ condición ] entonces ... si no ...',
    previewColor: '#2e8af7',
    description:
      'Evalúa una condición lógica: si resulta verdadera ejecuta el primer grupo de bloques ("entonces"); si resulta falsa ejecuta el segundo grupo ("si no").',
    physicalComponent: 'Procesador lógico del microcontrolador',
    dataUsed: 'Resultado de una comparación o combinación lógica (Y / O)',
    dataType: 'Booleano (true / false)',
    behavior:
      'Permite definir qué hacer tanto cuando se necesita activar un actuador como cuando debe apagarse.',
    arduinoCode:
      'if (condicion) {\n  // rama verdadera\n} else {\n  // rama falsa\n}',
    technicalNotes:
      'Muy útil para apagar un relay o iluminación automáticamente cuando la variable ambiental vuelve a su rango normal.',
  },

  bitech_compare: {
    blockType: 'bitech_compare',
    title: 'Comparador relacional (<, >, <=, >=, ==, !=)',
    category: 'control',
    previewLabel: '[ sensor ] < [ 30 ]',
    previewColor: '#d97706',
    description:
      'Compara la lectura numérica de un sensor con un número de referencia (umbral) y devuelve verdadero o falso.',
    physicalComponent: 'ALU (Unidad Aritmético-Lógica)',
    dataUsed: 'Dos valores numéricos (lectura de sensor y umbral)',
    dataType: 'Booleano (bool)',
    behavior:
      'Se encastra dentro de un bloque "si / entonces" para decidir cuándo actuar.',
    arduinoCode: '(leerEntradaAnalogicaA0() < 400)',
    technicalNotes:
      'En C/C++, para comparar igualdad se utiliza doble signo igual (==), mientras que un solo igual (=) asigna un valor.',
  },

  bitech_logic_op: {
    blockType: 'bitech_logic_op',
    title: 'Operador lógico (Y / O)',
    category: 'control',
    previewLabel: '[ condición 1 ] Y [ condición 2 ]',
    previewColor: '#d97706',
    description:
      'Combina dos condiciones. Con "Y" (&&) ambas deben cumplirse al mismo tiempo; con "O" (||) basta con que se cumpla al menos una.',
    physicalComponent: 'Procesador lógico del microcontrolador',
    dataUsed: 'Dos expresiones booleanas',
    dataType: 'Booleano (bool)',
    behavior:
      'Permite reglas compuestas, como activar un actuador solo si hay poca luz Y además la entrada digital está activa.',
    arduinoCode: '(valorA0 < 400 && estadoDigital == 1)',
    technicalNotes:
      'En Arduino C/C++, el operador lógico Y se escribe && y el operador lógico O se escribe ||.',
  },

  bitech_math_op: {
    blockType: 'bitech_math_op',
    title: 'Operación matemática (+, -, *, /)',
    category: 'control',
    previewLabel: '➗ [ sensor ] + [ 10 ]',
    previewColor: '#d97706',
    description:
      'Aplica una operación aritmética (suma, resta, multiplicación o división) al valor leído de un sensor para escalarlo o ajustarlo.',
    physicalComponent: 'ALU del microcontrolador',
    dataUsed: 'Lectura numérica de un sensor y constante numérica',
    dataType: 'Numérico (int / float)',
    behavior:
      'Permite compensar lecturas o ajustar escalas antes de compararlas con un umbral.',
    arduinoCode: '(valorA0 + 10)',
    technicalNotes:
      'Útil para aplicar correcciones simples de calibración sobre la lectura cruda de un sensor.',
  },

  bitech_sensor_analog_a0: {
    blockType: 'bitech_sensor_analog_a0',
    title: 'Entrada analógica configurable',
    category: 'sensores',
    previewLabel: '📈 entrada analógica [pin]',
    previewColor: '#0284c7',
    description:
      'Lee una tensión mediante el conversor analógico-digital del GPIO seleccionado. Un GPIO es un pin programable de entrada o salida de la placa.',
    physicalComponent: 'GPIO con capacidad ADC declarado por el perfil activo',
    dataUsed:
      'Lectura cruda del ADC; su rango depende de la resolución y tensión admitida por la placa',
    dataType: 'Numérico entero (int)',
    behavior:
      'El selector ofrece solamente entradas analógicas compatibles con la placa elegida.',
    arduinoCode: 'analogRead(34)',
    technicalNotes:
      'No todos los GPIO tienen conversor ADC. Garden Node ofrece sus canales ADC declarados; NodeMCU conserva su única entrada A0; Camera Node no expone entradas analógicas porque la cámara y el Wi-Fi ocupan o restringen sus pines.',
  },

  bitech_sensor_digital_in: {
    blockType: 'bitech_sensor_digital_in',
    title: 'Entrada digital (HIGH / LOW)',
    category: 'sensores',
    previewLabel: '🔘 entrada digital',
    previewColor: '#0284c7',
    description:
      'Lee el estado lógico del GPIO seleccionado: devuelve 1 (HIGH) cuando está activo o 0 (LOW) cuando está inactivo. Un GPIO es un pin programable de entrada o salida.',
    physicalComponent: 'GPIO digital compatible configurado como INPUT',
    dataUsed: 'Nivel lógico digital binario (0 o 1)',
    dataType: 'Numérico entero / Booleano (0 o 1)',
    behavior:
      'Permite detectar pulsadores o sensores binarios. El selector cambia según la placa y excluye pines reservados o incompatibles.',
    arduinoCode: 'digitalRead(27)',
    technicalNotes:
      'A diferencia de una entrada analógica, una entrada digital solo distingue dos estados. NodeMCU usa la nomenclatura D1, D2, etc.; ESP32 muestra GPIO; Camera Node no ofrece indiscriminadamente los pines internos de la cámara.',
  },

  bitech_sensor_soil: {
    blockType: 'bitech_sensor_soil',
    title: 'Sensor de humedad del suelo',
    category: 'sensores',
    previewLabel: '🌱 humedad del suelo',
    previewColor: '#0284c7',
    description:
      'Lee el sensor de humedad del suelo para saber si la tierra está seca o húmeda.',
    physicalComponent:
      'Sonda de humedad de suelo conectada a entrada analógica (SUELO_PIN / A0)',
    dataUsed: 'Lectura analógica del conversor ADC',
    dataType: 'Numérico entero (int)',
    behavior:
      'Entrega un valor numérico que disminuye cuando la tierra se seca y aumenta cuando el suelo está húmedo.',
    arduinoCode: 'leerHumedadSuelo()',
    technicalNotes:
      'IMPORTANTE: No debe asumirse automáticamente como un porcentaje real si antes no se calibró el sensor midiendo sus valores en tierra seca y húmeda (SP-06).',
    deviceNotes: {
      'nodemcu-esp8266':
        'En NodeMCU ESP8266 este sensor ocupa el único pin analógico disponible (A0), por lo que no puede usarse simultáneamente junto con otro sensor analógico como el LDR.',
    },
  },

  bitech_sensor_temp: {
    blockType: 'bitech_sensor_temp',
    title: 'Sensor de temperatura ambiente',
    category: 'sensores',
    previewLabel: '🌡️ temperatura (°C)',
    previewColor: '#0284c7',
    description:
      'Obtiene la temperatura del aire medida en grados Celsius (°C) a través del sensor digital DHT11.',
    physicalComponent: 'Sensor digital DHT11 conectado a DHT_PIN',
    dataUsed: 'Magnitud térmica ambiental en °C',
    dataType: 'Numérico decimal (float)',
    behavior:
      'Devuelve la temperatura actual sin consumir entradas analógicas (usa un pin digital).',
    arduinoCode: 'leerTemperatura()',
    technicalNotes:
      'Como el DHT11 es un sensor digital, en NodeMCU deja libre la entrada analógica A0 para otro sensor.',
  },

  bitech_sensor_humidity: {
    blockType: 'bitech_sensor_humidity',
    title: 'Sensor de humedad ambiente',
    category: 'sensores',
    previewLabel: '💧 humedad ambiente (%)',
    previewColor: '#0284c7',
    description:
      'Mide el porcentaje de humedad relativa presente en el aire mediante el sensor digital DHT11.',
    physicalComponent: 'Sensor digital DHT11 conectado a DHT_PIN',
    dataUsed: 'Humedad relativa del aire (0 a 100 %)',
    dataType: 'Numérico decimal (float)',
    behavior:
      'Permite evaluar si el ambiente está seco o húmedo usando el mismo pin digital del DHT11.',
    arduinoCode: 'leerHumedadAmbiente()',
    technicalNotes:
      'El mismo encapsulado físico DHT11 entrega tanto temperatura como humedad ambiente por un único pin digital.',
  },

  bitech_sensor_light: {
    blockType: 'bitech_sensor_light',
    title: 'Sensor de nivel de luz (LDR)',
    category: 'sensores',
    previewLabel: '☀️ nivel de luz',
    previewColor: '#0284c7',
    description:
      'Lee cuánta luz recibe el entorno mediante una fotorresistencia (LDR) conectada a una entrada analógica.',
    physicalComponent: 'Sensor LDR en divisor resistivo conectado a ADC (LDR_PIN / A0)',
    dataUsed: 'Nivel de intensidad lumínica (escala 0 a 1023)',
    dataType: 'Numérico entero (int)',
    behavior:
      'Cuando hay poca luz el valor baja, permitiendo decidir cuándo encender la iluminación artificial.',
    arduinoCode: 'leerNivelLuz()',
    technicalNotes:
      'En NodeMCU ESP8266 este sensor utiliza el canal analógico A0. Si intentas combinarlo con otro sensor analógico a la vez, se superará el límite físico de 1 ADC de la placa.',
  },

  bitech_actuator_pump_on: {
    blockType: 'bitech_actuator_pump_on',
    title: 'Encender bomba de agua',
    category: 'actuadores',
    previewLabel: '⚙️ encender bomba',
    previewColor: '#0d8a52',
    description:
      'Activa el Canal 1 del módulo relay del Garden Node para encender la bomba de agua.',
    physicalComponent: 'Relay Canal 1 (BOMBA_PIN) → Mini bomba de agua',
    dataUsed: 'Señal digital de control hacia el módulo relay',
    dataType: 'Acción de salida (void)',
    behavior:
      'Cierra el circuito de la bomba de riego. Debe combinarse con una espera o condición de corte.',
    arduinoCode: 'bombaOn();',
    technicalNotes:
      'La función bombaOn() abstrae si el relay físico se activa con nivel LOW o HIGH.',
  },

  bitech_actuator_pump_off: {
    blockType: 'bitech_actuator_pump_off',
    title: 'Apagar bomba de agua',
    category: 'actuadores',
    previewLabel: '⚙️ apagar bomba',
    previewColor: '#0d8a52',
    description:
      'Desactiva el Canal 1 del módulo relay para detener el paso de agua de la bomba.',
    physicalComponent: 'Relay Canal 1 (BOMBA_PIN) → Mini bomba de agua',
    dataUsed: 'Señal digital de estado seguro OFF',
    dataType: 'Acción de salida (void)',
    behavior: 'Abre el contacto del relé deteniendo inmediatamente el riego.',
    arduinoCode: 'bombaOff();',
    technicalNotes:
      'Al iniciar el sistema, el estado seguro predeterminado de la bomba es siempre OFF.',
  },

  bitech_actuator_relay_on: {
    blockType: 'bitech_actuator_relay_on',
    title: 'Encender relay (NodeMCU)',
    category: 'actuadores',
    previewLabel: '🔌 encender relay',
    previewColor: '#0d8a52',
    description:
      'Activa el módulo de relé conectado a la salida digital simbólica RELAY_PIN de la placa NodeMCU.',
    physicalComponent: 'Módulo Relay de 1 canal conectado a RELAY_PIN',
    dataUsed: 'Señal digital de salida desde GPIO de NodeMCU',
    dataType: 'Acción de salida (void)',
    behavior:
      'Conmuta el contacto del relé a estado ON para accionar una carga externa (como un ventilador, electroválvula o bomba).',
    arduinoCode: 'relayOn();',
    technicalNotes:
      'Encapsula la polaridad activa (ACTIVE_LOW / ACTIVE_HIGH) en la configuración centralizada de hardware.',
  },

  bitech_actuator_relay_off: {
    blockType: 'bitech_actuator_relay_off',
    title: 'Apagar relay (NodeMCU)',
    category: 'actuadores',
    previewLabel: '🔌 apagar relay',
    previewColor: '#0d8a52',
    description:
      'Desactiva el módulo de relé conectado a RELAY_PIN, regresándolo a su estado seguro OFF.',
    physicalComponent: 'Módulo Relay de 1 canal conectado a RELAY_PIN',
    dataUsed: 'Señal digital de estado seguro OFF',
    dataType: 'Acción de salida (void)',
    behavior: 'Abre el circuito del relé deteniendo el actuador conectado.',
    arduinoCode: 'relayOff();',
    technicalNotes:
      'Siempre inicializa y deja el relé en estado OFF cuando la condición deja de cumplirse.',
  },

  bitech_actuator_digital_out_on: {
    blockType: 'bitech_actuator_digital_out_on',
    title: 'Activar salida digital (HIGH)',
    category: 'actuadores',
    previewLabel: '⚡ activar salida digital',
    previewColor: '#0284c7',
    description:
      'Coloca en estado alto (HIGH / 3.3V) el pin de salida digital SALIDA_DIG_PIN.',
    physicalComponent: 'Pin GPIO digital configurado como OUTPUT (SALIDA_DIG_PIN)',
    dataUsed: 'Nivel lógico digital HIGH (1)',
    dataType: 'Acción de salida (void)',
    behavior:
      'Enciende un indicador LED, buzzer activo o señal de control digital.',
    arduinoCode: 'activarSalidaDigital();',
    technicalNotes:
      'Las salidas digitales del ESP8266 y ESP32 entregan niveles lógicos de 3.3V (no 5V).',
  },

  bitech_actuator_digital_out_off: {
    blockType: 'bitech_actuator_digital_out_off',
    title: 'Desactivar salida digital (LOW)',
    category: 'actuadores',
    previewLabel: '⚡ desactivar salida digital',
    previewColor: '#0284c7',
    description:
      'Coloca en estado bajo (LOW / 0V) el pin de salida digital SALIDA_DIG_PIN.',
    physicalComponent: 'Pin GPIO digital configurado como OUTPUT (SALIDA_DIG_PIN)',
    dataUsed: 'Nivel lógico digital LOW (0)',
    dataType: 'Acción de salida (void)',
    behavior: 'Apaga el indicador o señal conectada a la salida digital.',
    arduinoCode: 'desactivarSalidaDigital();',
    technicalNotes:
      'En el arranque del sistema, SALIDA_DIG_PIN comienza siempre en estado LOW.',
  },

  bitech_actuator_light_on: {
    blockType: 'bitech_actuator_light_on',
    title: 'Encender iluminación LED',
    category: 'actuadores',
    previewLabel: '💡 encender iluminación',
    previewColor: '#7c3aed',
    description:
      'Activa la salida de iluminación LED del sistema (LUZ_PIN).',
    physicalComponent: 'Canal de iluminación LED conectado a LUZ_PIN',
    dataUsed: 'Señal digital de salida hacia el circuito de iluminación',
    dataType: 'Acción de salida (void)',
    behavior:
      'Enciende la iluminación artificial cuando el programa detecta que el nivel de luz es bajo.',
    arduinoCode: 'luzOn();',
    technicalNotes:
      'Permite controlar tiras o paneles LED tanto en Garden Node (ESP32) como en NodeMCU (ESP8266).',
  },

  bitech_actuator_light_off: {
    blockType: 'bitech_actuator_light_off',
    title: 'Apagar iluminación LED',
    category: 'actuadores',
    previewLabel: '💡 apagar iluminación',
    previewColor: '#7c3aed',
    description: 'Desactiva la salida de iluminación LED (LUZ_PIN).',
    physicalComponent: 'Canal de iluminación LED conectado a LUZ_PIN',
    dataUsed: 'Señal digital de estado seguro OFF',
    dataType: 'Acción de salida (void)',
    behavior:
      'Apaga las luces para ahorrar energía cuando la iluminación ambiental es suficiente.',
    arduinoCode: 'luzOff();',
    technicalNotes:
      'El canal de iluminación se inicializa siempre en estado seguro OFF.',
  },

  bitech_cam_config: {
    blockType: 'bitech_cam_config',
    title: 'Configurar cámara OV2640',
    category: 'camara',
    previewLabel: '📷 configurar cámara OV2640',
    previewColor: '#0891b2',
    description:
      'Prepara los pines internos y parámetros base del módulo de cámara OV2640 conectado a la placa ESP32-CAM.',
    physicalComponent: 'ESP32-CAM + Sensor de imagen OV2640',
    dataUsed: 'Estructura camera_config_t del driver esp_camera',
    dataType: 'Configuración de inicialización (void)',
    behavior:
      'Registra en el sistema que la cámara está configurada antes de poder iniciarla o transmitir video.',
    arduinoCode: 'configurarCamara();',
    technicalNotes:
      'La ESP32-CAM se programa por USB y luego utiliza Wi-Fi para transmitir las imágenes y el streaming.',
  },

  bitech_cam_resolution: {
    blockType: 'bitech_cam_resolution',
    title: 'Seleccionar resolución de cámara',
    category: 'camara',
    previewLabel: '🖼️ seleccionar resolución SVGA (800x600)',
    previewColor: '#0891b2',
    description:
      'Define el tamaño en píxeles de las imágenes y del video que capturará la ESP32-CAM.',
    physicalComponent: 'Sensor de imagen OV2640 (ESP32-CAM)',
    dataUsed: 'Constante de resolución (QVGA, VGA, SVGA, XGA)',
    dataType: 'Parámetro enumerado (framesize_t)',
    behavior:
      'Resoluciones intermedias como SVGA (800×600) logran un buen equilibrio entre nitidez y fluidez por Wi-Fi.',
    arduinoCode: 'seleccionarResolucion("SVGA (800x600)");',
    technicalNotes:
      'A mayor resolución, cada fotograma ocupa más memoria RAM (PSRAM) y ancho de banda Wi-Fi.',
  },

  bitech_cam_quality: {
    blockType: 'bitech_cam_quality',
    title: 'Configurar calidad JPEG',
    category: 'camara',
    previewLabel: '✨ configurar calidad JPEG (10)',
    previewColor: '#0891b2',
    description:
      'Ajusta el nivel de compresión JPEG de la cámara (valores entre 10 y 63).',
    physicalComponent: 'Compresor JPEG por hardware del sensor OV2640',
    dataUsed:
      'Índice de compresión entero (10 = alta calidad, 63 = menor calidad)',
    dataType: 'Numérico entero (int)',
    behavior:
      'Actualiza la calidad de imagen tanto para el streaming como para las capturas fotográficas.',
    arduinoCode: 'configurarCalidad(10);',
    technicalNotes:
      'En el driver de la ESP32-CAM, un número más bajo (ej. 10 o 12) significa mayor calidad visual y menor compresión.',
  },

  bitech_cam_init: {
    blockType: 'bitech_cam_init',
    title: 'Iniciar cámara',
    category: 'camara',
    previewLabel: '⚡ iniciar cámara',
    previewColor: '#059669',
    description:
      'Enciende e inicializa el sensor OV2640 con la resolución y calidad configuradas previamente.',
    physicalComponent: 'Módulo ESP32-CAM (OV2640)',
    dataUsed: 'Estado de inicialización del sensor',
    dataType: 'Acción de inicialización (void)',
    behavior:
      'Cambia el estado del Camera Node a ACTIVA, habilitando la toma de capturas y el inicio del streaming.',
    arduinoCode: 'iniciarCamara();',
    technicalNotes:
      'Si se intenta tomar una foto o iniciar streaming sin antes iniciar la cámara, el sistema mostrará una advertencia.',
  },

  bitech_cam_wifi: {
    blockType: 'bitech_cam_wifi',
    title: 'Conectar dispositivo a Wi-Fi',
    category: 'camara',
    previewLabel: '📶 conectar Wi-Fi red escolar',
    previewColor: '#2563eb',
    description:
      'Conecta el microcontrolador (ESP32, ESP32-CAM o NodeMCU ESP8266) a la red Wi-Fi del laboratorio.',
    physicalComponent: 'Módulo de radio Wi-Fi 2.4 GHz integrado',
    dataUsed:
      'Identificador de red y credencial protegida (WIFI_SSID / WIFI_PASSWORD)',
    dataType: 'Acción de conectividad (void)',
    behavior:
      'Habilita el canal de comunicación inalámbrico necesario para streaming o telemetría IoT.',
    arduinoCode: 'conectarWiFi(WIFI_SSID, WIFI_PASSWORD);',
    technicalNotes:
      'Por seguridad y privacidad, nunca se escriben contraseñas Wi-Fi reales dentro del código subido a Git.',
  },

  bitech_cam_stream_start: {
    blockType: 'bitech_cam_stream_start',
    title: 'Iniciar streaming de video Wi-Fi',
    category: 'camara',
    previewLabel: '▶️ iniciar streaming',
    previewColor: '#0d9488',
    description:
      'Inicia el servidor web MJPEG en la ESP32-CAM para transmitir video en vivo de la huerta por Wi-Fi.',
    physicalComponent: 'Servidor HTTP interno del ESP32-CAM + Wi-Fi',
    dataUsed: 'Flujo continuo de cuadros JPEG (MJPEG)',
    dataType: 'Acción de servicio (void)',
    behavior:
      'Pone el indicador de Streaming en ON cuando la cámara está activa.',
    arduinoCode: 'iniciarStreaming();',
    technicalNotes:
      'Recuerda: el cable USB se usa para programar la placa; el video se transmite siempre por Wi-Fi (endpoint configurable).',
  },

  bitech_cam_stream_stop: {
    blockType: 'bitech_cam_stream_stop',
    title: 'Detener streaming de video',
    category: 'camara',
    previewLabel: '⏹️ detener streaming',
    previewColor: '#64748b',
    description:
      'Detiene la transmisión continua de video por Wi-Fi para liberar recursos y ahorrar energía.',
    physicalComponent: 'Servidor HTTP interno del ESP32-CAM',
    dataUsed: 'Estado del servidor de streaming',
    dataType: 'Acción de control (void)',
    behavior:
      'Cambia el estado de Streaming a OFF manteniendo la cámara lista para nuevas órdenes.',
    arduinoCode: 'detenerStreaming();',
    technicalNotes:
      'Detener el streaming cuando no se observa en vivo reduce la temperatura de trabajo de la ESP32-CAM.',
  },

  bitech_cam_capture: {
    blockType: 'bitech_cam_capture',
    title: 'Tomar captura fotográfica',
    category: 'camara',
    previewLabel: '📸 tomar captura',
    previewColor: '#7c3aed',
    description:
      'Captura un fotograma estático del estado actual de la planta y registra el horario de la toma.',
    physicalComponent: 'Sensor OV2640 + Buffer de imagen en memoria',
    dataUsed: 'Fotograma JPEG y marca de tiempo',
    dataType: 'Acción de captura (void)',
    behavior:
      'Incrementa en 1 el contador de capturas y actualiza la hora de última captura en el simulador.',
    arduinoCode: 'tomarCaptura();',
    technicalNotes:
      'Permite documentar el crecimiento de las plantas en el Smart Garden Lab a lo largo de los días.',
  },

  bitech_data_serial_log: {
    blockType: 'bitech_data_serial_log',
    title: 'Registrar dato en Monitor Serie',
    category: 'datos',
    previewLabel: '📊 registrar dato de sensor',
    previewColor: '#db2777',
    description:
      'Envía por el puerto serie el nombre y el valor actual de un sensor para observar sus mediciones.',
    physicalComponent: 'UART / Puerto Serie del microcontrolador',
    dataUsed: 'Etiqueta de texto y lectura actual del sensor',
    dataType: 'Salida de datos (Serial.println)',
    behavior:
      'Imprime en el registro del sistema el valor medido en cada ciclo.',
    arduinoCode: 'registrarDato("Lectura", leerEntradaAnalogicaA0());',
    technicalNotes:
      'Preparado como base conceptual de la categoría Datos para las bitácoras históricas de V0.4.',
  },

  bitech_iot_send_event: {
    blockType: 'bitech_iot_send_event',
    title: 'Publicar lectura en canal IoT (Conceptual)',
    category: 'iot',
    previewLabel: '☁️ enviar a IoT [canal] [sensor]',
    previewColor: '#0284c7',
    description:
      'Bloque conceptual que representa el envío de una medición hacia un panel IoT en red mediante Wi-Fi.',
    physicalComponent: 'Módulo Wi-Fi del ESP32 / NodeMCU ESP8266',
    dataUsed: 'Tópico o canal IoT y valor del sensor seleccionado',
    dataType: 'Mensaje de telemetría (void)',
    behavior:
      'Si se elige una entrada analógica o digital, conserva explícitamente el pin seleccionado y publica su lectura.',
    arduinoCode: 'enviarDatoIoT("bitech/nodo1", analogRead(34));',
    technicalNotes:
      'El selector de GPIO proviene del perfil activo: no todos los pines tienen capacidad analógica/digital ni están disponibles en todas las placas.',
  },

  bitech_iot_connect_channel: {
    blockType: 'bitech_iot_connect_channel',
    title: 'Conectar a Smart Garden Lab por canal',
    category: 'iot',
    previewLabel: '🔗 conectar a Smart Garden Lab — canal [1]',
    previewColor: '#0d9488',
    description:
      'Asocia el programa con un canal visible del 1 al 9 para encontrar sus datos en Smart Garden Lab.',
    physicalComponent: 'Interfaz Wi-Fi del microcontrolador',
    dataUsed: 'Número de canal Bi-Tech (1–9)',
    dataType: 'Configuración de comunicación (entero)',
    behavior:
      'Define el canal que el estudiante ingresará en Smart Garden Lab para visualizar el dispositivo asociado.',
    arduinoCode:
      'const uint8_t BITECH_CHANNEL = 1;\nconectarSmartGardenLab(BITECH_CHANNEL);',
    technicalNotes:
      'El canal identifica el flujo visible; no es una contraseña ni reemplaza el token técnico interno que autoriza la escritura.',
  },
};

export const DEFAULT_MANUAL_ENTRY: ContextualManualEntry =
  CONTEXTUAL_MANUAL_ENTRIES.bitech_if_sensor_compare;

/**
 * Obtiene la ficha del manual contextual adaptada a las capacidades y
 * particularidades del perfil de hardware seleccionado.
 */
export function getManualEntryForDevice(
  blockType: string,
  deviceId: DeviceProfileId
): ContextualManualEntry {
  const base = CONTEXTUAL_MANUAL_ENTRIES[blockType] ?? DEFAULT_MANUAL_ENTRY;
  const profile = getDeviceProfile(deviceId);
  const specificNote = base.deviceNotes?.[deviceId];

  if (!specificNote && deviceId !== 'nodemcu-esp8266') {
    return base;
  }

  return {
    ...base,
    technicalNotes: specificNote
      ? `${specificNote} (${base.technicalNotes})`
      : `${base.technicalNotes} · Nota de hardware (${profile.shortBadge}): ${profile.capabilities.pedagogicalResourceNote}`,
  };
}
