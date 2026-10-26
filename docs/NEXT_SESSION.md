# NEXT SESSION — Bi-Tech IoT Studio / Smart Garden Lab

Fecha de checkpoint: 2026-10-26

## Punto de reentrada

- Studio: `https://iotstudio.web.app/studio`
- Smart Garden Lab: `https://iotstudio.web.app/lab`
- Proyecto Firebase: `bi-tech-iot-studio` (sitio de Hosting `iotstudio`)
- Repositorio: `smarcelocejasgit/bi-tech-iot-studio`, rama `main`

Commits relevantes más recientes:

- `9cb0b77` — documentación/identidad visual del Lab
- `bad9d8f` — Smart Garden Lab en `/lab`, ruta `/studio`, navegación global y contrato de fuente de datos
- `f3171ff` — Nuevo proyecto / Mis proyectos con persistencia local

## Estado actual

### Bi-Tech IoT Studio

Ya permite: crear y abrir proyectos locales; seleccionar Garden Node ESP32, Camera Node ESP32-CAM y NodeMCU compatible; programar con Blockly; generar Arduino C/C++; simular; descargar `.ino`; modo Placa real; ayuda contextual; interfaz del Asistente Bi-Tech (todavía sin IA real).

NodeMCU ESP8266 queda como placa compatible y banco de validación técnica. No es la placa principal del proyecto.

### Smart Garden Lab

Montado en `/lab` con la identidad visual original, en **modo demostración**. Muestra cámara, temperatura, humedad ambiente, humedad de suelo, luminosidad, estado de Garden Node / Camera Node / sensores / actuadores / red, bomba, iluminación y el ciclo pedagógico:
`Observar → Medir → Interpretar → Decidir → Actuar → Volver a medir → Comparar`.

Los datos demo NO deben confundirse con datos reales.

## Arquitectura objetivo

```text
Bi-Tech IoT Studio
        ↓ programa
Garden Node ESP32 ─────┐
Camera Node ESP32-CAM ─┤
        ↓ Wi-Fi        │
        ↓              │
servicio IoT / stream  │
        ↓              │
Smart Garden Lab ←─────┘
```

IoT Studio programa el sistema. Garden Node ejecuta sensores, decisiones y actuadores. Camera Node aporta observación visual. Smart Garden Lab muestra el comportamiento real.

## Identidad multi-escuela

La SSID puede repetirse entre escuelas. Lo que debe ser único es `Escuela → Lab → Nodo`, por ejemplo:

```text
escuela22de5/lab01/garden01
escuela22de5/lab01/camera01
```

No usar solamente el nombre de la Wi-Fi como identidad del dispositivo. La futura mensajería IoT debe derivar la identidad automáticamente desde Escuela/Lab/Nodo, sin obligar al estudiante a escribir tópicos técnicos.

## Hardware para la próxima sesión

Traer: placa ESP32 para Garden Node; ESP32-CAM + programador/base correspondiente.

- No reutilizar los GPIO validados en NodeMCU como si fueran GPIO de ESP32.
- Identificar primero el modelo real de ESP32 y su pinout.
- No publicar SSID, contraseña, MAC, seriales USB u otros identificadores únicos.
- Las credenciales Wi-Fi se mantienen en configuración local ignorada por Git.

## Próxima prueba real — prioridad 1

```text
ESP32 real → Wi-Fi → un dato real → Smart Garden Lab /lab
```

Empezar con UNA variable, preferentemente temperatura.

1. Identificar la placa ESP32 real.
2. Compilar/cargar un sketch mínimo.
3. Conectar ESP32 a la red disponible.
4. Obtener una lectura física real.
5. Transmitir solamente ese dato.
6. Conseguir que `/lab` reemplace el valor demo por el valor real.
7. Marcar claramente el nodo como conectado.

No sumar más variables hasta que ese circuito funcione. Después repetir el mecanismo para humedad ambiente, humedad de suelo, luminosidad, bomba e iluminación.

## Comunicación IoT

MQTT es un candidato natural para telemetría en tiempo real, pero **NO está cerrado**. No implementar broker, tópicos, autenticación ni infraestructura adicional antes de la prueba real. La decisión debe surgir de la necesidad concreta de comunicar ESP32 → Lab.

## Camera Node

No enviar video por MQTT. Separar:

- MQTT / canal IoT → estados y telemetría liviana;
- HTTP/MJPEG u otro mecanismo → streaming de cámara.

Primera prueba con cámara:

1. identificar placa/modelo real;
2. cargar firmware;
3. conectar a Wi-Fi;
4. obtener IP y endpoint real;
5. verificar stream local;
6. recién entonces resolver cómo mostrarlo dentro de `https://iotstudio.web.app/lab`.

La web está en HTTPS y un stream HTTP local puede quedar bloqueado por mixed content. No construir un gateway HTTPS hasta comprobar que ese problema aparece realmente.

## Pendientes de interfaz (no prioritarios frente a ESP32 → Lab)

- Glosario de componentes dentro de Configuración de hardware.
- Revisar el estado vacío de la ayuda contextual si no hay bloque seleccionado.
- Terminar de pulir la contextualidad del bloque seleccionado.
- Activar IA real en Asistente Bi-Tech más adelante.

## Glosario futuro

Debe vivir en `Configuración de hardware → Glosario de componentes` y explicar al menos: ESP32, ESP32-CAM, NodeMCU ESP8266, DHT11, sensor de humedad de suelo, LDR, relay, bomba, iluminación LED, OV2640, Wi-Fi e IoT.

Lógica pedagógica: `qué es → qué mide/controla → qué dato produce/recibe → cómo participa en IoT Studio → cómo aparece en Smart Garden Lab`.

## Regla de trabajo

**Si no bloquea la próxima prueba real, no resolverlo todavía.**

Prioridad inmediata al retomar: **ESP32 → Wi-Fi → primer dato real → Smart Garden Lab.**
