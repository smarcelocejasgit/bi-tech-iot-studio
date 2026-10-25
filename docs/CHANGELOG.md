# Changelog — Bi-Tech IoT Studio

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo un enfoque incremental y trazable.

---

## [0.1.0] — 2026-10-25
### Implementación del Prototipo Interactivo V0.1 (Segunda Tarea)
- **Interfaz y Experiencia Educativa (`src/components/`):**
  - Construcción de la interfaz inspirada en `evidence/prototypes/ui-reference-v0.1.png` con jerarquía visual clara y diseño *responsive*.
  - Selector de perfil de dispositivo en vivo entre **Garden Node Bi-Tech · ESP32** y **Camera Node Bi-Tech · ESP32-CAM**.
  - Selector de modos de trabajo: **Programar**, **Simular** y **Placa real** (marcado con insignia `Próximamente` para V0.2 sin simular cargas inexistentes).
- **Editor Visual Blockly (`src/blocks/bitechBlocks.ts`):**
  - Integración real de **Google Blockly** con bloques educativos personalizados organizados en `Inicio`, `Sensores`, `Control`, `Actuadores`, `Cámara`, `Datos` e `IoT`.
  - Cumplimiento estricto del principio pedagógico: sin bloques "caja negra" (`regar automáticamente`); el estudiante construye la condición lógica completa.
  - Extractor de árbol sintáctico (`parseWorkspaceToProgram`) desacoplado de la interfaz.
- **Generador de Código Arduino C/C++ (`src/generators/arduinoGenerator.ts`):**
  - Traducción automática en vivo a funciones educativas (`leerTemperatura()`, `leerHumedadAmbiente()`, `leerHumedadSuelo()`, `leerNivelLuz()`, `bombaOn()`, `bombaOff()`, `luzOn()`, `luzOff()`, `configurarCamara()`, `iniciarCamara()`, `iniciarStreaming()`, `detenerStreaming()`, `tomarCaptura()`).
  - Uso de constantes simbólicas (`BOMBA_PIN`, `LUZ_PIN`, `DHT_PIN`, `SUELO_PIN`, `LDR_PIN`) sin inventar GPIOs definitivos.
  - Resaltado de líneas de código vinculadas al bloque seleccionado y vista conmutable entre *Vista resumida* y *Sketch con declaraciones*.
- **Simulador Pedagógico Reactivo (`src/simulator/programEvaluator.ts`):**
  - Interpretación directa del programa construido por el estudiante en Blockly.
  - Controles deslizantes e inputs numéricos para **Garden Node** (`Temperatura`, `Humedad ambiente`, `Humedad del suelo`, `Nivel de luz`), escena SVG interactiva **Smart Garden Virtual** (animación de riego e iluminación LED) y mensaje explicativo dinámico.
  - Simulador de estados para **Camera Node** (`ACTIVA/INACTIVA`, `Resolución`, `Calidad JPEG`, `Streaming ON/OFF`, contador de `Capturas` y hora de `Última captura`).
- **Manual Contextual (`src/manual/contextualManualData.ts`):**
  - Panel inferior interactivo **¿Qué hace este bloque?** que se actualiza al seleccionar cualquier bloque mostrando función, componente físico, tipo de dato, comportamiento, código Arduino y observaciones técnicas (incluyendo advertencia sobre calibración de humedad de suelo).
- **Persistencia Local y Pruebas (`src/services/localPersistence.ts`, `src/__tests__/studio.test.ts`):**
  - Almacenamiento en `localStorage` del nombre del proyecto y programas por dispositivo.
  - Suite de pruebas automatizadas con `Vitest` (8 tests unitarios de hardware, generador C/C++, simulador y manual contextual).

---

## [0.1.0-setup] — 2026-10-25
### Inicialización y Arquitectura Base (Primera Tarea)
- Inicialización del repositorio Git y estructura de directorios para código (`src/`), documentación (`docs/`) y evidencias (`evidence/`).
- Incorporación de la imagen de referencia visual en `evidence/prototypes/ui-reference-v0.1.png`.
- Creación de `.gitignore` y `.env.example` bajo criterios de seguridad y privacidad.
- Documentación fundacional (`README.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `HARDWARE.md`, `PEDAGOGICAL_MODEL.md`, `ROADMAP.md`, `CHANGELOG.md`) y registros `ADR-001` a `ADR-004`.
