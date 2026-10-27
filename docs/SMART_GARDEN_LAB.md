# Smart Garden Lab Bi-Tech — Integración con Bi-Tech IoT Studio (V0.5A)

Bi-Tech IoT Studio y Smart Garden Lab son dos partes del mismo ecosistema, publicadas en el mismo dominio y proyecto Firebase (`bi-tech-iot-studio`, sitio `iotstudio`):

| Ruta | Producto | Función |
| --- | --- | --- |
| `/studio` | Bi-Tech IoT Studio | Programar Garden Node ESP32 y Camera Node ESP32-CAM (Blockly → Arduino C/C++). |
| `/lab` | Smart Garden Lab Bi-Tech | Observar datos y estados emitidos por esos dispositivos. |
| `/` | — | Redirige a `/studio`. |

## Estado base (V0.5A)

Solo se monta la **interfaz web** del Lab, en **modo demostración**:

- Sección funcional: **En vivo** (cámara de observación, variables ambientales, estado del sistema, actuadores y ciclo pedagógico).
- **Capturas**, **Monitorear** y **Control**: preparadas visualmente con el estado `Próxima etapa`.
- Los datos provienen de `DemoGardenLabDataSource` (valores simulados fijos). **No son mediciones físicas** y la interfaz lo indica como `Modo demostración`.
- Los estados de conexión inician en `Demo / No conectado`. No se muestra `Online` sin hardware real.
- Los actuadores (`Bomba`, `Iluminación`) son solo visualización; no hay control remoto.
- La cámara no muestra video falso: solo renderiza una imagen si el estado trae `cameraNodeConnected` y `cameraStreamUrl`.

## Desacople UI ↔ datos

`src/lab/smartGardenLive.ts` define el contrato:

- `SmartGardenLiveState`: temperatura, humedad ambiente, humedad del suelo, luminosidad, bomba, iluminación, conexiones (Garden Node, Camera Node, red) y `cameraStreamUrl?`.
- `GardenLabDataSource`: `getSnapshot()` y `subscribe()`.
- `DemoGardenLabDataSource`: única implementación actual.

Una futura fuente real (MQTT, WebSocket, Firebase, etc.) solo debe implementar `GardenLabDataSource`; la UI no cambia.

## Arquitectura futura (NO implementada)

```text
Bi-Tech IoT Studio
        ↓
programa
        ↓
Garden Node ESP32
Camera Node ESP32-CAM
        ↓
Wi-Fi
        ↓
Servicio IoT / streaming
        ↓
Smart Garden Lab
```

No existe todavía: MQTT, streaming real, múltiples nodos ni autenticación de usuarios. El selector `Smart Garden activo` deja visible el lugar donde luego se distinguirán los grupos.

## Primera telemetría real — preparación local (sin despliegue)

Se incorporó una arquitectura mínima preparada y validada con Firebase Emulator Suite, pero todavía no desplegada:

```text
Garden Node ESP32
  → HTTPS + Authorization: Bearer <token local>
  → gardenTelemetry (una única HTTPS Function)
      POST /telemetry
      GET  /latest
  → Realtime Database: sólo la última lectura
  → HttpGardenLabDataSource
  → Smart Garden Lab
```

La identidad inicial es fija y deliberadamente mínima:

```text
Escuela Estación → Lab 01 → Garden Node 01
```

La lectura se propone en RTDB bajo:

```text
schools/escuela-estacion/labs/lab-01/nodes/garden-node-01/latest
```

El navegador no accede directamente a RTDB. Sus reglas niegan todas las lecturas y escrituras; la Function usa Admin SDK. `POST /telemetry` valida el token por su hash SHA-256 guardado como secreto, valida temperatura/humedad/estado y genera el timestamp en servidor. `GET /latest` devuelve sólo la identidad lógica y la última telemetría autorizada.

`HttpGardenLabDataSource` consulta `/api/garden/latest`. Mientras no haya una respuesta real válida conserva `DemoGardenLabDataSource` como fallback. Cuando recibe telemetría real reemplaza únicamente temperatura y humedad; suelo, luz, actuadores y cámara quedan explícitamente como no conectados.

Las credenciales permanecen separadas y excluidas de Git:

- `wifi_credentials.h`: SSID y contraseña Wi-Fi.
- `device_credentials.h`: token del Garden Node.
- `functions/.secret.local`: hash de prueba exclusivo del emulador.

Para producción quedan pendientes una acción manual sobre el plan Firebase, crear la instancia RTDB y configurar el secreto real. No se realizó ningún despliegue ni cambio de billing en esta etapa.

## Identidad visual

El Lab mantiene una personalidad propia, distinta de IoT Studio, basada en el diseño original de Smart Garden Lab Bi-Tech: títulos en serif verde oscuro, fondo crema, insignia `SG`, pestañas en píldora (`EN VIVO`, `CAPTURAS`, `MONITOREAR`, `CONTROL`), cámara de observación como elemento principal, tarjetas ambientales y tarjeta de estado del sistema. La navegación global (`IoT Studio | Smart Garden Lab`) es una barra discreta común a ambos entornos ([`GlobalNav.tsx`](../src/components/GlobalNav.tsx)).

Diferencias deliberadas respecto de la referencia original: se muestran valores de demostración (con la etiqueta `Modo demostración`) en lugar de `—`, y el estado del sistema incluye `Garden Node` y `Camera Node` por separado.
