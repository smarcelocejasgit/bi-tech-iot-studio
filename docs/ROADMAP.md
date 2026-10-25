# Hoja de Ruta (Roadmap) — Bi-Tech IoT Studio

```mermaid
flowchart LR
    V01["V0.1: Garden + Camera Base"] --> V011["V0.1.1: Capacidades + NodeMCU ESP8266"]
    V011 --> V012["V0.1.2: Hardware Readiness + Compilación Real (.ino)"]
    V012 --> V02["V0.2: Conexión USB y Flasheo en Placa Física"]
    V02 --> V03["V0.3: Camera Node + Streaming Real"]
    V03 --> V04["V0.4: IoT + Datos + Conectividad"]
    V04 --> V05["V0.5: Firebase + Usuarios + Proyectos"]
    V05 --> V10["V1.0: Versión Educativa Integrada"]
```

---

## ✅ V0.1 — Entorno Pedagógico Base (Completado)
- Editor visual Blockly + Generador Arduino C/C++ en vivo + Simulador pedagógico + Manual contextual para `Garden Node Bi-Tech (ESP32)` y `Camera Node Bi-Tech (ESP32-CAM)`.

---

## ✅ V0.1.1 — Capacidades de Hardware y Soporte Oficial para NodeMCU ESP8266 (Completado)
- Capa declarativa centralizada `HardwareCapabilities` y tercer perfil oficial **NodeMCU — ESP8266** con validador pedagógico de restricciones físicas (`1` entrada analógica `A0`).

---

## 🟢 V0.1.2 — Hardware Readiness y Validación de Compilación Real (Actual)
- Distinción explícita entre **capacidades físicas del hardware** (`9` GPIOs `D0–D8` en NodeMCU) y **recursos habilitados por el perfil educativo**.
- Mapeo explícito entre **etiquetas serigrafiadas en placa (`D0–D8`, `A0`)** y **GPIOs reales del ESP8266 (`D1 → GPIO5`, etc.)**, manteniendo abierto el cableado definitivo de aula (`verifiedGpio: null`).
- Configuración de `A0` en escala bruta (`0–1023`) con parámetro verificable `adcInputVoltageRange: 'unverified'`.
- Separación en la interfaz y en el generador entre **Vista educativa** y **Sketch compilable (`.ino`)**.
- Verificación de compilación real con **Arduino CLI (`1.5.1`)** y core **`esp8266:esp8266@3.1.2`** bajo el FQBN **`esp8266:esp8266:nodemcuv2`**.
- Estado de preparación transparente en **`Placa real`** con las 5 etapas hacia el hardware físico (sin simular flasheo falso).

---

## 🟡 V0.2 — Conexión USB y Flasheo en Placa Física (Próxima Etapa)
- Relevamiento físico final de la placa **NodeMCU ESP8266** (divisor de tensión en `A0`, polaridad de relay y pines definitivos).
- Implementación de las etapas 4 y 5: **compilación → conexión USB → carga de firmware (flasheo)** sobre la placa física NodeMCU ESP8266 y posteriormente ESP32.
- Monitor serie educativo en vivo.

---

## 🟠 V0.3 — Integración Completa de Camera Node y Streaming Real
- Vinculación de la `ESP32-CAM` programada por USB con el streaming MJPEG real vía Wi-Fi dentro del entorno.

---

## 🔵 V0.4 — IoT, Datos y Conectividad
- Series temporales, gráficos de sensores y comunicación de eventos IoT entre nodos (`Garden Node`, `NodeMCU` y `Camera Node`).

---

## 🟣 V0.5 — Plataforma con Firebase, Usuarios y Proyectos
- Persistencia en la nube, cuentas de estudiantes/docentes y gestión de proyectos áulicos.

---

## 🌟 V1.0 — Primera Versión Educativa Integrada
- Lanzamiento consolidado y validado en aula en **Escuela Estación Buenos Aires**.
