# 🌱 Bi-Tech IoT Studio

**Entorno educativo web para programación física, simulación e IoT con ESP32.**

Desarrollado inicialmente para el escenario **Smart Garden Lab Bi-Tech** en el contexto de **Escuela Estación Buenos Aires**, alineado a los propósitos formativos del **Diseño Curricular de Educación Digital de CABA (2024)** y el **Plan Estratégico de Bialfabetización**.

---

## 🎯 Propósito Pedagógico

Bi-Tech IoT Studio no es simplemente un IDE técnico: es un **entorno de aprendizaje** diseñado para que las y los estudiantes comprendan de forma explícita y progresiva la relación entre:

> **Programación visual → Algoritmo → Código Arduino C/C++ → Simulación → Dispositivo físico → Datos → IoT**

La plataforma prioriza la comprensión algorítmica y sistémica mediante tres representaciones simultáneas y sincronizadas:

1. **Bloques Visuales (Blockly):** construcción lógica sin barreras sintácticas iniciales.
2. **Código Arduino C/C++ en vivo:** traducción inmediata y legible utilizando funciones educativas claras.
3. **Comportamiento (Simulador / Sistema Virtual):** experimentación interactiva sobre variables físicas y actuadores antes de transferir al hardware real.

---

## 🤖 Perfiles de Dispositivos Oficiales (V0.1.1)

Cada dispositivo declara sus capacidades físicas en una capa centralizada (`HardwareCapabilities`), haciendo visible para el estudiante la relación **problema → algoritmo → recursos necesarios → hardware disponible → programa**:

### 1. Garden Node Bi-Tech — ESP32
Orientado a la automatización de cultivo y monitoreo ambiental con múltiples entradas analógicas:
- **Sensores:** Temperatura y humedad ambiente (`DHT11`), humedad del suelo (analógico), nivel de luz (`LDR`).
- **Actuadores:** Módulo relay de 2 canales para **bomba de riego** e **iluminación LED** (con estado seguro inicial `OFF` y lógica activo `HIGH/LOW` configurable).

### 2. Camera Node Bi-Tech — ESP32-CAM
Orientado a visión, registro visual y monitoreo remoto:
- **Hardware:** `ESP32-CAM` con sensor `OV2640` y conectividad `Wi-Fi`.
- **Modelo de operación:** Programación por **USB** y comunicación/streaming por **Wi-Fi** (endpoint configurable).

### 3. NodeMCU — ESP8266
Placa educativa presente en numerosas instituciones y disponible físicamente para la primera validación de compilación y carga en hardware real (`V0.2`):
- **Capacidades y restricciones reales:** `DHT11`, **1 única entrada analógica (`A0`, 0–1023)**, entradas/salidas digitales, control de relay de 1 canal, iluminación LED y `Wi-Fi`.
- **Validación pedagógica:** Si el estudiante intenta utilizar más entradas analógicas que las disponibles en NodeMCU (`A0`), el entorno muestra una advertencia explicativa clara en lugar de generar silenciosamente código inválido.

---

## 🗂️ Estructura del Repositorio

```text
Bi-Tech-IoT-Studio/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── PROJECT_CONTEXT.md      # Contexto educativo e institucional
│   ├── ARCHITECTURE.md         # Arquitectura modular de software
│   ├── HARDWARE.md             # Perfiles de hardware y supuestos pendientes
│   ├── PEDAGOGICAL_MODEL.md    # Principios didácticos y alineación curricular
│   ├── ROADMAP.md              # Plan de versiones incrementales (V0.1 a V1.0)
│   ├── CHANGELOG.md            # Registro de cambios versionado
│   └── decisions/              # Architecture Decision Records (ADRs)
│       ├── ADR-001-blockly.md
│       ├── ADR-002-simulador-pedagogico.md
│       ├── ADR-003-garden-node.md
│       └── ADR-004-camera-node.md
├── evidence/                   # Evidencia de diseño, pruebas y hardware
│   ├── screenshots/
│   ├── prototypes/
│   │   └── ui-reference-v0.1.png
│   ├── tests/
│   └── hardware/
└── src/                        # Código fuente modular (preparado para V0.1)
    ├── blocks/                 # Definición de bloques personalizados
    ├── components/             # Interfaz de usuario (React)
    ├── generators/             # Generadores de código Arduino C/C++
    ├── hardware/               # Configuración centralizada de pines y perfiles
    ├── manual/                 # Manual contextual ("¿Qué hace este bloque?")
    ├── services/               # Servicios futuros (Web Serial, compilación, IoT)
    ├── simulator/              # Motor del simulador pedagógico reactivo
    └── types/                  # Contratos e interfaces TypeScript
```

---

## 🔒 Seguridad y Privacidad

- No se almacenan en el repositorio contraseñas Wi-Fi, claves API, tokens ni datos personales de estudiantes.
- Los pines GPIO definitivos y URLs de streaming reales se mantienen desacoplados en archivos de configuración hasta su verificación en laboratorio.

---

## 🚀 Ejecución Local (V0.1)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# 3. Ejecutar pruebas unitarias (Vitest)
npm test

# 4. Compilar versión de producción
npm run build
```
