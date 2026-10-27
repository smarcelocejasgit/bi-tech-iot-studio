# Garden Node ESP32 — DHT11 y Wi-Fi validados

- Placa: ESP32-D0WD-V3 rev. 3.0, FQBN `esp32:esp32:esp32`.
- DHT11: conector `D21` de la expansora → `GPIO21`.
- Lectura validada: temperatura y humedad estables, sin `NaN` ni timeouts.
- Wi-Fi: conexión estable durante 22 lecturas consecutivas, sin resets ni desconexiones.
- El pin queda registrado como **DHT11 — validado físicamente en el banco actual**, no como pinout definitivo completo.

El sketch de esta carpeta conserva la lectura física validada y prepara el siguiente enlace HTTPS. Las credenciales se cargan exclusivamente desde `wifi_credentials.h` y `device_credentials.h`, ambos ignorados por Git. El cliente TLS valida el certificado del servidor y nunca utiliza `setInsecure()`.

La transmisión productiva permanece pendiente hasta habilitar manualmente la infraestructura Firebase y desplegar la Function/RTDB.
