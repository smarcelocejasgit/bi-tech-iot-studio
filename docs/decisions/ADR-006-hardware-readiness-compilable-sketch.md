# ADR-006: Separación entre Capacidades Físicas vs. Perfil Educativo y Generación de Sketch Compilable (`.ino`)

- **Estado:** Aceptada
- **Fecha:** 2026-10-25
- **Versión objetivo:** V0.1.2 (Hardware Readiness)

---

## Contexto

Al preparar **Bi-Tech IoT Studio** para su primera prueba sobre hardware físico con una placa **NodeMCU ESP8266 (ESP-12E)**, surgieron cuatro desafíos pedagógicos y técnicos:

1. **Diferencia entre límite físico de una placa y asignación de un perfil educativo:**
   El módulo ESP-12E de la NodeMCU expone **9 pines GPIO digitales utilizables (`D0` a `D8`)** y **1 entrada analógica (`A0`)**. Sin embargo, los pines `D3 (GPIO0)`, `D4 (GPIO2)` y `D8 (GPIO15)` intervienen en el proceso de arranque (*boot-strapping*) del chip ESP8266: si un estudiante conecta allí un sensor o módulo que fuerce un estado lógico inadecuado al energizar la placa, el microcontrolador no arranca. Presentar un subconjunto seguro (p. ej. 4 entradas / 4 salidas digitales) como si fuera el límite físico total de la NodeMCU induciría un error conceptual sobre el hardware.
2. **Nomenclatura dual de pines (`Dx` vs `GPIO`):**
   Las placas NodeMCU tienen impresas en su serigrafía las etiquetas `D0`, `D1`, `D2`... `D8` y `A0`, que **no coinciden** numéricamente con los GPIO internos del chip ESP8266 (por ejemplo, `D1` corresponde a `GPIO5`, `D2` a `GPIO4`, `D5` a `GPIO14`).
3. **Rango eléctrico de la entrada analógica `A0`:**
   El conversor analógico-digital (ADC de 10 bits, escala cruda `0–1023`) del chip ESP8266EX admite nativamente `0–1.0V`. Muchas placas de desarrollo NodeMCU agregan un divisor resistivo en placa para admitir hasta `~3.2V` o `3.3V`, pero existen clones y revisiones con divisores distintos. Asumir una tensión máxima universal sin verificar antes la placa física del aula puede inducir errores de medición o dañar el canal analógico.
4. **Necesidad de dos vistas de código Arduino C/C++:**
   La vista de código compacta (`setup()` + `loop()` con funciones pedagógicas como `leerEntradaAnalogicaA0()`, `relayOn()`, `relayOff()`) es ideal para que los estudiantes comprendan el algoritmo sin ruido visual, pero el compilador real (`arduino-cli`) requiere un archivo `.ino` completo con directivas `#include`, definiciones `#define`, prototipos e implementación de todas las funciones auxiliares.

---

## Decisión

1. **Separar explícitamente `physicalCapabilities` y `educationalAllocation` en `HardwareCapabilities`:**
   - `physicalCapabilities` documenta la realidad física del dispositivo (`totalUsableGpios: 9` en `D0–D8`, `analogInputs: 1` en `A0`, resolución de 10 bits `0–1023`).
   - `educationalAllocation` describe el subconjunto didáctico preconfigurado para el aula y explica explícitamente por qué se priorizan los pines seguros (`D1/GPIO5`, `D2/GPIO4`, `D5/GPIO14`, `D6/GPIO12`, `D7/GPIO13`) frente a los pines de *boot-strapping* (`D3/GPIO0`, `D4/GPIO2`, `D8/GPIO15`).
2. **Incorporar mapeo explícito `Etiqueta de Placa (Dx) → GPIO Real`:**
   - Cada pin simbólico en `NODEMCU_ESP8266_CONFIG` conserva `verifiedGpio: null` hasta cerrar el cableado definitivo en el laboratorio, pero declara `candidateBoardLabel` y `candidateGpio` (ej. `D1 → GPIO5` para `RELAY_PIN`) junto con la tabla completa de referencia `pinReferenceTable` (`D0–D8` y `A0`).
3. **Parametrizar `adcInputVoltageRange: 'unverified'`:**
   - Se mantiene la simulación y generación de código de `A0` en escala bruta (`0–1023`) y se registra explícitamente `adcInputVoltageRange: 'unverified'` en la configuración del dispositivo hasta verificar el divisor resistivo de la placa física.
4. **Generar dos salidas separadas en `generateArduinoCode`:**
   - **Vista educativa (`compactCode`):** centrada en `setup()` y `loop()`, sincronizada línea por línea con los bloques visuales.
   - **Sketch completo para hardware (`compilableSketch`):** archivo `.ino` autocontenido y 100 % compilable con `arduino-cli` bajo el FQBN verificado `esp8266:esp8266:nodemcuv2`, incluyendo solo las librerías requeridas por los bloques utilizados.

---

## Consecuencias

- **Positivas:**
  - Rigor técnico y honestidad pedagógica: el estudiante y el docente distinguen entre las capacidades físicas reales del chip y las decisiones de diseño del perfil educativo.
  - El código generado por Bi-Tech IoT Studio pasa de ser únicamente ilustrativo a ser verificable mediante compilación real con `arduino-cli` (`FQBN: esp8266:esp8266:nodemcuv2`).
  - Se evita simular falsamente una carga de firmware antes de conectar físicamente la placa en V0.2, mostrando con transparencia las 5 etapas de preparación (*Hardware Readiness*).
- **Compromisos:**
  - El generador debe mantener sincronizadas ambas salidas (`compactCode` y `compilableSketch`) a partir del mismo árbol sintáctico (`ParsedProgram`).
