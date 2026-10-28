# Garden Node ESP32 — DHT11 y Wi-Fi validados

- Placa: ESP32-D0WD-V3 rev. 3.0, FQBN `esp32:esp32:esp32`.
- DHT11: conector `D21` de la expansora → `GPIO21`.
- Lectura validada: temperatura y humedad estables, sin `NaN` ni timeouts.
- Wi-Fi: conexión estable durante 22 lecturas consecutivas, sin resets ni desconexiones.
- El pin queda registrado como **DHT11 — validado físicamente en el banco actual**, no como pinout definitivo completo.

El sketch de esta carpeta conserva la lectura física validada y envía la última lectura al gateway HTTPS Bi-Tech. Las credenciales, el canal y la URL del gateway se cargan exclusivamente desde `wifi_credentials.h` y `device_credentials.h`, ambos ignorados por Git. El cliente TLS valida el certificado del servidor y nunca utiliza `setInsecure()`.

El gateway mantiene en memoria una única lectura por canal. Firebase se utiliza solamente para publicar el frontend de IoT Studio y Smart Garden Lab.

## PENDIENTE DE VALIDACIÓN EN ESCUELA

El sketch compila para `esp32:esp32:esp32` y queda preparado para Canal 1, pero todavía no fue cargado con esta arquitectura. Falta validar físicamente:

`Garden Node ESP32 + DHT11 GPIO21 + Canal 1 → gateway → túnel HTTPS → Smart Garden Lab`
