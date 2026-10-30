# Asistente Bi-Tech con Firebase AI Logic

El tutor utiliza Firebase Web SDK `12.14.0` o posterior, requerido para que
Firebase AI Logic adjunte tokens de App Check en Web, y Gemini Developer API a
través del proxy gestionado por Firebase AI Logic. El navegador no contiene una
Gemini API key ni llama directamente a `generativelanguage.googleapis.com`.

## Arquitectura vigente

```text
Bi-Tech IoT Studio
→ Firebase AI Logic
→ Gemini
→ App Check / Fraud Defense
```

El Studio se comunica directamente con Firebase AI Logic mediante el SDK web
oficial. No existe un backend local del asistente ni una integración activa con
OpenAI.

## Configuración actual

- Proyecto Firebase: `bi-tech-iot-studio`.
- App web: `Bi-Tech IoT Studio`.
- Modelo centralizado: `gemini-3.5-flash-lite`.
- Proveedor: Gemini Developer API mediante `GoogleAIBackend`.
- Conversaciones: sólo en memoria del navegador.

El modelo puede cambiarse en un build local con
`VITE_BITECH_ASSISTANT_MODEL`, sin modificar componentes. Para producción es
preferible migrar luego esa decisión a Firebase Remote Config o a plantillas de
prompt administradas.

## Firebase Console

1. Abrir **Firebase AI Logic** en el proyecto `bi-tech-iot-studio`.
2. Completar el flujo inicial y seleccionar **Gemini Developer API**.
3. Confirmar que las APIs requeridas queden habilitadas.
4. En **Security → App Check → APIs**, verificar que Firebase AI Logic esté
   protegido.

## App Check local

Agregar únicamente en `.env.local`:

```text
VITE_FIREBASE_APPCHECK_DEBUG=true
```

Al abrir el Studio local, Firebase mostrará un debug token en la consola del
navegador. Registrarlo en **Security → App Check → Apps → Bi-Tech IoT Studio →
Manage debug tokens**. No copiar ese token al repositorio, no compartirlo y no
usar el modo debug en un build productivo.

## App Check en producción

1. Registrar la app web con **reCAPTCHA Enterprise** en App Check.
2. La app usa la clave de sitio pública registrada para `Bi-Tech IoT Studio`.
   Puede reemplazarse sin tocar código mediante
   `VITE_FIREBASE_APPCHECK_SITE_KEY`.
3. Verificar métricas de solicitudes válidas antes de exigir protección y no
   desplegar una build con `VITE_FIREBASE_APPCHECK_DEBUG=true`.

La clave de sitio de reCAPTCHA es configuración pública. Los tokens de App
Check y cualquier credencial privada no deben guardarse en archivos del repo.

## Migración completada

La prueba real con Firebase AI Logic y App Check se completó correctamente el
30/10/2026. El servicio local anterior fue retirado y ya no forma parte de la
arquitectura, las dependencias ni los comandos del proyecto.
