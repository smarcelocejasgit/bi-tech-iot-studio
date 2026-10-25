# ADR-001: Adopción de Blockly para el Editor Visual y Generador Educativo C/C++

- **Estado:** Aceptado
- **Fecha:** 2026-10-25

## Contexto
Bi-Tech IoT Studio requiere un entorno de programación visual por bloques que permita a estudiantes de nivel primario y secundario construir algoritmos para `ESP32` y `ESP32-CAM`, observando simultáneamente el código `Arduino C/C++` generado y recibiendo explicaciones contextuales al seleccionar cada bloque.

## Decisión
Utilizar **Google Blockly** (`blockly` sobre React y TypeScript) junto con un generador de código `Arduino C/C++` personalizado y un extractor de árbol lógico para el simulador.

## Justificación
1. **Extensibilidad de bloques:** Permite definir con precisión bloques específicos para el dominio educativo (`leerHumedadSuelo()`, `bombaOn()`, `iniciarStreaming()`) evitando bloques "caja negra" que oculten la lógica condicional.
2. **Control total del código generado:** A diferencia de generadores genéricos que producen código C/C++ ofuscado o difícil de leer, un generador propio sobre Blockly permite emitir funciones educativas limpias y mapear qué líneas de código pertenecen a cada bloque seleccionado.
3. **Eventos de interfaz ricos:** Blockly emite eventos nativos al seleccionar un bloque (`SELECTED`), lo que habilita la actualización inmediata del panel **¿Qué hace este bloque?** y el resaltado de código.

## Consecuencias
- Se debe mantener sincronizada la definición de cada bloque con tres artefactos: su generador C/C++, su comportamiento en el simulador y su ficha en el manual contextual.
