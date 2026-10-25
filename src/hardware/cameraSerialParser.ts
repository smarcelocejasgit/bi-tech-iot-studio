/**
 * Parser tolerante y configurable para el Monitor Serie de Camera Node Bi-Tech (V0.4A).
 *
 * Reconoce mensajes de estado emitidos por el firmware de la ESP32-CAM tales como:
 * - "Camera ready"
 * - "WiFi connected"
 * - "IP: xxx.xxx.xxx.xxx"
 * - "Streaming started"
 *
 * Sin asumir cadenas rígidas únicas: admite variaciones en mayúsculas/minúsculas,
 * idioma (español/inglés) y patrones personalizados configurables.
 */

export interface CameraSerialParserPatterns {
  cameraReadyPattern: RegExp;
  wifiConnectedPattern: RegExp;
  ipAddressPattern: RegExp;
  streamingStartedPattern: RegExp;
}

export interface CameraSerialParsedStatus {
  cameraReady: boolean;
  wifiConnected: boolean;
  detectedIp: string | null;
  streamingStarted: boolean;
}

export const DEFAULT_CAMERA_SERIAL_PATTERNS: CameraSerialParserPatterns = {
  cameraReadyPattern:
    /\b(camera\s+ready|camara\s+lista|cámara\s+lista|ov2640\s+ready|camera\s+initialized)\b/i,
  wifiConnectedPattern:
    /\b(wifi\s+connected|wi-fi\s+connected|wifi\s+conectado|wi-fi\s+conectado|connected\s+to\s+wifi)\b/i,
  ipAddressPattern:
    /(?:\bIP(?:\s+address)?\s*[:=]\s*|\bhttp:\/\/)((?:\d{1,3}\.){3}\d{1,3})\b/i,
  streamingStartedPattern:
    /\b(streaming\s+started|stream\s+started|streaming\s+iniciado|camera\s+server\s+ready|http\s+stream\s+ready)\b/i,
};

/**
 * Analiza el texto acumulado del Monitor Serie de Camera Node y extrae el estado
 * de inicialización de cámara, conexión Wi-Fi, dirección IPv4 e inicio de streaming.
 */
export function parseCameraSerialOutput(
  serialLog: string,
  customPatterns?: Partial<CameraSerialParserPatterns>
): CameraSerialParsedStatus {
  const patterns: CameraSerialParserPatterns = {
    ...DEFAULT_CAMERA_SERIAL_PATTERNS,
    ...customPatterns,
  };

  const cameraReady = patterns.cameraReadyPattern.test(serialLog);
  const wifiConnected = patterns.wifiConnectedPattern.test(serialLog);
  const streamingStarted = patterns.streamingStartedPattern.test(serialLog);

  const ipMatch = serialLog.match(patterns.ipAddressPattern);
  const detectedIp = ipMatch && ipMatch[1] ? ipMatch[1] : null;

  return {
    cameraReady,
    wifiConnected,
    detectedIp,
    streamingStarted,
  };
}

/**
 * Configuración flexible de conexión de streaming para Camera Node (V0.4A).
 * No hardcodea IP, puerto, endpoint ni URL completa.
 */
export interface CameraStreamConnectionInput {
  /** URL completa introducida manualmente (si se especifica, tiene prioridad) */
  fullUrl?: string;
  /** Dirección IP o host (detectado por Monitor Serie o introducido manualmente) */
  host?: string;
  /** Puerto HTTP (opcional, sin hardcodear) */
  port?: string;
  /** Ruta o endpoint del stream (opcional, ej. introducido al validar la placa) */
  endpointPath?: string;
}

/**
 * Construye la URL de streaming únicamente a partir de los datos provistos o detectados,
 * devolviendo `null` cuando todavía no se configuraron los parámetros reales.
 */
export function resolveCameraStreamUrl(
  input: CameraStreamConnectionInput
): string | null {
  const directUrl = (input.fullUrl ?? '').trim();
  if (directUrl) {
    return directUrl;
  }

  const host = (input.host ?? '').trim();
  if (!host) {
    return null;
  }

  const port = (input.port ?? '').trim();
  const rawPath = (input.endpointPath ?? '').trim();
  const normalizedPath = rawPath
    ? rawPath.startsWith('/')
      ? rawPath
      : `/${rawPath}`
    : '';

  const authority = port ? `${host}:${port}` : host;
  return `http://${authority}${normalizedPath}`;
}
