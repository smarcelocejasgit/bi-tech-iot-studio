# Especificación de Hardware y Preparación Física (V0.1.2 — Hardware Readiness)

> [!IMPORTANT]
> Ningún cableado definitivo de aula (`verifiedGpio`) ni dirección de red ha sido fijado de manera arbitraria. Toda asignación se gestiona mediante constantes simbólicas y archivos de configuración centralizados (`src/hardware/`), distinguiendo explícitamente entre **capacidades físicas del hardware**, **recursos habilitados por el perfil educativo**, **etiquetas serigrafiadas en placa (`D0`–`D8`, `A0`)** y **números de GPIO reales del chip**.

---

## 1. Distinción entre Capacidades Físicas y Perfil Educativo

| Característica | Garden Node Bi-Tech (`ESP32`) | Camera Node Bi-Tech (`ESP32-CAM`) | NodeMCU (`ESP8266`) |
| :--- | :--- | :--- | :--- |
| **Microcontrolador / Módulo** | `ESP32-WROOM-32` | `ESP32-S` + `OV2640` | `ESP8266EX` (`ESP-12E`) |
| **FQBN Verificado (Arduino CLI)** | `esp32:esp32:esp32` *(pendiente instalar core)* | `esp32:esp32:esp32cam` *(pendiente instalar core)* | **`esp8266:esp8266:nodemcuv2`** *(verificado con core `3.1.2`)* |
| **GPIO Digitales Físicos Utilizables** | `22` GPIOs | `2` libres (resto cámara) | **`9` GPIOs físicos (`D0` a `D8`)** |
| **Recursos Expuestos en Perfil Educativo** | `1` entrada dig. + `DHT11`, `2` salidas relay | Cámara + Flash LED | **`1` entrada dig. + `DHT11`, `3` salidas (`Relay`, `Luz`, `Salida Dig.`)** |
| **Entradas Analógicas Físicas (ADC)** | `6` canales `ADC1` (`12 bits`, `0–4095`) | `0` disponibles con Wi-Fi activo | **`1` única entrada (`A0`, `10 bits`, escala bruta `0–1023`)** |
| **Rango de Tensión en ADC (`adcInputVoltageRange`)** | `unverified` | `unverified` | **`unverified`** *(ver nota técnica A0)* |

> [!NOTE]
> **¿Por qué el perfil educativo de NodeMCU expone un subconjunto de entradas/salidas digitales en lugar de los 9 GPIOs físicos?**
> En el módulo ESP-12E, los pines `D3 (GPIO0)`, `D4 (GPIO2)` y `D8 (GPIO15)` determinan el modo de arranque (*boot-strapping*). Si un circuito externo fuerza `D3` o `D4` a `LOW`, o `D8` a `HIGH` al energizar la placa, el microcontrolador no inicia el programa. Por ello, el perfil educativo preconfigura las funciones de aula sobre los 5 pines digitales seguros (`D1/GPIO5`, `D2/GPIO4`, `D5/GPIO14`, `D6/GPIO12` y `D7/GPIO13`).

---

## 2. Tabla de Nomenclatura de Pines NodeMCU (`Etiqueta de Placa → GPIO Real`)

