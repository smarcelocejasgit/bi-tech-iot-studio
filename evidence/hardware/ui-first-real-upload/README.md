# Evidencia de Hardware — V0.3: Placa Real desde la Interfaz de Bi-Tech IoT Studio

## Hito Validado

**Primer programa transferido a hardware físico directamente desde la interfaz de Bi-Tech IoT Studio.**

Recorrido completo ejecutado desde la interfaz web sin utilizar manualmente la terminal:

**`Blockly → código Arduino (.ino) → Detectar puerto → Compilar → Cargar → Ejecutar en NodeMCU → Monitor de la placa`**

---

## Flujo Realizado desde la Interfaz

1. **1. Programa (Blockly):** Selección del perfil **NodeMCU — ESP8266** con el programa de control de humedad de suelo (`A0`, umbral experimental `800`) y relay (`D1 / GPIO5`).
2. **2. Sketch (`.ino`):** Generación automática en vivo del sketch compilable (`129` líneas de código Arduino C/C++).
3. **3. Puerto:** Activación del modo **Placa real**; detección dinámica de los puertos serie disponibles mediante `HardwareBridge.listPorts()` y selección de `COM15 — Puerto USB (Placa detectada)`.
4. **4. Compilar:** Ejecución del botón **Compilar programa** (`HardwareBridge.compile()`), obteniendo `Compilación correcta` con opción desplegable **Ver detalles técnicos** para diagnóstico docente.
5. **5. Cargar:** Ejecución explícita del botón **Cargar en la placa** (`HardwareBridge.upload()`), visualizando en vivo los estados `Conectando...`, `Cargando (7% ... 100%)` y `Carga completada en COM15` (`272320 bytes` escritos y verificados en flash).
6. **6. Ejecutar:** Confirmación en pantalla: **Programa cargado. La placa está ejecutando tu proyecto.**
7. **Monitor de la placa:** Apertura del monitor serie integrado a `115200` baudios (`HardwareBridge.openSerialMonitor()`), visualizando en tiempo real las lecturas físicas provenientes de la NodeMCU (`Humedad suelo: 718` / `Relay OFF`).

---

## Archivos Registrados

- [`ui-placa-real-v03.png`](./ui-placa-real-v03.png): Captura completa del modo **Placa real** en Bi-Tech IoT Studio con compilación correcta, carga completada, estado de ejecución activo y **Monitor de la placa** recibiendo datos reales desde la NodeMCU.
- [`bitech-ui-generated-sketch.ino`](./bitech-ui-generated-sketch.ino): Sketch `.ino` generado por Bi-Tech IoT Studio y transferido desde la interfaz.
- [`compile-result.txt`](./compile-result.txt): Resultado técnico sanitizado de la compilación ejecutada desde la UI.
- [`upload-result.txt`](./upload-result.txt): Resultado técnico sanitizado del upload ejecutado desde la UI (`MAC: [REDACTED]`, hash de flash verificado).
- [`serial-monitor-output.txt`](./serial-monitor-output.txt): Salida real capturada en el panel **Monitor de la placa** a `115200` baudios.
