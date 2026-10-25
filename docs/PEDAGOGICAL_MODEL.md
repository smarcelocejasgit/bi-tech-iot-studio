# Modelo Pedagógico — Bi-Tech IoT Studio

## 1. Fundamentación Curricular
El diseño didáctico de **Bi-Tech IoT Studio** se articula con:
- **Diseño Curricular de Educación Digital (GCABA, 2024):** Comprensión de sistemas digitales, programación, robótica, lectura de sensores, control de actuadores y pensamiento computacional aplicado a problemáticas reales de sustentabilidad (*Smart Garden Lab*).
- **Plan Estratégico de Bialfabetización (GCABA):** Transición andamiada entre lenguajes visuales (bloques) y lenguajes formales textuales (`Arduino C/C++`), promoviendo la lectura comprensiva de código y la formulación precisa de instrucciones lógicas.

---

## 2. El Triángulo Didáctico: Bloque ↔ Código ↔ Comportamiento

Cada acción del estudiante en el entorno activa tres representaciones conectadas:

```text
       [ BLOQUE VISUAL ]
        ↙             ↘
[ CÓDIGO C/C++ ] ↔ [ COMPORTAMIENTO SIMULADO / FÍSICO ]
```

1. **Bloque Visual:** Permite estructurar el algoritmo sin errores de sintaxis (punto y coma, llaves).
2. **Código Arduino C/C++:** Muestra inmediatamente cómo se escribe esa estructura en la industria utilizando funciones con nombres semánticos claros (`leerHumedadSuelo()`, `bombaOn()`). Al seleccionar un bloque, el entorno resalta las líneas correspondientes y explica su rol.
3. **Comportamiento (Simulador Pedagógico):** Permite poner a prueba hipótesis (*"¿Qué pasa con la bomba si la humedad del suelo sube de 25 a 50?"*) antes de conectar el hardware real.

---

## 3. Regla Pedagógica Central: Prohibición de Bloques "Caja Negra"

En **Bi-Tech IoT Studio** no se diseñan bloques que resuelvan el problema de forma opaca (como un hipotético bloque `regar automáticamente`).

En cambio, el estudiante debe construir y comprender la secuencia completa del sistema de control:

$$\text{Sensor} \longrightarrow \text{Dato} \longrightarrow \text{Comparación} \longrightarrow \text{Decisión} \longrightarrow \text{Actuación}$$

### Ejemplo de secuencia esperada en el aula:
```text
repetir siempre
  si (humedad del suelo < 30) entonces
    encender bomba
    esperar 5 segundos
    apagar bomba
```

De este modo, las y los estudiantes descubren por sí mismos conceptos clave de automatización:
- **Umbral de decisión** (¿por qué `30` y no `80`?).
- **Tiempo de actuación** (¿qué ocurre si encendemos la bomba y nunca la apagamos?).
- **Calibración de sensores** (comprender que el sensor devuelve un valor numérico que representa una magnitud física y que requiere interpretación).

---

## 4. El Manual Contextual ("¿Qué hace este bloque?")
Integrado en la parte inferior del entorno, actúa como un andamiaje permanente dentro del aula. Para cada bloque seleccionado informa:
1. **Descripción clara** en lenguaje accesible para estudiantes.
2. **Componente físico asociado** en el `Garden Node` o `Camera Node`.
3. **Dato que utiliza o devuelve** y su **tipo de dato** (`numérico entero`, `decimal float`, `booleano`, `acción void`).
4. **Comportamiento en el sistema**.
5. **Fragmento de código Arduino C/C++ generado**.
6. **Observaciones técnicas relevantes** (por ejemplo, advertir que la lectura de humedad de suelo es un valor analógico crudo y no un porcentaje calibrado automáticamente).
