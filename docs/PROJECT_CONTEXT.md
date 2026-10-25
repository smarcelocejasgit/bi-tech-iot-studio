# Contexto del Proyecto — Bi-Tech IoT Studio

## 1. Marco Institucional y Pedagógico
**Bi-Tech IoT Studio** nace para acompañar el proyecto **Smart Garden Lab Bi-Tech** desarrollado en **Escuela Estación Buenos Aires**.

Su diseño responde a los lineamientos del **Diseño Curricular de Educación Digital de la Ciudad Autónoma de Buenos Aires (GCABA, 2024)** y al **Plan Estratégico de Bialfabetización**, promoviendo la alfabetización algorítmica, la comprensión de sistemas automatizados (sensores, procesamiento y actuadores) y el tránsito progresivo desde la programación por bloques hacia lenguajes textuales (`C/C++`).

## 2. Problema que Resuelve
En el trabajo áulico con microcontroladores (`ESP32` / `ESP32-CAM`), suelen presentarse tres barreras simultáneas:
1. **Barrera sintáctica:** Pasar directamente al IDE de Arduino dificulta que los estudiantes se concentren en la lógica de control.
2. **Caja negra en bloques:** Algunos entornos visuales ocultan por completo el código subyacente o ofrecen bloques "mágicos" (`regar automáticamente`) que impiden construir el pensamiento algorítmico.
3. **Dependencia del hardware físico:** Si no hay suficientes placas disponibles o si los pines aún están en etapa de validación, la clase se detiene.

## 3. Propuesta de Valor de Bi-Tech IoT Studio
Un entorno web unificado que:
- Conecta en tiempo real **Bloques Visuales ↔ Código Arduino C/C++ ↔ Comportamiento Simulado**.
- Exige que el estudiante construya explícitamente la cadena causal: **sensor → dato → comparación → decisión → actuación**.
- Incluye un **Manual Contextual integrado** (`¿Qué hace este bloque?`) que explica el componente físico, el tipo de dato, el código generado y las consideraciones técnicas (por ejemplo, lecturas analógicas sin calibrar vs. porcentajes).
- Permite alternar entre tres modos de trabajo: **Programar**, **Simular** y **Placa Real**.

## 4. Referencia Visual de Interfaz (V0.1)
La organización visual toma como referencia el prototipo documentado en [`evidence/prototypes/ui-reference-v0.1.png`](../evidence/prototypes/ui-reference-v0.1.png), estructurado en:
- **Barra superior:** Identidad Bi-Tech IoT Studio, nombre del proyecto, perfil de dispositivo activo (`Garden Node Bi-Tech · ESP32` o `Camera Node Bi-Tech · ESP32-CAM`) y selector de modo (`Programar`, `Simular`, `Placa real`).
- **Panel central triple:**
  1. Categorías de bloques (`Inicio`, `Sensores`, `Control`, `Actuadores`, `Cámara`, `Datos`, `IoT`).
  2. Área de programación visual con controles de zoom y papelera.
  3. Visor de **Código Arduino C/C++** generado en vivo con resaltado del bloque seleccionado.
- **Panel inferior doble:**
  1. **Simulador:** Controles deslizantes (sliders) de variables ambientales o controles de cámara.
  2. **Sistema Virtual (Smart Garden Virtual / Camera Node Virtual):** Representación visual del jardín/cámara, estado de actuadores (`Bomba`, `Iluminación`, `Streaming`) y retroalimentación explicativa del estado actual.
- **Pie pedagógico:** Panel **¿Qué hace este bloque?** con vista previa del bloque activo y su explicación didáctica y técnica.
