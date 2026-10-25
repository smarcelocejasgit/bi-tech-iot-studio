# Changelog — Bi-Tech IoT Studio

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo un enfoque incremental y trazable.

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
