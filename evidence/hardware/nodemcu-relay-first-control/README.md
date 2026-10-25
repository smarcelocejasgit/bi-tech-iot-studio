# Evidencia V0.2B — Primera Salida Física con Relay (NodeMCU ESP8266)

> **Hito validado:** `Bi-Tech IoT Studio → Blockly → Arduino C/C++ → compilación → USB → NodeMCU → GPIO5 → relay físico`

## 1. Configuración y Pin Verificado
- **Dispositivo:** `NodeMCU 1.0 (ESP-12E Module)` — `ESP8266EX`
- **FQBN:** `esp8266:esp8266:nodemcuv2`
- **Puerto Serie:** `COM15` (`Silicon Labs CP210x USB to UART Bridge`)
- **Pin de control verificado (`RELAY_PIN`):** **`D1` en placa → `GPIO5` en ESP8266** conectado a la entrada del módulo relay (`IN` / `IN1`).
- **Estado de polaridad (`ACTIVE_LOW` / `ACTIVE_HIGH`):** `PENDING_VERIFICATION` (se comprobó físicamente la conmutación periódica cada 2 segundos del módulo relay sin carga; la polaridad absoluta `ACTIVE_LOW` vs `ACTIVE_HIGH` se cerrará de forma inequívoca al contrastar con la carga conectada al contacto normal abierto `NO`).

## 2. Programa de Prueba Ejecutado
```text
al iniciar:
- apagar relay

repetir siempre:
- encender relay
- esperar 2 segundos
- apagar relay
- esperar 2 segundos
```

## 3. Comandos Ejecutados
- **Compilación:**
  ```powershell
  arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 "evidence/hardware/nodemcu-relay-first-control"
  ```
- **Transferencia (Upload):**
  ```powershell
  arduino-cli upload -p COM15 --fqbn esp8266:esp8266:nodemcuv2 "evidence/hardware/nodemcu-relay-first-control" -v
  ```

## 4. Salida Real del Monitor Serie (`COM15` @ `115200` baudios) y Confirmación Física
```text
Bi-Tech IoT Studio
NodeMCU conectada
Relay OFF
Relay ON
Relay OFF
Relay ON
Relay OFF
Relay ON
Relay OFF
```
- **Comprobación física:** El módulo relay conectado a `D1 / GPIO5` conmuta de forma visible y audible cada 2 segundos en correspondencia con el ciclo ejecutado por la NodeMCU.

## 5. Archivos de Evidencia
- [`nodemcu-relay-first-control.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-relay-first-control/nodemcu-relay-first-control.ino): Sketch exacto generado y cargado en la placa.
- [`upload-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-relay-first-control/upload-log.txt): Registro sanitizado de compilación y transferencia.
- [`serial-monitor-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-relay-first-control/serial-monitor-log.txt): Salida capturada del Monitor Serie.
