# Evidencia de Software Readiness — V0.4A: Preparación de Camera Node Bi-Tech (ESP32-CAM)

> [!IMPORTANT]
> **Estado actual: Sin validación física todavía.**
> Hoy no se dispone físicamente de la placa `ESP32-CAM`. Ningún paso que requiera hardware real (`Puerto USB`, `Cargar`, `Monitor Serie`, `Wi-Fi`, `Cámara`, `Streaming`) ha sido simulado ni registrado como exitoso; todos aparecen explícitamente como **Pendiente de validación con hardware**.

---

## Objetivo Validado Hoy

Dejar preparado y compilando de punta a punta:

**`Blockly → Arduino C/C++ (.ino) → compilación real para ESP32-CAM → interfaz Placa real (9 pasos) → configuración Wi-Fi segura → panel de streaming configurable`**

---

## 1. Toolchain ESP32 Instalada y Registrada

- **Core oficial instalado:** `esp32:esp32@2.0.17` (Espressif Systems) en `Arduino CLI 1.5.1`.
- **FQBN candidato identificado:** `esp32:esp32:esp32cam` (*AI Thinker ESP32-CAM*).
- **Supuesto pendiente documentado:** En [`cameraNodeConfig.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/cameraNodeConfig.ts), `verifiedFqbn` permanece en `null` y `candidateFqbn` se define como `'esp32:esp32:esp32cam'` hasta verificar físicamente el modelo exacto de la placa mañana en **V0.4B**.

---

## 2. Sketch Arduino C/C++ Compilable Generado desde Blockly

El generador ([`arduinoGenerator.ts`](file:///j:/Bi-Tech-IoT-Studio/src/generators/arduinoGenerator.ts)) produce un sketch `.ino` completo que incluye `#include "esp_camera.h"`, `#include <WiFi.h>` y `#include "esp_http_server.h"`, soportando:

- `configurarCamara()` (estructura `camera_config_t` para sensor `OV2640`);
- `seleccionarResolucion(...)` (`QVGA`, `CIF`, `VGA`, `SVGA`, `XGA`);
- `configurarCalidad(...)` (`10–63`);
- `iniciarCamara()` (`esp_camera_init` + mensaje serie `"Camera ready"`);
- `conectarWiFi(WIFI_SSID, WIFI_PASS)` (con placeholders seguros + mensajes serie `"WiFi connected"` e `"IP: ..."`);
- `iniciarStreaming()` / `detenerStreaming()` (servidor HTTP con `httpd_start` + mensaje serie `"Streaming started"`);
- `tomarCaptura()` (`esp_camera_fb_get` / `esp_camera_fb_return`).

---

## 3. Configuración Segura de Wi-Fi y Streaming sin Valores Hardcodeados

- **Wi-Fi:** Se crearon [`.env.example`](file:///j:/Bi-Tech-IoT-Studio/.env.example) y [`wifi_credentials.example.h`](file:///j:/Bi-Tech-IoT-Studio/wifi_credentials.example.h) con placeholders (`SSID_PENDIENTE_CONFIGURACION` / `PASS_PENDIENTE_CONFIGURACION`). Los archivos `.env`, `.env.local` y `wifi_credentials.h` están excluidos en [`.gitignore`](file:///j:/Bi-Tech-IoT-Studio/.gitignore).
- **Streaming:** En [`cameraSerialParser.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/cameraSerialParser.ts), [`RealBoardPanel.tsx`](file:///j:/Bi-Tech-IoT-Studio/src/components/RealBoardPanel.tsx) y [`VirtualSystemPanel.tsx`](file:///j:/Bi-Tech-IoT-Studio/src/components/VirtualSystemPanel.tsx) no se hardcodean IP, puerto, endpoint `/stream` ni URL completa; los campos quedan preparados para introducir o detectar esos datos cuando se conecte la cámara física.
- **Parser de Monitor Serie:** `parseCameraSerialOutput()` reconoce de forma tolerante y configurable `Camera ready`, `WiFi connected`, `IP: xxx.xxx.xxx.xxx` y `Streaming started`.

---

## Archivos Registrados en esta Carpeta

- [`camera-node-sketch.ino`](./camera-node-sketch.ino): Sketch `.ino` generado por Bi-Tech IoT Studio para `Camera Node Bi-Tech`.
- [`compile-result.txt`](./compile-result.txt): Resultado real de compilación con `arduino-cli compile --fqbn esp32:esp32:esp32cam`.
- [`toolchain-config.txt`](./toolchain-config.txt): Registro de versión del core ESP32 instalado y FQBN candidato.
- [`ui-camera-node-readiness-v04a.png`](./ui-camera-node-readiness-v04a.png): Captura de la interfaz en modo **Placa real** mostrando la compilación correcta y los pasos físicos en estado **Pendiente de validación con hardware**.
