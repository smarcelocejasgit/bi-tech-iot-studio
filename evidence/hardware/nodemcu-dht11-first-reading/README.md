# Evidencia V0.2C — Primera Entrada Física: Sensor DHT11 (NodeMCU ESP8266)

> **Hito validado:** `DHT11 (D5 / GPIO14) → NodeMCU ESP8266 → Arduino C/C++ generado desde Bi-Tech IoT Studio → lectura real por Monitor Serie`

## 1. Configuración y Pin Verificado
- **Dispositivo:** `NodeMCU 1.0 (ESP-12E Module)` — `ESP8266EX`
- **FQBN:** `esp8266:esp8266:nodemcuv2`
- **Puerto Serie:** `COM15` (`Silicon Labs CP210x USB to UART Bridge`)
- **Pin de datos verificado (`DHT_PIN`):** **`D5` en placa → `GPIO14` en ESP8266**
- **Alimentación:** `VCC → 3.3V` | `GND → GND`
- **Dependencia utilizada:** `DHT sensor library@1.4.4` (junto con `Adafruit Unified Sensor@1.1.12`), incluida en el sketch compilable únicamente cuando el programa utiliza los bloques `temperatura` o `humedad ambiente`.

## 2. Abstracción Pedagógica y Bloques Utilizados
Se utilizaron los bloques existentes de **Bi-Tech IoT Studio** manteniendo la cadena pedagógica **sensor físico → dato → variable utilizable en el programa**:
- `float temperatura = leerTemperatura();`
- `float humedadAmb = leerHumedadAmbiente();`
- `registrarDato("Temperatura", temperatura);`
- `registrarDato("Humedad", humedadAmb);`
- `delay(2000);`

## 3. Comprobación en Monitor Serie (`COM15` @ `115200` baudios)
1. **Lectura ambiental de reposo:**
   ```text
   Bi-Tech IoT Studio
   DHT11 conectado

   Temperatura: 22.6 °C
   Humedad: 54.0 %

   Temperatura: 22.6 °C
   Humedad: 53.0 %

   Temperatura: 22.6 °C
   Humedad: 52.0 %
   ```
2. **Respuesta física ante estímulo térmico/húmedo directo sobre el DHT11:**
   ```text
   Temperatura: 26.7 °C
   Humedad: 74.0 %

   Temperatura: 27.1 °C
   Humedad: 75.0 %

   Temperatura: 27.6 °C
   Humedad: 76.0 %

   Temperatura: 28.0 °C
   ```

## 4. Archivos de Evidencia
- [`nodemcu-dht11-first-reading.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-dht11-first-reading/nodemcu-dht11-first-reading.ino): Sketch exacto compilado y cargado.
- [`upload-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-dht11-first-reading/upload-log.txt): Registro sanitizado de instalación de librería, compilación y transferencia.
- [`serial-monitor-log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu-dht11-first-reading/serial-monitor-log.txt): Salida real del Monitor Serie (reposo y variación física).
