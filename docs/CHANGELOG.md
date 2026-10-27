# Changelog — Bi-Tech IoT Studio

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo un enfoque incremental y trazable.

---

## [0.5.2 (V0.5B)] — 2026-10-26
### Intérprete didáctico del programa y diferenciación de modos Programar vs Placa real
- **Intérprete didáctico del programa como vista principal en modo Programar (`src/components/ArduinoCodePanel.tsx`, `src/components/DidacticInterpreterView.tsx`, `src/interpreter/programInterpreter.ts`):**
  - Implementación de las pestañas en el panel derecho:
    1. **Interpretar programa** — vista principal y activa por defecto.
    2. **Ver código Arduino** — vista secundaria con resaltado sintáctico, subtabs (Vista educativa vs Sketch compilable) y copiado.
  - Botón **Descargar .ino** disponible de manera permanente en todas las pestañas.
- **Estructura pedagógica por categorías de ejecución:**
  - **Al comenzar:** setup, inicialización de módulos, resolución/calidad de cámara y conexión Wi-Fi.
  - **Observar / medir:** lectura de sensores físicos (humedad del suelo, temperatura y humedad del aire DHT11, fotorresistencia LDR, canal analógico A0, entrada digital) y su propósito en la huerta.
  - **Decidir:** explicaciones pedagógicas de condiciones y comparaciones (ej. *«La placa compara la humedad del suelo con el valor 30. Si detecta que el suelo necesita agua, activa la bomba de riego.»*).
  - **Actuar:** efectos en el entorno real sobre bomba de agua, iluminación complementaria, relays, salidas digitales o capturas de cámara.
  - **Comunicar:** registro por puerto serie y publicación en canales IoT para Smart Garden Lab.
  - **Repetir:** ciclo continuo del microcontrolador y pausas de temporización para estabilización.
- **Lógica determinista y reactiva:**
  - Sin uso de IA en esta fase para garantizar previsibilidad y rigor curricular.
  - Actualización reactiva instantánea ante cualquier modificación en Blockly o cambio de proyecto local.
  - Estado vacío pedagógico guiado cuando el workspace está vacío.
- **Protagonismo del código Arduino en modo Placa real:**
  - En `workMode === 'board'`, el código Arduino puro permanece como protagonista indiscutido junto con la compilación, carga USB, Monitor Serie y estado de la placa, evitando duplicar vistas entre modos.
- **Alineación curricular:**
  - Cumplimiento del recorrido pedagógico: `Bloque → interpretación → código → placa → comportamiento real`.

---

## [0.4.0-alpha.1 (V0.4A)] — 2026-10-25
### Preparación de Software para Camera Node Bi-Tech (`ESP32-CAM · OV2640`)
- **Toolchain ESP32 y FQBN Candidato (`src/hardware/cameraNodeConfig.ts`, `src/types/hardware.ts`):**
  - Instalación del core oficial de Espressif `esp32:esp32@2.0.17` en Arduino CLI.
  - Identificación de `candidateFqbn: 'esp32:esp32:esp32cam'` (*AI Thinker ESP32-CAM*) manteniendo `verifiedFqbn: null` y documentando el supuesto de modelo de placa hasta realizar mañana la validación física.
- **Generación de Sketch Compilable Completo para Camera Node (`src/generators/arduinoGenerator.ts`):**
  - Generación de código Arduino C/C++ (`.ino`) 100 % compilable con `#include "esp_camera.h"`, `#include <WiFi.h>` y `#include "esp_http_server.h"`, soportando `configurarCamara()`, `seleccionarResolucion()`, `configurarCalidad()`, `iniciarCamara()`, `conectarWiFi()`, `iniciarStreaming()`, `detenerStreaming()`, `tomarCaptura()` y `estadoCamara()`.
  - Compilación real verificada desde la interfaz (`834969 bytes` / `26%` de flash, `48060 bytes` / `14%` de RAM).
- **Configuración Segura de Wi-Fi y Streaming sin Valores Hardcodeados (`.env.example`, `wifi_credentials.example.h`, `src/hardware/cameraSerialParser.ts`):**
  - Uso de placeholders (`SSID_PENDIENTE_CONFIGURACION` y `PASS_PENDIENTE_CONFIGURACION`) e inclusión condicional `#if __has_include("wifi_credentials.h")` excluida por `.gitignore`.
  - Configuración desacoplada de streaming (`resolveCameraStreamUrl`) sin hardcodear IP, puerto, endpoint `/stream` ni URL completa.
