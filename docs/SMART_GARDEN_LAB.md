# Smart Garden Lab Bi-Tech — Integración con Bi-Tech IoT Studio (V0.5A)

Bi-Tech IoT Studio y Smart Garden Lab son dos partes del mismo ecosistema, publicadas en el mismo dominio y proyecto Firebase (`bi-tech-iot-studio`, sitio `iotstudio`):

| Ruta | Producto | Función |
| --- | --- | --- |
| `/studio` | Bi-Tech IoT Studio | Programar Garden Node ESP32 y Camera Node ESP32-CAM (Blockly → Arduino C/C++). |
| `/lab` | Smart Garden Lab Bi-Tech | Observar datos y estados emitidos por esos dispositivos. |
| `/` | — | Redirige a `/studio`. |

## Estado de esta iteración (V0.5A)

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

No existe todavía: MQTT, streaming real, backend, múltiples nodos ni autenticación. El selector `Smart Garden activo` (`Garden Node — Demo`) deja visible el lugar donde luego se distinguirán los grupos.

## Identidad visual

El Lab mantiene una personalidad propia, distinta de IoT Studio: verde oscuro institucional, fondo crema, acentos dorados, aspecto de panel científico y cámara como elemento principal. La navegación global (`IoT Studio | Smart Garden Lab`) es una barra discreta común a ambos entornos ([`GlobalNav.tsx`](../src/components/GlobalNav.tsx)).

> Nota: no se encontró en el repositorio el primer diseño de Smart Garden Lab; la identidad visual se construyó a partir de la descripción de esta iteración y puede ajustarse al diseño original si se aporta la referencia.
