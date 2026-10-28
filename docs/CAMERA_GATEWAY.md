# Camera Node — integración web mediante gateway HTTPS

Smart Garden Lab puede mostrar la Camera Node real mediante un gateway HTTP local publicado a través de Cloudflare Tunnel. El túnel establece una conexión saliente, por lo que no requiere abrir puertos del router.

## Endpoints

El gateway local reenvía los endpoints de Camera Node y conserva sus tipos de contenido:

- `/camera/capture` → captura JPEG con `Content-Type: image/jpeg`;
- `/camera/stream` → streaming MJPEG con `Content-Type: multipart/x-mixed-replace`.

La dirección privada de Camera Node se configura únicamente en `camera-gateway.local.json`, ignorado por Git. La URL HTTPS pública se entrega al frontend mediante `VITE_CAMERA_GATEWAY_URL` en `.env.production.local`, también ignorado.

Smart Garden Lab comprueba periódicamente `/camera/capture`. Si recibe una imagen válida, muestra `/camera/stream` y marca Camera Node como conectado. Si el gateway o la cámara dejan de responder, oculta la imagen y vuelve al estado no conectado.

## Estado validado

- Gateway HTTPS local operativo.
- Cloudflare Tunnel operativo como mecanismo de publicación actual.
- `/camera/capture` accesible mediante HTTPS.
- `/camera/stream` accesible mediante HTTPS y entregando MJPEG progresivo.
- Smart Garden Lab online validado en `https://iotstudio.web.app/lab`.

## Limitación actual

La validación utiliza un Cloudflare Quick Tunnel temporal. Su hostname no se versiona y puede cambiar al reiniciar `cloudflared`. Como mejora futura, debe reemplazarse por un túnel nombrado con hostname estable y políticas de acceso administradas.
