# Changelog — Bi-Tech IoT Studio

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo un enfoque incremental y trazable.

---

## [0.1.1] — 2026-10-25
### Incorporación de NodeMCU ESP8266 y Arquitectura de Capacidades de Hardware
- **Capa Centralizada de Capacidades (`src/hardware/hardwareCapabilities.ts`):**
  - Definición declarativa `HardwareCapabilities` para cada dispositivo (`digitalInputs`, `digitalOutputs`, `analogInputs`, `pwmChannels`, `wifi`, `camera`, `relayChannels`, `compatibleSensors`, `compatibleActuators`).
  - Eliminación de condicionales específicos por placa en los componentes visuales: el catálogo de categorías y bloques se filtra dinámicamente mediante `getCatalogForCapabilities`.
- **Tercer Perfil Oficial: NodeMCU — ESP8266 (`src/hardware/nodeMcuConfig.ts`):**
  - Soporte completo para `DHT11`, única entrada analógica `A0` (`0–1023`), entrada digital (`HIGH/LOW`), salida digital, control de relay de 1 canal e iluminación LED, manteniendo pines simbólicos configurables.
- **Validador Pedagógico de Restricciones de Hardware (`src/hardware/hardwareValidator.ts`):**
  - Detección automática cuando un programa requiere más entradas analógicas que las disponibles físicamente en el dispositivo seleccionado (ej. intentar usar más de 1 sensor analógico en NodeMCU ESP8266), mostrando una alerta pedagógica clara en la interfaz y en el código Arduino generado.
- **Nuevos Bloques Blockly y Generación C/C++ para ESP8266 (`src/blocks/bitechBlocks.ts`, `src/generators/arduinoGenerator.ts`):**
  - Bloques `entrada analógica A0`, `entrada digital`, `operación matemática (+, -, *, /)`, `activar/desactivar salida digital` y `encender/apagar relay`.
  - Generación de funciones educativas `leerEntradaAnalogicaA0()`, `leerEntradaDigital()`, `relayOn()`, `relayOff()`, `activarSalidaDigital()` y `desactivarSalidaDigital()`.
- **Simulador Específico para NodeMCU y Manual Contextual Adaptativo (`src/simulator/programEvaluator.ts`, `src/manual/contextualManualData.ts`):**
  - Controles interactivos para `Temperatura (DHT11)`, `Humedad ambiente (DHT11)`, `Entrada analógica A0` (con selector de sensor conectado), `Entrada digital (HIGH/LOW)` y botón de prueba de restricción de límite analógico `A0`.
  - Panel `SISTEMA VIRTUAL · NODEMCU ESP8266` con estado en vivo de `Relay`, `Iluminación` y `Salida Digital`.
  - Adaptación de las fichas de `¿Qué hace este bloque?` según las capacidades del dispositivo seleccionado.
- **Documentación y Evidencia:**
  - Creación de `docs/decisions/ADR-005-multi-hardware-capabilities-nodemcu.md`.
  - Actualización de `ARCHITECTURE.md`, `HARDWARE.md`, `PEDAGOGICAL_MODEL.md`, `ROADMAP.md` y `README.md`.
  - Nuevas capturas de evidencia en `evidence/screenshots/` y ampliación de la suite de tests en `src/__tests__/studio.test.ts`.

---

## [0.1.0] — 2026-10-25
### Implementación del Prototipo Interactivo V0.1 (Segunda Tarea)
- Construcción de la interfaz inspirada en `evidence/prototypes/ui-reference-v0.1.png`.
- Integración de Google Blockly, generador Arduino C/C++ en vivo, simulador para `Garden Node Bi-Tech (ESP32)` y `Camera Node Bi-Tech (ESP32-CAM)`, manual contextual y persistencia local.

---

## [0.1.0-setup] — 2026-10-25
### Inicialización y Arquitectura Base (Primera Tarea)
- Inicialización del repositorio Git, estructura base, documentación fundacional y `ADR-001` a `ADR-004`.
