/**
 * ControlsConfig — mapeo de teclas + cámara + tuning del coche.
 * Todo editable en vivo desde controls-sandbox.html y persistente en localStorage.
 * El juego lo lee en caliente: pega un JSON en el sandbox y el juego obedece.
 */

export interface ControlBindings {
  forward: string;
  back: string;
  left: string;
  right: string;
  run: string;
  interact: string;
  camera: string;
  radio: string;
  emergency: string;
  siren: string;
  debug: string;
}

export interface CameraConfig {
  mode: 'chase' | 'cockpit';
  chaseHeight: number;
  chaseDistance: number;
  /** retardo de la persecución (half-life en segundos, menor = más rígida) */
  chaseLag: number;
  cockpitX: number;
  cockpitY: number;
  cockpitZ: number;
  /** multiplicador global de sensibilidad de ratón */
  sensitivity: number;
}

export interface CarTuning {
  maxSpeed: number;
  maxReverse: number;
  accel: number;
  brake: number;
  coast: number;
  /** giro máximo (rad/s a velocidad moderada) */
  turnRate: number;
  /** suavizado de dirección (half-life en segundos) */
  steerLag: number;
}

export interface ControlsConfigData {
  bindings: ControlBindings;
  camera: CameraConfig;
  car: CarTuning;
}

export const DEFAULT_CONTROLS: ControlsConfigData = {
  bindings: {
    forward: 'KeyW',
    back: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    run: 'ShiftLeft',
    interact: 'KeyE',
    camera: 'KeyC',
    radio: 'KeyR',
    emergency: 'KeyF',
    siren: 'KeyG',
    debug: 'F3',
  },
  // defaults afinados en el sandbox (v0.3 — ambulancia)
  camera: {
    mode: 'chase',
    chaseHeight: 2.7,
    chaseDistance: 6.2,
    chaseLag: 0.1,
    cockpitX: 0.35,
    cockpitY: 1.78,
    cockpitZ: 0.55,
    sensitivity: 0.5,
  },
  car: {
    maxSpeed: 16,
    maxReverse: 7.5,
    accel: 6.6,
    brake: 20,
    coast: 1.1,
    turnRate: 0.9,
    steerLag: 0.18,
  },
};

const STORAGE_KEY = 'the-road.controls.v3';

export type ActionKey = keyof ControlBindings;

class ControlsManager {
  private data: ControlsConfigData = structuredClone(DEFAULT_CONTROLS);

  constructor() {
    this.load();
  }

  get bindings(): ControlBindings {
    return this.data.bindings;
  }

  get camera(): CameraConfig {
    return this.data.camera;
  }

  get car(): CarTuning {
    return this.data.car;
  }

  get all(): ControlsConfigData {
    return this.data;
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ControlsConfigData>;
      this.data = {
        bindings: { ...DEFAULT_CONTROLS.bindings, ...(parsed.bindings ?? {}) },
        camera: { ...DEFAULT_CONTROLS.camera, ...(parsed.camera ?? {}) },
        car: { ...DEFAULT_CONTROLS.car, ...(parsed.car ?? {}) },
      };
    } catch {
      /* config corrupta: defaults */
    }
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  replace(data: ControlsConfigData): void {
    this.data = {
      bindings: { ...DEFAULT_CONTROLS.bindings, ...data.bindings },
      camera: { ...DEFAULT_CONTROLS.camera, ...data.camera },
      car: { ...DEFAULT_CONTROLS.car, ...data.car },
    };
    this.save();
  }

  reset(): void {
    this.data = structuredClone(DEFAULT_CONTROLS);
    this.save();
  }

  code(action: ActionKey): string {
    return this.data.bindings[action];
  }
}

/** singleton compartido por juego y sandbox */
export const controls = new ControlsManager();
