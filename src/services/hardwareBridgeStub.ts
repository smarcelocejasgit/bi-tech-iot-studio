/**
 * Servicio preparado conceptualmente para V0.2 (Compilación y Carga sobre ESP32 real)
 * y V0.3 (Conexión con streaming real de ESP32-CAM).
 *
 * En V0.1 el modo "Placa real" permanece marcado como "Próximamente" y no simula una
 * carga de firmware inexistente.
 */
export interface FutureHardwareBridgeStatus {
  availableInVersion: 'V0.2';
  webSerialSupported: boolean;
  message: string;
}

export function getHardwareBridgeStatus(): FutureHardwareBridgeStatus {
  const supported =
    typeof navigator !== 'undefined' && 'serial' in navigator;
  return {
    availableInVersion: 'V0.2',
    webSerialSupported: supported,
    message:
      'La compilación y carga física por USB hacia ESP32 / ESP32-CAM estará disponible en la versión V0.2 una vez validados los pines GPIO en el laboratorio.',
  };
}
