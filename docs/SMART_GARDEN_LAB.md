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

## Telemetría real por canales Bi-Tech

La telemetría productiva utiliza el mismo gateway local que publica Camera Node mediante Cloudflare Tunnel:

```text
Garden Node ESP32
  → HTTPS + Authorization: Bearer <credencial técnica>
  → Gateway Bi-Tech local
      POST /garden/telemetry
      GET  /garden/channel/:channel/latest
  → Cloudflare Tunnel HTTPS
  → HttpGardenLabDataSource
  → Smart Garden Lab
```

El canal visible para el estudiante identifica el flujo mostrado en el Lab, pero no autentica al dispositivo. La escritura sigue protegida por una credencial técnica separada. El gateway acepta canales del 1 al 9 y conserva solamente la última lectura en memoria:

```text
channels[1] → última lectura del Garden Node 01
channels[2] → última lectura del Garden Node 02
...
channels[9] → última lectura del Garden Node 09
```

Si el gateway se reinicia, esas lecturas se pierden y cada canal vuelve a `No disponible`. No existe historial ni base de datos en esta etapa.

`HttpGardenLabDataSource` consulta el endpoint HTTPS del canal seleccionado. Cuando recibe telemetría válida reemplaza únicamente temperatura y humedad; suelo y luminosidad permanecen explícitamente como no disponibles.

Las credenciales permanecen separadas y excluidas de Git:

- `wifi_credentials.h`: SSID y contraseña Wi-Fi.
- `device_credentials.h`: token técnico, URL HTTPS temporal y canal del Garden Node.
- `camera-gateway.local.json` o `GARDEN_NODE_TOKEN_SHA256`: hash SHA-256 usado por el gateway.
- `.env.production.local`: URL HTTPS pública del túnel usada al construir el frontend.

Firebase queda limitado a Hosting. No se requieren Functions, Realtime Database, Secret Manager ni plan Blaze para esta telemetría.

### PENDIENTE DE VALIDACIÓN EN ESCUELA

Todavía no se validó físicamente el circuito extremo a extremo:

```text
Garden Node ESP32 + DHT11 GPIO21 + Canal 1
  → gateway
  → túnel HTTPS
  → Smart Garden Lab
```

La primera prueba en la escuela debe realizarse en este orden:

1. conectar la ESP32;
2. detectar el puerto dinámico;
3. cargar el firmware preparado para Canal 1;
4. abrir el Monitor Serie a `115200`;
5. comprobar el envío de temperatura y humedad;
6. abrir `https://iotstudio.web.app/lab`;
7. ingresar Canal 1 y verificar las mediciones reales;
8. cambiar a Canal 2 y confirmar que no aparecen datos del Canal 1;
9. revisar la red institucional o su proxy únicamente si bloquea el túnel HTTPS.

## Identidad visual

El Lab mantiene una personalidad propia, distinta de IoT Studio, basada en el diseño original de Smart Garden Lab Bi-Tech: títulos en serif verde oscuro, fondo crema, insignia `SG`, pestañas en píldora (`EN VIVO`, `CAPTURAS`, `MONITOREAR`, `CONTROL`), cámara de observación como elemento principal, tarjetas ambientales y tarjeta de estado del sistema. La navegación global (`IoT Studio | Smart Garden Lab`) es una barra discreta común a ambos entornos ([`GlobalNav.tsx`](../src/components/GlobalNav.tsx)).

Diferencias deliberadas respecto de la referencia original: se muestran valores de demostración (con la etiqueta `Modo demostración`) en lugar de `—`, y el estado del sistema incluye `Garden Node` y `Camera Node` por separado.
