/**
 * Contrato mínimo que desacopla la interfaz de Smart Garden Lab de la fuente de datos.
 * Hoy existe solamente `DemoGardenLabDataSource` (datos simulados).
 * Infraestructura futura (NO implementada): MQTT / WebSocket / Firebase / streaming real.
 */
export interface SmartGardenLiveState {
  temperature: number; // °C
  ambientHumidity: number; // %
  soilMoisture: number; // lectura analógica cruda (sin calibrar)
  lightLevel: number; // lectura LDR cruda

  pump: boolean;
  lighting: boolean;

  gardenNodeConnected: boolean;
  cameraNodeConnected: boolean;
  networkConnected: boolean;

  cameraStreamUrl?: string;
}

export interface GardenLabDataSource {
  /** `true` cuando los datos NO provienen de hardware físico. */
  readonly isDemo: boolean;
  getSnapshot(): SmartGardenLiveState;
  subscribe(listener: (state: SmartGardenLiveState) => void): () => void;
}

export interface SmartGardenNodeOption {
  id: string;
  label: string;
}

export const DEMO_SMART_GARDEN_NODE: SmartGardenNodeOption = {
  id: 'garden-node-demo',
  label: 'Garden Node — Demo',
};

export const DEMO_LIVE_STATE: SmartGardenLiveState = {
  temperature: 24.0,
  ambientHumidity: 60,
  soilMoisture: 650,
  lightLevel: 720,
  pump: false,
  lighting: false,
  gardenNodeConnected: false,
  cameraNodeConnected: false,
  networkConnected: false,
};

/**
 * Fuente de datos simulada y estática. No abre conexiones ni emite cambios.
 */
export class DemoGardenLabDataSource implements GardenLabDataSource {
  readonly isDemo = true;
  private readonly state: SmartGardenLiveState;

  constructor(state: SmartGardenLiveState = DEMO_LIVE_STATE) {
    this.state = { ...state };
  }

  getSnapshot(): SmartGardenLiveState {
    return this.state;
  }

  subscribe(listener: (state: SmartGardenLiveState) => void): () => void {
    listener(this.state);
    return () => undefined;
  }
}

export const demoGardenLabDataSource = new DemoGardenLabDataSource();
