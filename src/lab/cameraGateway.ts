export interface CameraGatewayConfig {
  baseUrl: string;
  captureUrl: string;
  streamUrl: string;
}

export function resolveCameraGatewayConfig(
  rawBaseUrl: string | undefined,
  requireHttps = false
): CameraGatewayConfig | null {
  const value = rawBaseUrl?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (requireHttps && url.protocol !== 'https:') return null;

    const baseUrl = url.toString().replace(/\/$/, '');
    return {
      baseUrl,
      captureUrl: `${baseUrl}/camera/capture`,
      streamUrl: `${baseUrl}/camera/stream`,
    };
  } catch {
    return null;
  }
}

export const CAMERA_GATEWAY_CONFIG = resolveCameraGatewayConfig(
  import.meta.env.VITE_CAMERA_GATEWAY_URL,
  import.meta.env.PROD
);
