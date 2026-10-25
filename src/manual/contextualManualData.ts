import { ContextualManualEntry } from '../types/studio';

export const CONTEXTUAL_MANUAL_ENTRIES: Record<string, ContextualManualEntry> = {
  bitech_on_start: {
    blockType: 'bitech_on_start',
    title: 'Al iniciar (setup)',
    category: 'inicio',
    previewLabel: '▶ al iniciar',
    previewColor: '#109856',
    description:
      'Ejecuta una sola vez las instrucciones iniciales cuando se enciende o reinicia la placa ESP32. Prepara la comunicación serie y deja los actuadores en estado seguro (APAGADOS).',
    physicalComponent: 'Microcontrolador ESP32 / ESP32-CAM',
    dataUsed: 'Configuración de pines de entrada/salida y velocidad del puerto serie (115200 baudios)',
    dataType: 'Estructura de control inicial (void setup)',
    behavior:
      'Configura los pines simbólicos (BOMBA_PIN, LUZ_PIN) como salidas y garantiza que la bomba y la luz comiencen apagadas.',
    arduinoCode: 'void setup() {\n  Serial.begin(115200);\n  pinMode(BOMBA_PIN, OUTPUT);\n  pinMode(LUZ_PIN, OUTPUT);\n}',
    technicalNotes:
      'En sistemas reales de automatización, inicializar los relés en OFF evita que la bomba se active accidentalmente al encender el equipo.',
  },

  bitech_forever: {
    blockType: 'bitech_forever',
    title: 'Repetir siempre (loop)',
    category: 'inicio',
    previewLabel: '↻ repetir siempre',
    previewColor: '#9b3df5',
    description:
      'Todo lo que coloques dentro de este bloque se repite de manera continua mientras el dispositivo esté encendido. Es el corazón del control automático.',
    physicalComponent: 'Procesador principal del ESP32',
    dataUsed: 'Ciclo continuo de lectura de sensores, evaluación lógica y control de actuadores',
    dataType: 'Ciclo infinito (void loop)',
    behavior:
      'Lee sensores actualizados en cada vuelta del ciclo, evalúa las condiciones "si / entonces" y actualiza la bomba o la iluminación.',
    arduinoCode: 'void loop() {\n  // Instrucciones que se repiten continuamente\n}',
    technicalNotes:
      'El microcontrolador ejecuta miles de ciclos por segundo salvo que se agregue una pausa con delay().',
  },

  bitech_wait: {
    blockType: 'bitech_wait',
    title: 'Esperar segundos (delay)',
    category: 'inicio',
    previewLabel: '🕒 esperar 5 segundos',
    previewColor: '#2573e8',
    description:
      'Detiene temporalmente la ejecución del programa durante la cantidad de segundos indicada antes de pasar al siguiente bloque.',
    physicalComponent: 'Temporizador interno del ESP32',
    dataUsed: 'Tiempo en segundos (convertido a milisegundos en Arduino C/C++)',
    dataType: 'Numérico entero (milisegundos, ej. 5 s = 5000 ms)',
    behavior:
      'Mantiene el estado actual de los actuadores (por ejemplo, la bomba encendida durante 5 segundos) antes de continuar.',
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
      'Este bloque lee el valor de un sensor (en este caso, la humedad del suelo) y compara si cumple la condición (por ejemplo, menor que 30). Si la condición se cumple, ejecuta los bloques que están dentro (por ejemplo, encender la bomba).',
    physicalComponent: 'Unidad lógica del ESP32 + Sensor seleccionado',
    dataUsed: 'Lectura actual del sensor comparada contra un valor umbral numérico',
    dataType: 'Booleano (verdadero / falso)',
    behavior:
      'Sirve para tomar decisiones automáticas según los datos de los sensores o para controlar actuadores cuando se supera o baja de un umbral.',
    arduinoCode: 'int suelo = leerHumedadSuelo();\nif (suelo < 30) {\n  // acciones si se cumple\n}',
    technicalNotes:
      'Expresa de forma visible la cadena pedagógica: sensor → dato → comparación → decisión → actuación.',
  },

  bitech_if_else: {
    blockType: 'bitech_if_else',
    title: 'Condicional doble: Si / Entonces / Si no',
    category: 'control',
    previewLabel: '🔀 si [ condición ] entonces ... si no ...',
    previewColor: '#2e8af7',
    description:
      'Evalúa una condición lógica: si resulta verdadera ejecuta el primer grupo de bloques ("entonces"); si resulta falsa ejecuta el segundo grupo ("si no").',
    physicalComponent: 'Procesador lógico del ESP32',
    dataUsed: 'Resultado de una comparación o combinación lógica (Y / O)',
    dataType: 'Booleano (true / false)',
    behavior:
      'Permite definir qué hacer tanto cuando se necesita activar un actuador como cuando debe apagarse.',
    arduinoCode: 'if (condicion) {\n  // rama verdadera\n} else {\n  // rama falsa\n}',
    technicalNotes:
      'Muy útil para apagar la iluminación automáticamente cuando el nivel de luz ambiental vuelve a ser suficiente.',
  },

  bitech_compare: {
    blockType: 'bitech_compare',
    title: 'Comparador relacional (<, >, <=, >=, ==, !=)',
    category: 'control',
    previewLabel: '[ sensor ] < [ 30 ]',
    previewColor: '#d97706',
    description:
      'Compara la lectura numérica de un sensor con un número de referencia (umbral) y devuelve verdadero o falso.',
    physicalComponent: 'ALU (Unidad Aritmético-Lógica) del ESP32',
    dataUsed: 'Dos valores numéricos (lectura de sensor y umbral)',
    dataType: 'Booleano (bool)',
    behavior:
      'Se encastra dentro de un bloque "si / entonces" para decidir cuándo actuar.',
    arduinoCode: '(leerHumedadSuelo() < 30)',
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
    physicalComponent: 'Procesador lógico del ESP32',
    dataUsed: 'Dos expresiones booleanas',
    dataType: 'Booleano (bool)',
    behavior:
      'Permite reglas avanzadas, por ejemplo: regar solo si la humedad del suelo es baja Y además la temperatura supera cierto valor.',
    arduinoCode: '(suelo < 30 && temp > 20)',
    technicalNotes:
      'En Arduino C/C++, el operador lógico Y se escribe && y el operador lógico O se escribe ||.',
  },

  bitech_sensor_soil: {
    blockType: 'bitech_sensor_soil',
    title: 'Sensor de humedad del suelo',
    category: 'sensores',
    previewLabel: '🌱 humedad del suelo',
    previewColor: '#0284c7',
    description:
      'Lee el sensor de humedad del suelo conectado al Garden Node para saber si la tierra está seca o húmeda.',
    physicalComponent: 'Sonda de humedad de suelo conectada a entrada analógica (SUELO_PIN)',
    dataUsed: 'Lectura analógica del conversor ADC del ESP32',
    dataType: 'Numérico entero (int)',
    behavior:
      'Entrega un valor numérico que disminuye cuando la tierra se seca y aumenta cuando el suelo está húmedo.',
    arduinoCode: 'leerHumedadSuelo()',
    technicalNotes:
      'IMPORTANTE: No debe asumirse automáticamente como un porcentaje real si antes no se calibró el sensor midiendo sus valores en tierra seca y húmeda (SP-06).',
  },

  bitech_sensor_temp: {
    blockType: 'bitech_sensor_temp',
    title: 'Sensor de temperatura ambiente',
    category: 'sensores',
    previewLabel: '🌡️ temperatura (°C)',
    previewColor: '#0284c7',
    description:
      'Obtiene la temperatura del aire alrededor de la huerta medida en grados Celsius (°C).',
    physicalComponent: 'Sensor digital DHT11 conectado a DHT_PIN',
    dataUsed: 'Magnitud térmica ambiental en °C',
    dataType: 'Numérico decimal (float)',
    behavior:
      'Devuelve la temperatura actual para poder compararla con un umbral (por ejemplo, alerta de calor > 30 °C).',
    arduinoCode: 'leerTemperatura()',
    technicalNotes:
      'El sensor DHT11 utiliza un protocolo digital propio en un solo pin de datos y requiere al menos 1 segundo entre lecturas reales.',
  },

  bitech_sensor_humidity: {
    blockType: 'bitech_sensor_humidity',
    title: 'Sensor de humedad ambiente',
    category: 'sensores',
    previewLabel: '💧 humedad ambiente (%)',
    previewColor: '#0284c7',
    description:
      'Mide el porcentaje de humedad relativa presente en el aire del invernadero o aula.',
    physicalComponent: 'Sensor digital DHT11 conectado a DHT_PIN',
    dataUsed: 'Humedad relativa del aire (0 a 100 %)',
    dataType: 'Numérico decimal (float)',
    behavior:
      'Permite evaluar si el ambiente está demasiado seco o húmedo junto con la temperatura.',
    arduinoCode: 'leerHumedadAmbiente()',
    technicalNotes:
      'El mismo encapsulado físico DHT11 entrega tanto temperatura como humedad ambiente.',
  },

  bitech_sensor_light: {
    blockType: 'bitech_sensor_light',
    title: 'Sensor de nivel de luz (LDR)',
    category: 'sensores',
    previewLabel: '☀️ nivel de luz',
    previewColor: '#0284c7',
    description:
      'Lee cuánta luz recibe la planta mediante una fotorresistencia (LDR).',
    physicalComponent: 'Sensor LDR (fotorresistor) en divisor resistivo conectado a LDR_PIN',
    dataUsed: 'Nivel de intensidad lumínica (escala 0 a 1023)',
    dataType: 'Numérico entero (int)',
    behavior:
      'Cuando hay poca luz el valor baja, permitiendo decidir cuándo encender la iluminación artificial de cultivo.',
    arduinoCode: 'leerNivelLuz()',
    technicalNotes:
      'La resistencia eléctrica de un LDR varía según la cantidad de fotones que inciden sobre su superficie.',
  },

  bitech_actuator_pump_on: {
    blockType: 'bitech_actuator_pump_on',
    title: 'Encender bomba de agua',
    category: 'actuadores',
    previewLabel: '⚙️ encender bomba',
    previewColor: '#0d8a52',
    description:
      'Activa el Canal 1 del módulo relay para encender la bomba sumergible e impulsar agua hacia la planta.',
    physicalComponent: 'Relay Canal 1 (BOMBA_PIN) → Mini bomba de agua',
    dataUsed: 'Señal digital de control hacia el módulo relay',
    dataType: 'Acción de salida (void)',
    behavior:
      'Cierra el circuito de la bomba de riego. Debe combinarse con una espera o condición de corte para no inundar la maceta.',
    arduinoCode: 'bombaOn();',
    technicalNotes:
      'La función bombaOn() abstrae si el relay físico se activa con nivel LOW o HIGH (configurable en gardenNodeConfig.ts).',
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
    behavior:
      'Abre el contacto del relé deteniendo inmediatamente el riego.',
    arduinoCode: 'bombaOff();',
    technicalNotes:
      'Al iniciar el sistema, el estado seguro predeterminado de la bomba es siempre OFF.',
  },

  bitech_actuator_light_on: {
    blockType: 'bitech_actuator_light_on',
    title: 'Encender iluminación LED',
    category: 'actuadores',
    previewLabel: '💡 encender iluminación',
    previewColor: '#7c3aed',
    description:
      'Activa el Canal 2 del módulo relay para encender la luz LED de crecimiento de la huerta.',
    physicalComponent: 'Relay Canal 2 (LUZ_PIN) → Panel/tira de iluminación LED',
    dataUsed: 'Señal digital de salida hacia el Canal 2 del relay',
    dataType: 'Acción de salida (void)',
    behavior:
      'Enciende la iluminación artificial cuando el programa detecta que el nivel de luz natural es bajo.',
    arduinoCode: 'luzOn();',
    technicalNotes:
      'El relay permite que el ESP32 (que trabaja a 3.3V) controle de forma aislada circuitos de mayor potencia.',
  },

  bitech_actuator_light_off: {
    blockType: 'bitech_actuator_light_off',
    title: 'Apagar iluminación LED',
    category: 'actuadores',
    previewLabel: '💡 apagar iluminación',
    previewColor: '#7c3aed',
    description:
      'Desactiva el Canal 2 del módulo relay para apagar la iluminación artificial.',
    physicalComponent: 'Relay Canal 2 (LUZ_PIN) → Panel/tira de iluminación LED',
    dataUsed: 'Señal digital de estado seguro OFF',
    dataType: 'Acción de salida (void)',
    behavior:
      'Apaga las luces de cultivo para ahorrar energía cuando la luz ambiental es suficiente.',
    arduinoCode: 'luzOff();',
    technicalNotes:
      'Al igual que la bomba, el Canal 2 inicia siempre en estado seguro OFF.',
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
      'Resoluciones intermedias como SVGA (800×600) logran un buen equilibrio entre nitidez de la planta y fluidez por Wi-Fi.',
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
    dataUsed: 'Índice de compresión entero (10 = alta calidad, 63 = menor calidad)',
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
    title: 'Conectar Camera Node a Wi-Fi',
    category: 'camara',
    previewLabel: '📶 conectar Wi-Fi red escolar',
    previewColor: '#2563eb',
    description:
      'Conecta la ESP32-CAM a la red Wi-Fi del laboratorio para permitir el acceso al streaming y capturas.',
    physicalComponent: 'Módulo de radio Wi-Fi 2.4 GHz del ESP32-CAM',
    dataUsed: 'Identificador de red simbólico (WIFI_SSID / WIFI_PASS desde configuración local)',
    dataType: 'Acción de conectividad (void)',
    behavior:
      'Habilita el canal de comunicación inalámbrico necesario para transmitir video.',
    arduinoCode: 'conectarWiFi(WIFI_SSID, WIFI_PASS);',
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
    physicalComponent: 'UART / Puerto Serie del ESP32',
    dataUsed: 'Etiqueta de texto y lectura actual del sensor',
    dataType: 'Salida de datos (Serial.println)',
    behavior:
      'Imprime en el registro del sistema el valor medido en cada ciclo.',
    arduinoCode: 'registrarDato("Humedad suelo", leerHumedadSuelo());',
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
      'Bloque conceptual que representa el envío de una medición del jardín hacia un panel IoT en red.',
    physicalComponent: 'Módulo Wi-Fi del ESP32',
    dataUsed: 'Tópico o canal IoT y valor del sensor seleccionado',
    dataType: 'Mensaje de telemetría (void)',
    behavior:
      'Muestra en el código C/C++ cómo se estructura una llamada de publicación IoT que se conectará en V0.4.',
    arduinoCode: 'enviarDatoIoT("huerta/suelo", leerHumedadSuelo());',
    technicalNotes:
      'En V0.1 este bloque prepara la comprensión conceptual de IoT antes de activar la infraestructura de red en V0.4.',
  },
};

export const DEFAULT_MANUAL_ENTRY: ContextualManualEntry =
  CONTEXTUAL_MANUAL_ENTRIES.bitech_if_sensor_compare;
