# ADR-002: Simulador Pedagógico de Sistema vs. Emulador Electrónico de Bajo Nivel

- **Estado:** Aceptado
- **Fecha:** 2026-10-25

## Contexto
Para que las y los estudiantes puedan probar sus algoritmos antes de transferirlos al hardware físico (o cuando trabajan en el aula sin una placa ESP32 por estudiante), se necesita un entorno de simulación integrado. Existían dos alternativas:
1. Emular eléctricamente el microcontrolador ESP32 a nivel de registros y pines.
2. Construir un **simulador pedagógico de sistema** centrado en variables físicas y estados de actuadores.

## Decisión
Desarrollar un **simulador pedagógico reactivo del sistema**, desacoplado de la emulación eléctrica de bajo nivel.

## Justificación
1. **Foco cognitivo:** El propósito didáctico es que el estudiante comprenda la cadena **sensor → dato → comparación → decisión → actuación**. Un simulador con controles deslizantes claros (`Temperatura`, `Humedad ambiente`, `Humedad del suelo`, `Nivel de luz`) permite verificar de inmediato qué ocurre cuando la humedad del suelo baja de `30` o sube a `50`.
2. **Soporte para Camera Node:** Emular electrónicamente un sensor de imagen `OV2640` carece de valor pedagógico en esta etapa; en cambio, simular la máquina de estados de la cámara (`ACTIVA/INACTIVA`, resolución, calidad, estado de streaming y contador de capturas) prepara conceptualmente al estudiante para usar la cámara real en `V0.3`.
3. **Simplicidad y rendimiento local:** Funciona instantáneamente en cualquier navegador escolar sin requerir compilación previa para cada prueba.

## Consecuencias
- El simulador evalúa la estructura lógica del programa construido en bloques contra el estado virtual actual de los sensores.
- Las particularidades eléctricas (como la calibración del ADC o la polaridad del relé) se explican en el **Manual Contextual** y se encapsulan en la configuración de hardware para la etapa de placa real (`V0.2`).