- **Modo `Placa real` de 9 Pasos y Parser Tolerante de Monitor Serie (`src/components/RealBoardPanel.tsx`, `src/components/VirtualSystemPanel.tsx`):**
  - Visualización de los 9 pasos de Camera Node (`1. Programa`, `2. Sketch generado`, `3. Puerto USB`, `4. Compilar`, `5. Cargar`, `6. Monitor Serie`, `7. Wi-Fi`, `8. Cámara`, `9. Streaming`), manteniendo todos los pasos que requieren cámara física en estado explícito **Pendiente de validación con hardware**.
  - Parser tolerante y configurable (`parseCameraSerialOutput`) preparado para reconocer `Camera ready`, `WiFi connected`, `IP: xxx.xxx.xxx.xxx` y `Streaming started`.
- **Evidencia registrada:**
  - Guardada en [`evidence/hardware/camera-node-software-readiness/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/camera-node-software-readiness/README.md) indicando explícitamente que todavía no hubo validación física.

---

## [0.3.0 (V0.3)] — 2026-10-25
### Hito: Primer programa transferido a hardware físico directamente desde la interfaz de Bi-Tech IoT Studio
- **Habilitación del modo `Placa real` para NodeMCU ESP8266 (`src/components/RealBoardPanel.tsx`, `src/components/HeaderBar.tsx`, `src/App.tsx`):**
  - Implementación del flujo pedagógico guiado de 6 pasos en la interfaz: **1. Programa → 2. Sketch (`.ino`) → 3. Puerto → 4. Compilar → 5. Cargar → 6. Ejecutar**, acompañado de la secuencia visual `PROGRAMAR → SIMULAR → PLACA REAL → COMPILAR → CARGAR → OBSERVAR`.
  - Ocultamiento por defecto de logs técnicos complejos para el estudiante y botón desplegable **Ver detalles técnicos** para diagnóstico docente (con sanitización automática de direcciones MAC y rutas locales).
  - Verificación de seguridad previa al upload: requiere puerto serie seleccionado, sketch actual compilado sin errores y acción explícita del estudiante (sin cargas automáticas al conectar la placa).
- **Capa de abstracción `HardwareBridge` (`src/hardware/hardwareBridge.ts`, `vite.config.ts`):**
  - Contrato desacoplado con las operaciones `listPorts()`, `compile()`, `upload()` (con progreso porcentual en vivo) y `openSerialMonitor()`.
  - Implementación local `LocalArduinoCliHardwareBridge` conectada al middleware local sobre Arduino CLI para validar la experiencia pedagógica completa sin utilizar manualmente la terminal.
- **Panel `Monitor de la placa` integrado en vivo:**
  - Transmisión serie en tiempo real a `115200` baudios por defecto, con controles para **Conectar / Desconectar**, **Limpiar consola** y liberación automática del puerto antes de iniciar una nueva carga.
- **Evidencia registrada:**
  - Captura de interfaz, sketch generado, resultado de compilación, resultado de upload y salida del Monitor Serie en [`evidence/hardware/ui-first-real-upload/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/ui-first-real-upload/README.md).

---

## [0.2.0-alpha.4 (V0.2D)] — 2026-10-25
### Hito: Primer ciclo físico Sensor → Decisión → Actuador (`mundo físico → sensor → dato → algoritmo → decisión → actuador físico`)
- **Validación física en dos etapas (`sensor de humedad de suelo → A0 → NodeMCU → condición creada en Blockly → D1/GPIO5 → relay`):**
  - **Etapa 1 — Calibración experimental de `A0` (`ANALOG_A0_PIN`):** Lectura bruta por Monitor Serie (`115200` baudios) sin conversión automática a porcentaje, registrando **`585–646`** con la sonda en condición húmeda y **`1024`** con la sonda seca.
  - **Etapa 2 — Condición por umbral experimental (`800`) y actuación sobre relay (`D1 / GPIO5`):** Programa originado en Bi-Tech IoT Studio (`si suelo > 800 → relayOn(); si no → relayOff()`) compilado y cargado en **`COM15`**.
  - Comprobación en tiempo real de que modificar físicamente la humedad detectada por la sonda cambia el dato leído (`1024` seco → `585–590` húmedo) y conmuta físicamente el módulo relay (`Relay ON` → `Relay OFF`).
  - Registro de `pins.analogA0.verifiedGpio = 'A0'` en [`nodeMcuConfig.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/nodeMcuConfig.ts) y evidencia sanitizada en [`evidence/hardware/nodemcu-soil-relay-cycle/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-soil-relay-cycle/README.md).

---

