# Especificación de Hardware y Supuestos Pendientes

> [!IMPORTANT]
> Ningún pin físico (GPIO) ni dirección de red ha sido inventado como definitivo. Toda asignación se gestiona mediante constantes simbólicas y un archivo de configuración centralizado (`src/hardware/`) para su actualización una vez verificado el conexionado real en el laboratorio de Escuela Estación Buenos Aires.

---

## 1. Perfil A: Garden Node Bi-Tech (`ESP32`)

### 1.1 Componentes Físicos
| Componente | Función | Tipo de Señal | Función Educativa en C/C++ |
| :--- | :--- | :--- | :--- |
| Microcontrolador **ESP32** | Unidad central de procesamiento y Wi-Fi | Digital / ADC | `setup()`, `loop()` |
| Sensor **DHT11** | Temperatura (°C) y Humedad Ambiente (%) | Digital (1-Wire propio) | `leerTemperatura()`, `leerHumedadAmbiente()` |
| Sensor de **Humedad del Suelo** | Lectura cruda de conductividad/capacitancia | Analógica (ADC) | `leerHumedadSuelo()` |
| Sensor **LDR** (Fotorresistor) | Nivel de iluminación ambiental | Analógica (ADC) | `leerNivelLuz()` |
| **Relay Canal 1 → Bomba de agua** | Activación de riego | Salida Digital | `bombaOn()`, `bombaOff()` |
| **Relay Canal 2 → Iluminación LED** | Activación de luz de cultivo | Salida Digital | `luzOn()`, `luzOff()` |

### 1.2 Estado Seguro de Actuadores
Al energizar o reiniciar el `Garden Node`, ambos canales del módulo relay deben inicializarse en estado seguro **APAGADO (`OFF`)** antes de ejecutar cualquier lógica de usuario:
- `Canal 1 (Bomba)` → `OFF`
- `Canal 2 (Iluminación)` → `OFF`

Dado que los módulos de relé comerciales suelen ser activos en nivel bajo (`ACTIVE LOW`) pero existen variantes activas en nivel alto (`ACTIVE HIGH`), la configuración central define:
```ts
export interface RelayConfig {
  activeLevel: 'LOW' | 'HIGH' | 'PENDING_VERIFICATION';
  safeInitialState: 'OFF';
}
```
En el código C/C++ generado, esta abstracción se encapsula dentro de `bombaOn()`, `bombaOff()`, `luzOn()` y `luzOff()`, protegiendo al estudiante de invertir accidentalmente la lógica y asegurando que un cambio de hardware solo requiera ajustar la constante de configuración.

---

## 2. Perfil B: Camera Node Bi-Tech (`ESP32-CAM`)

### 2.1 Componentes y Flujo Operativo
- **Placa:** `ESP32-CAM` con cámara `OV2640` y conectividad `Wi-Fi`.
- **Flujo de trabajo previsto:**
  1. **USB:** Exclusivamente para programación/carga de firmware en la `ESP32-CAM`.
  2. **Wi-Fi:** Comunicación de red, control y streaming de video en tiempo real (no se asume streaming de video por USB).

### 2.2 Funciones Educativas en C/C++
- `configurarCamara()`
- `seleccionarResolucion(resolucion)`
- `configurarCalidad(calidad)`
- `iniciarCamara()`
- `conectarWiFi(ssid, password)` *(utilizando placeholders seguros, nunca credenciales en repositorio)*
- `iniciarStreaming()`
- `detenerStreaming()`
- `tomarCaptura()`
- `estadoCamara()`

---

## 3. Registro de Supuestos Pendientes de Verificación en Laboratorio

| ID | Dispositivo | Elemento Pendiente | Estado Actual en V0.1 | Acción Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **SP-01** | Garden Node | GPIO asignado a sensor `DHT11` | Simbólico (`DHT_PIN`) | Verificar en esquemático/placa del Smart Garden Lab. |
| **SP-02** | Garden Node | GPIO (ADC1) para `Humedad del Suelo` | Simbólico (`SUELO_PIN`) | Verificar que utilice un canal `ADC1` (compatible con Wi-Fi activo en ESP32). |
| **SP-03** | Garden Node | GPIO (ADC1) para sensor `LDR` | Simbólico (`LDR_PIN`) | Verificar pin analógico y divisor resistivo en placa real. |
| **SP-04** | Garden Node | GPIOs de salida para `Relay Canal 1 (Bomba)` y `Canal 2 (Luz)` | Simbólicos (`BOMBA_PIN`, `LUZ_PIN`) | Verificar pines sin *glitch* de arranque en ESP32. |
| **SP-05** | Garden Node | Polaridad de activación del módulo Relay (`ACTIVE LOW` vs `ACTIVE HIGH`) | Configurable (`RELAY_ON` / `RELAY_OFF`) | Medir con multímetro o probar continuidad en placa física. |
| **SP-06** | Garden Node | Rango de calibración del sensor de humedad de suelo (seco vs. sumergido) | Lectura cruda numérica (sin asumir %) | Relevar valores reales en tierra seca y húmeda para documentar escala. |
| **SP-07** | Camera Node | Firmware base y endpoint HTTP/MJPEG de streaming y captura | URL configurable vacía por defecto | Verificar firmware cargado en la `ESP32-CAM` del laboratorio (ej. ruta `/stream`, `/capture`). |
| **SP-08** | Camera Node | Método de descubrimiento de IP en la red escolar | Configurable manual / mDNS pendiente | Definir si se usará IP fija, monitor serie o mDNS (`.local`). |
