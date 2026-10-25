# ADR-004: Modelo de Operación Híbrido (USB + Wi-Fi) para Camera Node Bi-Tech

- **Estado:** Aceptado
- **Fecha:** 2026-10-25

## Contexto
El dispositivo **Camera Node Bi-Tech** utiliza una placa `ESP32-CAM` con cámara `OV2640`. A menudo existe confusión en entornos escolares respecto de cómo se programa la placa frente a cómo transmite video. Además, la URL exacta del endpoint de streaming depende del firmware específico que se verifique en laboratorio.

## Decisión
1. Establecer explícitamente en la arquitectura y en el modelo pedagógico la separación de canales:
   - **USB:** Exclusivamente para la carga del programa (`Arduino C/C++`) a la placa `ESP32-CAM`.
   - **Wi-Fi:** Exclusivamente para la comunicación de red, el control y la transmisión de streaming de video.
2. **No asumir streaming por USB** en ningún componente de la interfaz ni de la documentación.
3. **No inventar una URL o endpoint fijo de streaming:** Mantener el endpoint de streaming y captura como un parámetro configurable en `src/hardware/cameraNodeConfig.ts` (y variables de entorno locales) hasta verificar el firmware real en `V0.3`.

## Consecuencias
- En `V0.1`, el estudiante puede seleccionar el perfil `Camera Node Bi-Tech`, construir programas con bloques de cámara (`configurar cámara`, `seleccionar resolución`, `configurar calidad`, `iniciar cámara`, `conectar a Wi-Fi`, `iniciar/detener streaming`, `tomar captura`, `estado de cámara`), observar el código C/C++ generado y probar la máquina de estados en el simulador virtual.
- En `V0.3`, el mismo panel del simulador podrá conmutar a la recepción del stream Wi-Fi real configurando la URL verificada.
