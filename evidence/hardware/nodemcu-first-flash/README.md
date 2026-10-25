# Evidencia V0.2A — Primera Transferencia a Hardware Real (NodeMCU ESP8266)

> **Hito registrado:** Primera transferencia real de un programa originado en Bi-Tech IoT Studio hacia hardware físico NodeMCU ESP8266.

## 1. Datos de la Placa Física Detectada
- **Modelo de placa:** `NodeMCU 1.0 (ESP-12E Module)`
- **Puerto Serie utilizado durante la prueba:** `COM15` (`Silicon Labs CP210x USB to UART Bridge (COM15)`)
- **Microcontrolador detectado por `esptool.py`:** `ESP8266EX` (Cristal `26MHz`, Flash `4MB`, MAC `[REDACTED]`)
- **FQBN utilizado:** `esp8266:esp8266:nodemcuv2`

## 2. Resolución de Incidentes Reales durante la Prueba
1. **Driver USB CP2102 (`CM_PROB_FAILED_INSTALL` / Código 28):** Se identificó el puente USB-UART `Silicon Labs CP2102` y se instaló el controlador firmado `Silicon Labs CP210x VCP` (`slabvcp.inf`), habilitando el puerto `COM15`.
2. **Bloqueo de puerto (`PermissionError 13: Acceso denegado`):** Se detectó que instancias abiertas de `UltiMaker Cura` retenían `COM15` mediante su plugin de impresión USB; al cerrarlas quedó liberado el puerto serie.

## 3. Comandos Ejecutados
- **Compilación:**
  ```powershell
  arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 "evidence/hardware/nodemcu-first-flash"
  ```
- **Transferencia (Upload):**
  ```powershell
  arduino-cli upload -p COM15 --fqbn esp8266:esp8266:nodemcuv2 "evidence/hardware/nodemcu-first-flash" -v
  ```
- **Resultado de carga:** `Wrote 270432 bytes (198878 compressed) at 0x00000000 in 17.7 seconds (effective 122.3 kbit/s)... Hash of data verified. Hard resetting via RTS pin...`

## 4. Salida Real del Monitor Serie (`COM15` @ `115200` baudios) y Verificación Visual
```text
Bi-Tech IoT Studio
NodeMCU conectada
Salida OFF
Salida ON
Salida OFF
Salida ON
Salida OFF
Salida ON
Salida OFF
Salida ON
```
- **Confirmación visual física:** El LED azul integrado (`LED_BUILTIN`) de la NodeMCU parpadea de forma continua con el ciclo programado de 1 segundo encendido / 1 segundo apagado.

## 5. Archivos en esta Carpeta
- [`nodemcu-first-flash.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-first-flash/nodemcu-first-flash.ino): Sketch exacto compilado y transferido a la NodeMCU.
- [`upload-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-first-flash/upload-log.txt): Registro sanitizado de detección, compilación y flasheo con `esptool.py`.
- [`serial-monitor-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-first-flash/serial-monitor-log.txt): Captura en vivo de la salida del Monitor Serie en `COM15`.
