# ADR-005: Arquitectura de Capacidades de Hardware (`HardwareCapabilities`) e Incorporación de NodeMCU ESP8266

- **Estado:** Aceptado
- **Fecha:** 2026-10-25

## Contexto
En muchas instituciones educativas existen placas **NodeMCU (ESP8266)** que resultan valiosas para trabajar programación física, lectura de sensores, control de relés y conectividad IoT, además de estar disponibles en nuestro propio laboratorio para realizar la primera validación real del flujo completo (`Blockly → Arduino C/C++ → Compilación → USB → Placa física`).

Sin embargo, el microcontrolador `ESP8266` presenta diferencias físicas fundamentales respecto del `ESP32` (por ejemplo, dispone de **una única entrada analógica `A0`** de 10 bits frente a los múltiples canales ADC del `ESP32`). Si la aplicación utilizara condicionales dispersos del tipo `if (device === 'nodemcu')`, la interfaz se volvería frágil y difícil de extender a nuevos nodos educativos.

## Decisión
1. **Capa declarativa de capacidades (`HardwareCapabilities` en `src/hardware/hardwareCapabilities.ts`):** Cada perfil de dispositivo (`Garden Node Bi-Tech — ESP32`, `Camera Node Bi-Tech — ESP32-CAM`, `NodeMCU — ESP8266`) declara explícitamente sus capacidades físicas:
   - `digitalInputs`, `digitalOutputs`, `analogInputs`, `analogResolutionBits`, `pwmChannels`, `wifi`, `camera`, `relayChannels`, `compatibleSensors` y `compatibleActuators`.
2. **Catálogo de bloques guiado por capacidades (`getCatalogForCapabilities`):** El editor Blockly y la paleta de categorías determinan qué bloques mostrar consultando las capacidades del perfil activo, sin condicionales acoplados al identificador de una placa.
3. **Validador pedagógico de restricciones de hardware (`validateProgramAgainstCapabilities` en `src/hardware/hardwareValidator.ts`):** Antes de dar por válido el código generado, el sistema contrasta los recursos requeridos por el programa del estudiante contra `capabilities`. Si el programa solicita más entradas analógicas que `capabilities.analogInputs` (ej. intentar leer simultáneamente dos sensores analógicos distintos en `NodeMCU ESP8266`), el sistema muestra una **advertencia pedagógica explícita** en la interfaz y en el encabezado del código en lugar de emitir silenciosamente código inválido.

## Consecuencias
- Se hace visible para las y los estudiantes la relación: **problema → algoritmo → recursos necesarios → hardware disponible → programa**.
- Agregar futuros perfiles de hardware solo requiere registrar su objeto de configuración y capacidades en `HARDWARE_PROFILES_REGISTRY`.
