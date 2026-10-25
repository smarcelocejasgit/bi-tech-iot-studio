# Modelo Pedagógico — Bi-Tech IoT Studio

## 1. Fundamentación Curricular
El diseño didáctico de **Bi-Tech IoT Studio** se articula con:
- **Diseño Curricular de Educación Digital (GCABA, 2024):** Comprensión de sistemas digitales, programación física, robótica, lectura de sensores, control de actuadores y pensamiento computacional aplicado a problemáticas reales de sustentabilidad (*Smart Garden Lab*).
- **Plan Estratégico de Bialfabetización (GCABA):** Transición andamiada entre lenguajes visuales (bloques) y lenguajes formales textuales (`Arduino C/C++`), promoviendo la lectura comprensiva de código y la formulación precisa de instrucciones lógicas.

---

## 2. De la Lógica Abstracta a las Capacidades del Hardware Real (V0.1.1)

Con la incorporación del tercer perfil oficial (**NodeMCU — ESP8266** junto a **Garden Node — ESP32** y **Camera Node — ESP32-CAM**), Bi-Tech IoT Studio hace visible una dimensión esencial de la ingeniería y la programación física:

$$\text{Problema} \longrightarrow \text{Algoritmo} \longrightarrow \text{Recursos Necesarios} \longrightarrow \text{Hardware Disponible} \longrightarrow \text{Programa}$$

Las y los estudiantes comprenden que programar un microcontrolador no ocurre en el vacío:
- Un **ESP32** dispone de múltiples conversores analógico-digitales (ADC), lo que permite leer un sensor de humedad de suelo y un LDR simultáneamente.
- Una **NodeMCU ESP8266** dispone de **una única entrada analógica (`A0`)**, por lo que el estudiante debe decidir qué sensor analógico conectar a `A0` y combinarlo con sensores digitales (como el `DHT11` o una entrada digital), o bien migrar a una placa con mayores recursos si el problema exige más entradas analógicas.
- Cuando un proyecto supera las capacidades físicas del dispositivo seleccionado, el entorno no falla en silencio ni genera código inválido: **explica pedagógicamente la restricción física**.

---

## 3. Regla Pedagógica Central: Prohibición de Bloques "Caja Negra"

En **Bi-Tech IoT Studio** no existen bloques que resuelvan el problema de forma opaca (`regar automáticamente`). El estudiante construye explícitamente la cadena causal:

$$\text{Sensor} \longrightarrow \text{Dato} \longrightarrow \text{Comparación} \longrightarrow \text{Decisión} \longrightarrow \text{Actuación}$$

---

## 4. El Manual Contextual Adaptativo ("¿Qué hace este bloque?")
Integrado en la parte inferior del entorno, adapta sus observaciones técnicas según el dispositivo activo (`ESP32`, `ESP32-CAM` o `NodeMCU ESP8266`), detallando:
1. Función y descripción accesible para nivel secundario.
2. Componente físico asociado.
3. Dato que utiliza y tipo de dato (`int`, `float`, `bool`, `void`).
4. Comportamiento en el sistema.
5. Código Arduino C/C++ generado.
6. Observaciones sobre calibración y restricciones de recursos del hardware seleccionado.