## [0.2.0-alpha.3 (V0.2C)] — 2026-10-25
### Hito: Primera entrada física con sensor DHT11 en NodeMCU ESP8266 (`D5 → GPIO14`)
- **Validación física del flujo `DHT11 (D5 / GPIO14) → NodeMCU ESP8266 → Arduino C/C++ generado desde Bi-Tech IoT Studio → lectura real por Monitor Serie`:**
  - Registro del pin verificado en [`nodeMcuConfig.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/nodeMcuConfig.ts): `DHT_PIN` asignado a **`D5` (`GPIO14`)**.
  - Instalación y registro de la librería `DHT sensor library@1.4.4` (`Adafruit Unified Sensor@1.1.12`) en Arduino CLI.
  - Inclusión condicional en [`arduinoGenerator.ts`](file:///j:/Bi-Tech-IoT-Studio/src/generators/arduinoGenerator.ts) de `#include <DHT.h>`, `DHT dht(DHT_PIN, DHT11)` y `dht.begin()` únicamente cuando el programa utiliza los bloques `temperatura` o `humedad ambiente`, manteniendo la abstracción pedagógica *sensor físico → dato → variable utilizable en el programa*.
  - Compilación (`esp8266:esp8266:nodemcuv2`), transferencia por **`COM15`** y comprobación en Monitor Serie (`115200` baudios) tanto en reposo (`22.6 °C` / `52.0 % – 54.0 %`) como ante variación térmica/húmeda directa (`26.7 °C → 28.0 °C` / `74.0 % → 76.0 %`).
  - Evidencia sanitizada guardada en [`evidence/hardware/nodemcu-dht11-first-reading/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-dht11-first-reading/README.md).

---

## [0.2.0-alpha.2 (V0.2B)] — 2026-10-25
### Hito: Primera salida física con relay controlada desde NodeMCU ESP8266 (`D1 → GPIO5`)
- **Validación física del flujo `Bi-Tech IoT Studio → Blockly → Arduino C/C++ → compilación → USB → NodeMCU → GPIO5 → relay físico`:**
  - Registro del pin verificado en [`nodeMcuConfig.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/nodeMcuConfig.ts): `RELAY_PIN` asignado a **`D1` (`GPIO5`)**.
  - Generación, compilación (`esp8266:esp8266:nodemcuv2`) y carga por **`COM15`** del programa de prueba ([`nodemcu-relay-first-control.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-relay-first-control/nodemcu-relay-first-control.ino)): estado inicial `relayOff()` y ciclo continuo `relayOn() -> delay(2000) -> relayOff() -> delay(2000)`.
  - Verificación en tiempo real por Monitor Serie (`Relay OFF` / `Relay ON`) y confirmación física de la conmutación del módulo relay cada 2 segundos.
  - Mantenimiento de `relayConfig.polarity: 'PENDING_VERIFICATION'` hasta contrastar el cierre del contacto con una carga física.
  - Evidencia documentada y sanitizada en [`evidence/hardware/nodemcu-relay-first-control/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-relay-first-control/README.md).

---

## [0.2.0-alpha.1 (V0.2A)] — 2026-10-25
### Hito: Primera transferencia real de un programa originado en Bi-Tech IoT Studio hacia hardware físico NodeMCU ESP8266
- **Validación física extremo a extremo (`Blockly → Arduino C/C++ → Compilación → USB → NodeMCU ESP8266 → Ejecución física`):**
  - Detección del puente USB-UART `Silicon Labs CP210x USB to UART Bridge` en el puerto **`COM15`**.
  - Identificación del microcontrolador real mediante `esptool.py`: `ESP8266EX` (`Crystal 26MHz`, `Flash 4MB`, `MAC [REDACTED]`).
  - Generación y compilación del programa mínimo de validación ([`nodemcu-first-flash.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-first-flash/nodemcu-first-flash.ino)) bajo el FQBN `esp8266:esp8266:nodemcuv2`, empleando `LED_BUILTIN` para `SALIDA_DIG_PIN` y telemetría serie a `115200` baudios.
  - Transferencia exitosa a flash (`270432 bytes` en `17.7 s`, hash verificado) y comprobación física mediante Monitor Serie (`Bi-Tech IoT Studio`, `NodeMCU conectada`, `Salida ON`, `Salida OFF`) y confirmación visual del parpadeo del LED azul integrado cada 1 segundo.
  - Registro sanitizado de evidencias en [`evidence/hardware/nodemcu-first-flash/`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-first-flash/README.md).

---

## [0.1.2] — 2026-10-25
### Hardware Readiness: Refinamiento de NodeMCU ESP8266, Sketch Compilable (`.ino`) y Validación con Arduino CLI
- **Refinamiento del Perfil NodeMCU (`src/types/hardware.ts`, `src/hardware/nodeMcuConfig.ts`):**
  - Separación explícita entre `physicalCapabilities` (`9` GPIOs digitales utilizables `D0–D8` en el módulo `ESP-12E`, `1` canal ADC `A0` de 10 bits `0–1023`) y `educationalAllocation` (subconjunto didáctico preconfigurado sobre pines seguros que evita bloqueos de arranque en los pines de *boot-strapping* `D3/GPIO0`, `D4/GPIO2`, `D8/GPIO15`).
- **Distinción entre Etiquetas de Placa (`Dx`) y GPIO Reales (`D1 → GPIO5`):**
  - Incorporación de `pinReferenceTable` (`D0–D8` y `A0`) y campos `boardLabel`, `verifiedGpio` (`null` hasta cerrar el cableado físico definitivo), `candidateBoardLabel` y `candidateGpio` (`D1 → GPIO5` para `RELAY_PIN`, `D2 → GPIO4` para `LUZ_PIN`, `D5 → GPIO14` para `DHT_PIN`, `D6 → GPIO12` para `ENTRADA_DIG_PIN`, `D7 → GPIO13` para `SALIDA_DIG_PIN`).
- **Entrada Analógica `A0` y Tensión No Asumida (`adcInputVoltageRange: 'unverified'`):**
  - Conservación de lecturas en escala bruta `0–1023` e incorporación del parámetro verificable `adcInputVoltageRange: 'unverified'`, documentando las diferencias de divisores resistivos entre placas ESP8266/NodeMCU (`0–1.0V` en el chip nativo vs `~0–3.2V/3.3V` en placas de desarrollo).
- **Generación Separada de Vista Educativa y Sketch Compilable (`.ino`) (`src/generators/arduinoGenerator.ts`, `src/components/ArduinoCodePanel.tsx`):**
  - Nueva salida `compilableSketch` que genera un archivo `.ino` completo con directivas `#include` según los bloques usados, definiciones `#define` comentadas con equivalencia `Dx → GPIO`, prototipos, `setup()` con estados seguros iniciales, `loop()` e implementación completa de funciones auxiliares, más botón de descarga `.ino`.
- **Programa Mínimo de Validación y Compilación Real con Arduino CLI:**
  - Configuración del programa inicial de validación en NodeMCU (`al iniciar -> apagar relay; repetir siempre -> si entrada analógica A0 < 400 -> encender relay / si no -> apagar relay`).
  - Verificación con `Arduino CLI 1.5.1` y core `esp8266:esp8266@3.1.2` bajo el FQBN oficial `esp8266:esp8266:nodemcuv2`, logrando compilación exitosa (`Exit code: 0`) sin librerías externas ni Wi-Fi.
- **Estado de Preparación en `Placa real` (`src/components/HeaderBar.tsx`):**
  - Visualización transparente de las 5 etapas de preparación (*1. Programa validado*, *2. Sketch generado (.ino)*, *3. Compilación correcta*, *4. Conectar placa — próxima etapa*, *5. Cargar firmware — próxima etapa*) sin simular falsamente el flasheo.
- **Documentación y Evidencia:**
  - Creación de `docs/decisions/ADR-006-hardware-readiness-compilable-sketch.md`.
  - Guardado del sketch compilado y log resumido en `evidence/hardware/nodemcu_validation_v012/` y captura en `evidence/screenshots/v0.1.2-nodemcu-hardware-readiness.png`.

---

## [0.1.1] — 2026-10-25
### Incorporación de NodeMCU ESP8266 y Arquitectura de Capacidades de Hardware
- **Capa Centralizada de Capacidades (`src/hardware/hardwareCapabilities.ts`):**
  - Definición declarativa `HardwareCapabilities` para cada dispositivo y filtrado dinámico de bloques sin condicionales acoplados.
- **Tercer Perfil Oficial: NodeMCU — ESP8266 (`src/hardware/nodeMcuConfig.ts`):**
  - Soporte para `DHT11`, única entrada analógica `A0` (`0–1023`), entrada/salida digital, relay e iluminación LED.
- **Validador Pedagógico de Restricciones de Hardware (`src/hardware/hardwareValidator.ts`):**
  - Advertencia pedagógica cuando un proyecto solicita más entradas analógicas que las disponibles en el dispositivo seleccionado.

---

## [0.1.0] — 2026-10-25
### Implementación del Prototipo Interactivo V0.1 (Segunda Tarea)
- Construcción de la interfaz inspirada en `evidence/prototypes/ui-reference-v0.1.png` con Blockly, generador Arduino C/C++ en vivo, simulador para `Garden Node Bi-Tech (ESP32)` y `Camera Node Bi-Tech (ESP32-CAM)` y manual contextual.

---

## [0.1.0-setup] — 2026-10-25
### Inicialización y Arquitectura Base (Primera Tarea)
- Inicialización del repositorio Git, estructura base, documentación fundacional y `ADR-001` a `ADR-004`.
