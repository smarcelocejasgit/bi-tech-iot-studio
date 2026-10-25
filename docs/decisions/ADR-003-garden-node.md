# ADR-003: Configuración Centralizada y Estado Seguro para Garden Node Bi-Tech

- **Estado:** Aceptado
- **Fecha:** 2026-10-25

## Contexto
El dispositivo **Garden Node Bi-Tech** está compuesto por un `ESP32`, un sensor `DHT11`, un sensor de humedad de suelo, un sensor `LDR` y un módulo relay de dos canales (Canal 1: bomba de agua; Canal 2: iluminación LED). Sin embargo, las asignaciones definitivas de pines GPIO y la polaridad de activación del módulo relay (`ACTIVE LOW` vs `ACTIVE HIGH`) aún deben verificarse físicamente en el laboratorio.

## Decisión
1. **No inventar números de GPIO definitivos:** Utilizar constantes simbólicas (`DHT_PIN`, `SUELO_PIN`, `LDR_PIN`, `BOMBA_PIN`, `LUZ_PIN`) centralizadas en `src/hardware/gardenNodeConfig.ts`.
2. **Garantizar estado seguro inicial (`OFF`):** En el código `setup()` generado, tanto la bomba como la iluminación se inicializan explícitamente en estado apagado (`bombaOff()`, `luzOff()`).
3. **Polaridad de relay configurable:** Abstraer el nivel lógico de encendido/apagado (`RELAY_ON` / `RELAY_OFF`) para que cambiar entre un módulo activo en bajo (`LOW`) o activo en alto (`HIGH`) requiera modificar un único parámetro de configuración.
4. **No asumir porcentaje calibrado en humedad de suelo:** Documentar y presentar la lectura de `leerHumedadSuelo()` como valor numérico sin asumir una conversión automática a porcentaje hasta realizar la calibración real.

## Consecuencias
- El código C/C++ que ven los estudiantes durante la `V0.1` utiliza identificadores semánticos limpios y seguros.
- Cuando se releve el conexionado definitivo en laboratorio, se actualizará únicamente `src/hardware/gardenNodeConfig.ts` sin alterar los bloques ni el simulador.
