# Changelog — Bi-Tech IoT Studio

Todos los cambios relevantes de este proyecto se documentan en este archivo siguiendo un enfoque incremental y trazable.

---

## [0.1.0-setup] — 2026-10-25
### Inicialización y Arquitectura Base (Primera Tarea)
- Inicialización del repositorio Git y estructura de directorios para código (`src/`), documentación (`docs/`) y evidencias (`evidence/`).
- Incorporación de la imagen de referencia visual en `evidence/prototypes/ui-reference-v0.1.png`.
- Creación de `.gitignore` y `.env.example` bajo criterios de seguridad y privacidad (exclusión de credenciales Wi-Fi, claves API y datos de estudiantes).
- Documentación fundacional:
  - `README.md`: Visión general, dispositivos y estructura del proyecto.
  - `docs/PROJECT_CONTEXT.md`: Contexto en Escuela Estación Buenos Aires y Smart Garden Lab Bi-Tech.
  - `docs/ARCHITECTURE.md`: Arquitectura modular React + TypeScript + Blockly y desacoplamiento entre interfaz, generador y simulador.
  - `docs/HARDWARE.md`: Perfiles `Garden Node Bi-Tech` y `Camera Node Bi-Tech`, estado seguro de relés y tabla de supuestos pendientes (`SP-01` a `SP-08`).
  - `docs/PEDAGOGICAL_MODEL.md`: Relación `Bloque ↔ Código ↔ Comportamiento`, prohibición de bloques "caja negra" y diseño del manual contextual.
  - `docs/ROADMAP.md`: Plan evolutivo desde `V0.1` hasta `V1.0`.
- Creación de los primeros registros de decisiones arquitectónicas (ADRs):
  - `ADR-001-blockly.md`
  - `ADR-002-simulador-pedagogico.md`
  - `ADR-003-garden-node.md`
  - `ADR-004-camera-node.md`
