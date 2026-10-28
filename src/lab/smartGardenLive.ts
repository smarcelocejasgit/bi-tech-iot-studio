/**
 * Contrato mínimo que desacopla Smart Garden Lab del origen de datos.
 * La fuente HTTP consulta únicamente la Function; RTDB nunca queda expuesta al navegador.
 */
export interface SmartGardenLiveState {
  source: 'demo' | 'real' | 'unavailable';
  temperature: number | null;
  ambientHumidity: number | null;
  soilMoisture: number | null;
  lightLevel: number | null;
  pump: boolean | null;
  lighting: boolean | null;
  gardenNodeConnected: boolean;
  cameraNodeConnected: boolean;
  networkConnected: boolean;
  lastUpdatedAt: string | null;
  nodeId?: string;
  nodeLabel?: string;
  cameraStreamUrl?: string;
}

export interface GardenLabDataSource {
  /** `true` cuando la implementación nunca consulta hardware real. */
  readonly isDemo: boolean;
  getSnapshot(): SmartGardenLiveState;
  subscribe(listener: (state: SmartGardenLiveState) => void): () => void;
}

export interface SmartGardenNodeOption {
  id: string;
  label: string;
}

interface LatestTelemetryResponse {
  identity: {
    schoolId: string;
    labId: string;
    nodeId: string;
    nodeLabel: string;
  };
  telemetry: {
    temperature: number;
    humidity: number;
    status: 'online';
    timestamp: number;
  };
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export const DEMO_SMART_GARDEN_NODE: SmartGardenNodeOption = {
  id: 'garden-node-demo',
  label: 'Garden Node — Demo',
};

export const DEMO_LIVE_STATE: SmartGardenLiveState = {
  source: 'demo',
  temperature: 24.0,
  ambientHumidity: 60,
  soilMoisture: 650,
  lightLevel: 720,
  pump: false,
  lighting: false,
  gardenNodeConnected: false,
  cameraNodeConnected: false,
  networkConnected: false,
  lastUpdatedAt: null,
};

/** Estado inicial de la fuente real: no presenta valores demo como telemetría. */
export const UNAVAILABLE_LIVE_STATE: SmartGardenLiveState = {
  source: 'unavailable',
  temperature: null,
  ambientHumidity: null,
  soilMoisture: null,
  lightLevel: null,
  pump: null,
  lighting: null,
  gardenNodeConnected: false,
  cameraNodeConnected: false,
  networkConnected: false,
  lastUpdatedAt: null,
};

function cloneState(state: SmartGardenLiveState): SmartGardenLiveState {
  return { ...state };
}

function isLatestTelemetryResponse(
  payload: unknown
): payload is LatestTelemetryResponse {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<LatestTelemetryResponse>;
  const identity = candidate.identity;
  const telemetry = candidate.telemetry;
  return Boolean(
    identity &&
      typeof identity.nodeId === 'string' &&
      typeof identity.nodeLabel === 'string' &&
      telemetry &&
      typeof telemetry.temperature === 'number' &&
      Number.isFinite(telemetry.temperature) &&
      typeof telemetry.humidity === 'number' &&
      Number.isFinite(telemetry.humidity) &&
      telemetry.status === 'online' &&
      typeof telemetry.timestamp === 'number' &&
      Number.isFinite(telemetry.timestamp)
  );
}

/** Fuente simulada estática. No abre conexiones ni emite cambios. */
export class DemoGardenLabDataSource implements GardenLabDataSource {
  readonly isDemo = true;
  private readonly state: SmartGardenLiveState;

  constructor(state: SmartGardenLiveState = DEMO_LIVE_STATE) {
    this.state = cloneState(state);
  }

  getSnapshot(): SmartGardenLiveState {
    return cloneState(this.state);
  }

  subscribe(listener: (state: SmartGardenLiveState) => void): () => void {
    listener(this.getSnapshot());
    return () => undefined;
  }
}

/**
 * Fuente real mínima: consulta GET /latest y conserva el modo demo mientras no
 * exista una lectura válida. No accede directamente a Realtime Database.
 */
export class HttpGardenLabDataSource implements GardenLabDataSource {
  readonly isDemo = false;
  private state: SmartGardenLiveState;
  private readonly listeners = new Set<(state: SmartGardenLiveState) => void>();
  private intervalId: number | null = null;
  private refreshing = false;

  constructor(
    private readonly endpoint = '/api/garden/latest',
    fallbackState: SmartGardenLiveState = UNAVAILABLE_LIVE_STATE,
    private readonly fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
    private readonly pollIntervalMs = 5000
  ) {
    this.state = cloneState(fallbackState);
  }

  getSnapshot(): SmartGardenLiveState {
    return cloneState(this.state);
  }

  async refresh(): Promise<boolean> {
    if (this.refreshing) return false;
    this.refreshing = true;
    try {
      const response = await this.fetchImpl(this.endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) return false;

      const payload: unknown = await response.json();
      if (!isLatestTelemetryResponse(payload)) return false;

      this.state = {
        source: 'real',
        temperature: payload.telemetry.temperature,
        ambientHumidity: payload.telemetry.humidity,
        soilMoisture: null,
        lightLevel: null,
        pump: null,
        lighting: null,
        gardenNodeConnected: true,
        cameraNodeConnected: false,
        networkConnected: true,
        lastUpdatedAt: new Date(payload.telemetry.timestamp).toISOString(),
        nodeId: payload.identity.nodeId,
        nodeLabel: payload.identity.nodeLabel,
      };
      this.emit();
      return true;
    } catch {
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  subscribe(listener: (state: SmartGardenLiveState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    if (this.listeners.size === 1) {
      void this.refresh();
      this.intervalId = globalThis.setInterval(
        () => void this.refresh(),
        this.pollIntervalMs
      );
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.intervalId !== null) {
        globalThis.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const demoGardenLabDataSource = new DemoGardenLabDataSource();
export const liveGardenLabDataSource = new HttpGardenLabDataSource();
