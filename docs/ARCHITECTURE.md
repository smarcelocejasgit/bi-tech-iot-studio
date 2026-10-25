# Arquitectura de Software — Bi-Tech IoT Studio

## 1. Principios Arquitectónicos
1. **Separación de responsabilidades:** El editor visual, el generador de código, el simulador pedagógico, los perfiles de hardware y el manual contextual son módulos independientes comunicados mediante contratos tipados en TypeScript.
2. **Independencia del hardware real en el simulador:** El simulador evalúa el modelo lógico del programa sobre un estado virtual de sensores y actuadores, sin requerir una placa física conectada.
3. **Independencia de la interfaz en el generador de código:** El generador traduce el árbol sintáctico de bloques a código Arduino C/C++ educativo apoyándose en el perfil de hardware seleccionado.
4. **Configuración centralizada de hardware:** Ningún bloque ni componente visual contiene números de pines GPIO ni URLs de streaming codificados de forma rígida (*hardcoded*).

---

## 2. Stack Tecnológico Seleccionado (V0.1)
- **Framework UI:** `React 18+` con `TypeScript` (tipado estricto para estados de simulación, bloques y perfiles de dispositivos).
- **Empaquetador y entorno de desarrollo:** `Vite` (arranque rápido, soporte nativo de módulos ES y variables de entorno).
- **Motor de programación visual:** `Blockly` (`blockly` oficial de Google) por su madurez para definir bloques personalizados, generadores de código a medida y eventos de selección de bloques.
- **Estilos e iconografía:** `Tailwind CSS` + `Lucide React` para replicar con fidelidad, accesibilidad y diseño *responsive* la jerarquía visual de referencia.

---

## 3. Diagrama de Módulos

```mermaid
flowchart TD
    subgraph UI["Capa de Interfaz (React Components)"]
        Header["Header & Selector de Dispositivo / Modo"]
        BlockEditor["Editor Visual (Blockly Workspace)"]
        CodeViewer["Visor Arduino C/C++ en Vivo"]
        SimPanel["Panel de Controles del Simulador"]
        VirtualSys["Sistema Virtual (Smart Garden / Camera)"]
        ContextManual["Manual Contextual (¿Qué hace este bloque?)"]
    end

    subgraph Core["Núcleo Lógico y Pedagógico"]
        BlockDefs["Catálogo de Bloques (src/blocks)"]
        ArduinoGen["Generador C/C++ Educativo (src/generators)"]
        SimEngine["Motor de Simulación Reactivo (src/simulator)"]
        ManualDB["Base de Conocimiento Contextual (src/manual)"]
        HwProfiles["Perfiles y Config de Hardware (src/hardware)"]
    end

    subgraph Future["Servicios Futuros (V0.2 - V0.5)"]
        HardwareBridge["Puente Web Serial / Compilación (src/services)"]
        CloudService["Persistencia e IoT / Firebase (src/services)"]
    end

    Header --> HwProfiles
    BlockDefs --> BlockEditor
    HwProfiles --> BlockDefs
    BlockEditor -->|AST / Eventos de cambio| ArduinoGen
    BlockEditor -->|AST / Programa Lógico| SimEngine
    BlockEditor -->|ID de Bloque Seleccionado| ManualDB
    HwProfiles --> ArduinoGen
    ArduinoGen --> CodeViewer
    SimPanel -->|Variables Virtuales| SimEngine
    SimEngine -->|Estado Actuadores / Mensajes| VirtualSys
    ManualDB --> ContextManual
    ArduinoGen -.->|V0.2+| HardwareBridge
```

---

## 4. Estructura de Directorios en `src/`

- **`src/types/`**: Definiciones de tipos para dispositivos (`DeviceProfileId`), estados de sensores (`GardenSensorState`), estados de actuadores (`GardenActuatorState`), estado de cámara (`CameraNodeState`), metadatos de bloques y entradas del manual contextual.
- **`src/hardware/`**:
  - `gardenNodeConfig.ts`: Definición simbólica de pines (`DHT_PIN`, `SUELO_PIN`, `LDR_PIN`, `BOMBA_PIN`, `LUZ_PIN`), polaridad del relay (`activeLow: boolean`) y estado seguro inicial (`OFF`).
  - `cameraNodeConfig.ts`: Configuración simbólica para `ESP32-CAM` (`OV2640`), resoluciones soportadas y URL de streaming configurable.
- **`src/blocks/`**: Definición de bloques Blockly organizados en categorías (`Inicio`, `Sensores`, `Control`, `Actuadores`, `Cámara`, `Datos`, `IoT`).
- **`src/generators/`**: Generador de código Arduino C/C++ que emite funciones educativas claras (`leerHumedadSuelo()`, `bombaOn()`, `iniciarStreaming()`, etc.) y mapea cada bloque con su rango de líneas para resaltado en vivo.
- **`src/simulator/`**: Intérprete pedagógico seguro que evalúa las condiciones del programa de bloques frente a los valores actuales de los sliders del simulador y actualiza el estado de la bomba, la iluminación o la cámara virtual.
- **`src/manual/`**: Diccionario pedagógico indexado por tipo de bloque con descripción funcional, componente físico asociado, tipo de dato, código C/C++ equivalente y advertencias técnicas (ej. calibración analógica).
- **`src/services/`**: Interfaces preparadas (*stubs* documentados) para compilación/flasheo (`V0.2`), streaming MJPEG (`V0.3`), telemetría IoT (`V0.4`) y Firebase (`V0.5`).
