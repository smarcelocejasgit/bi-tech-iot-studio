# Especificación de Hardware y Supuestos Pendientes

> [!IMPORTANT]
> Ningún pin físico (GPIO) ni dirección de red ha sido inventado como definitivo. Toda asignación se gestiona mediante constantes simbólicas y archivos de configuración centralizados (`src/hardware/`) para su actualización una vez verificado el conexionado real en laboratorio.

---

## 1. Matriz Comparativa de Capacidades (`HardwareCapabilities`)

| Característica | Garden Node Bi-Tech (`ESP32`) | Camera Node Bi-Tech (`ESP32-CAM`) | NodeMCU (`ESP8266`) |
| :--- | :--- | :--- | :--- |
| **Microcontrolador** | `ESP32` | `ESP32-CAM` | `ESP8266` (`ESP-12E`) |
| **Entradas Analógicas (ADC)** | Múltiples (`4` canales ADC1) | `0` (ocupados por cámara) | **`1` única entrada (`A0`, 0–1023)** |
| **Entradas / Salidas Digitales** | `6` / `6` | `1` / `1` | `4` / `4` |
| **Canales de Relay** | `2` (Bomba + Iluminación) | `0` | `1` (Relay de propósito general) |
| **Cámara OV2640** | No | **Sí** (`OV2640`) | No |
| **Conectividad Wi-Fi** | Sí | Sí (Streaming y control) | Sí (Telemetría e IoT) |

---

## 2. Perfil A: Garden Node Bi-Tech (`ESP32`)
- **Sensores:** `DHT11` (`leerTemperatura()`, `leerHumedadAmbiente()`), `Humedad del Suelo` (`leerHumedadSuelo()`), `LDR` (`leerNivelLuz()`).
- **Actuadores:** Relay de 2 canales (`bombaOn()`, `bombaOff()`, `luzOn()`, `luzOff()`) con estado inicial seguro `OFF`.

---

## 3. Perfil B: Camera Node Bi-Tech (`ESP32-CAM`)
- **Hardware:** `ESP32-CAM` + sensor `OV2640` + `Wi-Fi`.
- **Modelo de operación:** **USB** para programación; **Wi-Fi** para comunicación y streaming (endpoint configurable).
- **Funciones educativas:** `configurarCamara()`, `seleccionarResolucion()`, `configurarCalidad()`, `iniciarCamara()`, `conectarWiFi()`, `iniciarStreaming()`, `detenerStreaming()`, `tomarCaptura()`.

---

## 4. Perfil C: NodeMCU (`ESP8266`)
- **Propósito educativo:** Placa ampliamente presente en instituciones educativas y disponible físicamente en nuestro laboratorio para la primera validación de compilación y carga real en `V0.2`.
- **Sensores compatibles:**
  - Sensor digital `DHT11` (`leerTemperatura()`, `leerHumedadAmbiente()`).
  - **Única entrada analógica `A0`** (`leerEntradaAnalogicaA0()`, o `leerHumedadSuelo()` / `leerNivelLuz()` ocupando el único canal `A0`).
  - Entrada digital (`leerEntradaDigital()`).
- **Actuadores compatibles:**
  - Salida digital (`activarSalidaDigital()`, `desactivarSalidaDigital()`).
  - Módulo Relay de 1 canal (`relayOn()`, `relayOff()`).
  - Iluminación LED (`luzOn()`, `luzOff()`).
- **Restricción física validada por el entorno:** Si un estudiante intenta utilizar simultáneamente más de 1 sensor analógico en NodeMCU, el validador de capacidades muestra la advertencia:
  > *"Este proyecto requiere más entradas analógicas que las disponibles en el dispositivo seleccionado."*

---

## 5. Registro de Supuestos Pendientes de Verificación en Laboratorio

| ID | Dispositivo | Elemento Pendiente | Estado Actual en V0.1.1 | Acción Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **SP-01 a SP-04** | Garden Node | GPIOs para `DHT11`, `Suelo`, `LDR`, `Bomba` y `Luz` | Simbólicos (`DHT_PIN`, etc.) | Verificar en placa del Smart Garden Lab. |
| **SP-05** | Garden Node | Polaridad de activación del módulo Relay de 2 canales | Configurable | Medir en placa física (`ACTIVE_LOW` vs `ACTIVE_HIGH`). |
| **SP-06** | Garden Node | Rango de calibración de humedad de suelo | Lectura numérica cruda | Relevar valores en tierra seca y húmeda. |
| **SP-07 y SP-08** | Camera Node | Endpoint HTTP de streaming MJPEG e IP en red escolar | URL configurable (`null`) | Verificar firmware en `ESP32-CAM`. |
| **SP-09 a SP-14** | NodeMCU ESP8266 | Asignación de pines digitales (`D1`–`D7`) para `DHT11`, `ENTRADA_DIG_PIN`, `SALIDA_DIG_PIN`, `RELAY_PIN` y `LUZ_PIN` | Simbólicos en `nodeMcuConfig.ts` | Verificar sobre la placa física NodeMCU ESP8266 disponible para `V0.2`. |
