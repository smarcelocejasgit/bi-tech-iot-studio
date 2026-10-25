/**
 * Capa de abstracción HardwareBridge (V0.3).
 *
 * Separa la interfaz de comunicación con hardware físico de la implementación
 * local basada en Arduino CLI, permitiendo reemplazarla en el futuro (WebSerial,
 * agente local empaquetado o servicio remoto) sin modificar los componentes de
 * Bi-Tech IoT Studio.
 */

export interface SerialPortInfo {
  /** Nombre del puerto en el sistema operativo (ej. COM3, COM15, /dev/ttyUSB0) */
  address: string;
  /** Etiqueta amigable para mostrar al estudiante */
  label: string;
  /** Protocolo reportado por Arduino CLI (ej. 'serial') */
  protocol: string;
  /** Descripción del tipo de puerto (ej. 'Serial Port (USB)') */
  protocolLabel: string;
  /** Indica si el puerto corresponde a un puente USB detectado */
  isUsb: boolean;
}

export interface CompileRequest {
  device: 'nodemcu-esp8266' | 'camera-node';
  fqbn: string;
  sketchCode: string;
}

export interface CompileResult {
  success: boolean;
  /** Mensaje claro y pedagógico para el estudiante */
  summaryMessage: string;
  /** Detalles técnicos sanitizados para diagnóstico docente */
  technicalDetails: string;
  compiledAt: string;
}

export type UploadPhase =
  | 'connecting'
  | 'uploading'
  | 'completed'
  | 'error';

export interface UploadProgress {
  phase: UploadPhase;
  /** Porcentaje de progreso (0 a 100) cuando está disponible */
  percentage: number | null;
  /** Mensaje breve de estado para la interfaz */
  statusText: string;
  /** Salida técnica acumulada (sanitizada) */
  technicalDetails?: string;
}

export interface UploadRequest {
  device: 'nodemcu-esp8266' | 'camera-node';
  fqbn: string;
  port: string;
  sketchCode: string;
}

export interface UploadResult {
  success: boolean;
  summaryMessage: string;
  technicalDetails: string;
  uploadedAt: string;
}

export interface SerialMonitorOptions {
  port: string;
  baudRate?: number;
}

export interface SerialMonitorCallbacks {
  onData: (chunk: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export interface SerialMonitorSession {
  port: string;
  baudRate: number;
  disconnect: () => Promise<void>;
}

/**
 * Contrato principal de comunicación entre Bi-Tech IoT Studio y el hardware real.
 */
export interface HardwareBridge {
  listPorts(): Promise<SerialPortInfo[]>;
  compile(request: CompileRequest): Promise<CompileResult>;
  upload(
    request: UploadRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult>;
  openSerialMonitor(
    options: SerialMonitorOptions,
    callbacks: SerialMonitorCallbacks
  ): Promise<SerialMonitorSession>;
}

/**
 * Detecta si la aplicación se está ejecutando en un entorno web alojado (ej. Firebase Hosting)
 * donde no está presente el middleware local de Arduino CLI.
 */
export function isHostedWebEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = window.location.hostname;
  return (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    !host.startsWith('192.168.') &&
    !host.startsWith('10.') &&
    !host.endsWith('.local')
  );
}

/**
 * Sanitiza salidas técnicas de compilación y carga para no exponer
 * direcciones MAC ni rutas de usuario locales.
 */
export function sanitizeHardwareLog(raw: string): string {
  return raw
    .replace(
      /MAC:\s*([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}/g,
      'MAC: [REDACTED]'
    )
    .replace(/[A-Za-z]:\\Users\\[^\\/\r\n"]+/g, '<LOCAL_USER_PATH>');
}

/**
 * Implementación local de HardwareBridge conectada al middleware local de
 * desarrollo que invoca Arduino CLI y el puerto serie del sistema.
 */
export class LocalArduinoCliHardwareBridge implements HardwareBridge {
  async listPorts(): Promise<SerialPortInfo[]> {
    const response = await fetch('/api/hardware/ports');
    if (!response.ok) {
      throw new Error('No se pudo consultar la lista de puertos disponibles.');
    }
    const data = (await response.json()) as { ports: SerialPortInfo[] };
    return data.ports ?? [];
  }

  async compile(request: CompileRequest): Promise<CompileResult> {
    const response = await fetch('/api/hardware/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = (await response.json()) as CompileResult;
    return {
      ...data,
      technicalDetails: sanitizeHardwareLog(data.technicalDetails || ''),
    };
  }

  async upload(
    request: UploadRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!request.port) {
      throw new Error('Seleccioná un puerto antes de cargar el programa.');
    }

    const response = await fetch('/api/hardware/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.body) {
      const fallback = (await response.json()) as UploadResult;
      return {
        ...fallback,
        technicalDetails: sanitizeHardwareLog(fallback.technicalDetails || ''),
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: UploadResult | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed) as
            | ({ type: 'progress' } & UploadProgress)
            | ({ type: 'result' } & UploadResult);

          if (event.type === 'progress') {
            onProgress?.({
              phase: event.phase,
              percentage: event.percentage,
              statusText: event.statusText,
              technicalDetails: event.technicalDetails
                ? sanitizeHardwareLog(event.technicalDetails)
                : undefined,
            });
          } else if (event.type === 'result') {
            finalResult = {
              success: event.success,
              summaryMessage: event.summaryMessage,
              technicalDetails: sanitizeHardwareLog(
                event.technicalDetails || ''
              ),
              uploadedAt: event.uploadedAt,
            };
          }
        } catch {
          // Ignorar líneas parciales no JSON
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }

    return {
      success: false,
      summaryMessage: 'No se recibió confirmación final de la carga.',
      technicalDetails: '',
      uploadedAt: new Date().toISOString(),
    };
  }

  async openSerialMonitor(
    options: SerialMonitorOptions,
    callbacks: SerialMonitorCallbacks
  ): Promise<SerialMonitorSession> {
    const baudRate = options.baudRate ?? 115200;
    const params = new URLSearchParams({
      port: options.port,
      baudRate: String(baudRate),
    });

    const eventSource = new EventSource(
      `/api/hardware/serial/stream?${params.toString()}`
    );

    eventSource.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as {
          type: 'data' | 'error' | 'status';
          text: string;
        };
        if (payload.type === 'data') {
          callbacks.onData(payload.text);
        } else if (payload.type === 'error') {
          callbacks.onError?.(payload.text);
        }
      } catch {
        callbacks.onData(ev.data);
      }
    };

    eventSource.onerror = () => {
      callbacks.onClose?.();
    };

    return {
      port: options.port,
      baudRate,
      disconnect: async () => {
        eventSource.close();
        try {
          await fetch('/api/hardware/serial/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ port: options.port }),
          });
        } catch {
          // Ignorar error de desconexión
        }
        callbacks.onClose?.();
      },
    };
  }
}

export const defaultHardwareBridge: HardwareBridge =
  new LocalArduinoCliHardwareBridge();
