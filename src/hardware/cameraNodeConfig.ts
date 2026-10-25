import { CameraNodeHardwareConfig } from '../types/hardware';

/**
 * Configuración centralizada para el dispositivo Camera Node Bi-Tech (ESP32-CAM).
 */
export const CAMERA_NODE_CONFIG: CameraNodeHardwareConfig = {
  id: 'camera-node',
  name: 'Camera Node Bi-Tech',
  shortBadge: 'Camera Node Bi-Tech — ESP32-CAM',
  mcu: 'ESP32-CAM',
  simulatorKind: 'camera-system',
  verifiedFqbn: null,
  sensor: 'OV2640',
  programmingChannel: 'USB',
  streamingChannel: 'Wi-Fi',
  streamEndpointUrl: null,
  captureEndpointUrl: null,
  defaultResolution: 'SVGA (800x600)',
  defaultQuality: 10,
  capabilities: {
    digitalInputs: 1,
    digitalOutputs: 1,
    analogInputs: 0,
    analogResolutionBits: 12,
    analogMaxValue: 4095,
    adcInputVoltageRange: 'unverified',
    pwmChannels: 1,
    wifi: true,
    camera: true,
    relayChannels: 0,
    compatibleSensors: [],
    compatibleActuators: ['camera_ov2640'],
    pedagogicalResourceNote:
      'La ESP32-CAM dedica casi todos sus pines físicos al bus paralelo de la cámara OV2640. Se programa por USB y transmite video/capturas por Wi-Fi.',
    physicalCapabilities: {
      mcuModel: 'ESP32-S (AI-Thinker ESP32-CAM + OV2640)',
      operatingVoltage: '3.3V',
      totalUsableGpios: 2,
      analogInputs: 0,
      analogResolutionBits: 12,
      analogMaxRawValue: 4095,
      adcInputVoltageRange: 'unverified',
      adcVoltageNote: 'Los pines ADC2 quedan deshabilitados cuando se utiliza Wi-Fi para streaming.',
      pwmCapablePins: 1,
      wifi: true,
      cameraInterface: true,
      physicalNotes: 'El bus paralelo de la cámara OV2640 y la PSRAM ocupan la mayoría de los GPIOs.',
    },
    educationalAllocation: {
      digitalInputsExposed: 0,
      digitalOutputsExposed: 1,
      analogInputsExposed: 0,
      relayChannelsExposed: 0,
      simplificationExplanation:
        'El perfil educativo se enfoca en el control de la cámara OV2640 y la transmisión de streaming vía Wi-Fi.',
    },
  },
};
