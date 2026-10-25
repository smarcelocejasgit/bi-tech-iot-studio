# Evidencia de Hardware — V0.2D: Primer Ciclo Físico Sensor → Decisión → Actuador

## Hito Validado

**`mundo físico → sensor → dato → algoritmo → decisión → actuador físico`**

Flujo físico completo verificado sobre la placa real:

**`sensor de humedad de suelo → A0 → NodeMCU ESP8266 → condición creada en Blockly → D1/GPIO5 → relay`**

---

## Hardware y Entorno Verificados

- **Placa:** NodeMCU ESP8266 (`ESP8266EX` / módulo `ESP-12E`)
- **FQBN:** `esp8266:esp8266:nodemcuv2`
- **Puerto Serie:** `COM15` (`Silicon Labs CP210x USB to UART Bridge`, `115200` baudios)
- **Entrada analógica verificada (`ANALOG_A0_PIN`):** **`A0` (`ADC0`)** — Sonda de humedad de suelo conectada a `A0` (lectura bruta `0–1023` sin conversión automática a porcentaje)
- **Salida de actuación verificada (`RELAY_PIN`):** **`D1` (`GPIO5`)** — Módulo relay conectado en `D1 / GPIO5` (sin bomba conectada)

---

## Etapa 1 — Calibración Experimental del Sensor en `A0`

Antes de conectar la lógica de decisión al relay, se cargó el sketch de lectura pura ([`stage1_soil_a0_reading.ino`](./stage1_soil_a0_reading/stage1_soil_a0_reading.ino)) y se midió el rango físico real entregado por el módulo en `A0`:

| Condición física de la sonda | Valor bruto medido en `A0` |
| :--- | :--- |
| **Sonda en condición húmeda** | **`585 – 646`** |
| **Sonda seca (en aire)** | **`1024`** |

- **Observación:** El módulo acondicionador entrega tensión alta en estado seco (`~1024`) y disminuye su tensión cuando aumenta la humedad en la sonda (`~585–646`).
- **Umbral experimental adoptado:** **`800`** (punto intermedio franco entre condición húmeda y condición seca).

---

## Etapa 2 — Condición en Blockly y Conmutación del Relay

Con el umbral experimental `800`, se construyó en **Bi-Tech IoT Studio** el programa de control ([`nodemcu-soil-relay-cycle.ino`](./nodemcu-soil-relay-cycle.ino)):

- **Si `suelo > 800`** (suelo seco): activar relay (`relayOn()`)
- **Si no** (`suelo <= 800`, suelo húmedo): apagar relay (`relayOff()`)

### Resultado Verificado

1. **Con sonda seca (`suelo = 1024 > 800`):**
   - Monitor Serie reporta `Humedad suelo (A0 bruto): 1024` y `Relay ON`.
   - El módulo relay permanece en estado activo.
2. **Al colocar la sonda en humedad (`suelo = 585–590 <= 800`):**
   - Monitor Serie reporta `Humedad suelo (A0 bruto): 586` y `Relay OFF`.
   - El módulo relay conmuta físicamente en tiempo real al cruzar el umbral.

---

## Archivos de Evidencia

- [`stage1_soil_a0_reading/stage1_soil_a0_reading.ino`](./stage1_soil_a0_reading/stage1_soil_a0_reading.ino): Sketch de la Etapa 1 (lectura bruta de `A0` por Monitor Serie).
- [`nodemcu-soil-relay-cycle.ino`](./nodemcu-soil-relay-cycle.ino): Sketch compilable de la Etapa 2 originado en Bi-Tech IoT Studio con umbral experimental `800`.
- [`upload-log.txt`](./upload-log.txt): Log de compilación y carga por USB en `COM15` (datos sensibles redactados).
- [`serial-monitor-log.txt`](./serial-monitor-log.txt): Captura real del Monitor Serie en ambas etapas (`1024 -> Relay ON` y `585–590 -> Relay OFF`).