En las placas **NodeMCU ESP8266**, la serigrafía impresa (`D0`–`D8`) no coincide con el número de GPIO interno del chip ESP8266. La siguiente tabla documenta la equivalencia completa registrada en [`nodeMcuConfig.ts`](file:///j:/Bi-Tech-IoT-Studio/src/hardware/nodeMcuConfig.ts):

| Etiqueta en Placa | GPIO Real ESP8266 | Número en Código C/C++ | ¿Seguro para Uso General en Aula? | Rol Candidato en Sketch `.ino` (`V0.1.2`) |
| :--- | :--- | :--- | :--- | :--- |
| **`D0`** | `GPIO16` | `16` | ⚠️ No recomendado (WAKE, sin PWM/I2C) | Libre |
| **`D1`** | `GPIO5` | `5` | ✅ Sí (seguro en arranque) | `RELAY_PIN` (`D1 → GPIO5`) |
| **`D2`** | `GPIO4` | `4` | ✅ Sí (seguro en arranque) | `LUZ_PIN` (`D2 → GPIO4`) |
| **`D3`** | `GPIO0` | `0` | ⚠️ Pin de boot (falla si inicia en `LOW`) | Reservado |
| **`D4`** | `GPIO2` | `2` | ⚠️ Pin de boot (LED onboard, falla en `LOW`) | Reservado |
| **`D5`** | `GPIO14` | `14` | ✅ Sí (seguro en arranque) | `DHT_PIN` (`D5 → GPIO14`) |
| **`D6`** | `GPIO12` | `12` | ✅ Sí (seguro en arranque) | `ENTRADA_DIG_PIN` (`D6 → GPIO12`) |
| **`D7`** | `GPIO13` | `13` | ✅ Sí (seguro en arranque) | `SALIDA_DIG_PIN` (`D7 → GPIO13`) |
| **`D8`** | `GPIO15` | `15` | ⚠️ Pin de boot (falla si inicia en `HIGH`) | Reservado |
| **`A0`** | `ADC0 (TOUT)` | `A0` | ✅ Sí (única entrada analógica) | `ANALOG_A0_PIN` (`A0 → ADC0`) |

---

## 3. Entrada Analógica `A0` y Parámetro `adcInputVoltageRange: unverified`

- **Escala bruta:** `0` a `1023` (ADC de 10 bits).
- **Estado del parámetro en configuración:** `adcInputVoltageRange: 'unverified'`.
- **Fundamento técnico:** El conversor analógico-digital interno del chip `ESP8266EX` admite un rango nativo de **`0` a `1.0 V`**. Las placas de desarrollo tipo NodeMCU suelen incorporar un divisor resistivo en placa (habitualmente `220 kΩ` / `100 kΩ`) para escalar entradas de hasta `~3.2 V` o `3.3 V`, pero existen clones y variantes con divisores diferentes. Hasta verificar con multímetro nuestra placa física en laboratorio, Bi-Tech IoT Studio trabaja exclusivamente en **escala bruta (`0–1023`)** sin asumir una tensión máxima universal.

---

## 4. Validación Real de Compilación con Arduino CLI (`V0.1.2`)

- **Core instalado y verificado:** `esp8266:esp8266@3.1.2` (`Arduino CLI 1.5.1`).
- **FQBN verificado:** `esp8266:esp8266:nodemcuv2` (*NodeMCU 1.0 (ESP-12E Module)*).
- **Sketch compilado de validación:** [`nodemcu_validation_v012.ino`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu_validation_v012/nodemcu_validation_v012.ino).
- **Log de compilación:** [`compilation_log.txt`](file:///j:/Bi-Tech-IoT-Studio/evidence/hardware/nodemcu_validation_v012/compilation_log.txt) (`RAM: 35%`, `Flash: 22%`, `Exit code: 0`).

---

## 5. Registro de Supuestos Pendientes de Verificación en Laboratorio

| ID | Dispositivo | Elemento Pendiente | Estado Actual en V0.1.2 | Acción Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **SP-01 a SP-06** | Garden Node (`ESP32`) | GPIOs definitivos, polaridad de relay y calibración de suelo | Candidatos compilables (`verifiedGpio: null`) | Verificar en placa del Smart Garden Lab. |
| **SP-07 y SP-08** | Camera Node (`ESP32-CAM`) | Endpoint HTTP de streaming MJPEG e IP en red escolar | URL configurable (`null`) | Verificar firmware en `ESP32-CAM` (`V0.3`). |
| **SP-09 a SP-14** | NodeMCU (`ESP8266`) | Cierre del cableado definitivo (`verifiedGpio: null`) sobre los candidatos `D1→GPIO5`, `D2→GPIO4`, `D5→GPIO14`, `D6→GPIO12`, `D7→GPIO13` y medición del divisor de `A0` (`adcInputVoltageRange`) | Sketch `.ino` compilado con éxito (`esp8266:esp8266:nodemcuv2`) | Verificar con la placa física NodeMCU antes del flasheo USB en `V0.2`. |
