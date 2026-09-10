export type Quality = 'LOW' | 'MED' | 'HIGH';

export interface SettingsSnapshot {
  quality: Quality;
  sensitivity: number;
  moveSpeed: number; // multiplicador de velocidad de movimiento (0.6..1.6)
  masterVolume: number; // 0..1
  ambientVolume: number; // 0..1
  effectsVolume: number; // 0..1
}

const STORAGE_KEY = 'fromville:settings';

const DEFAULTS: SettingsSnapshot = {
  quality: 'MED',
  sensitivity: 1,
  moveSpeed: 1,
  masterVolume: 0.8,
  ambientVolume: 0.9,
  effectsVolume: 1,
};

/** Ajustes persistidos en localStorage (calidad + sensibilidad + mezcla de audio). Sin backend. */
export class Settings {
  private snapshot: SettingsSnapshot;
  private readonly listeners = new Set<() => void>();

  constructor() {
    this.snapshot = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.snapshot = { ...this.snapshot, ...(JSON.parse(raw) as Partial<SettingsSnapshot>) };
    } catch {
      /* almacenamiento no disponible: usar defaults */
    }
  }

  get(): SettingsSnapshot {
    return this.snapshot;
  }

  set<K extends keyof SettingsSnapshot>(key: K, value: SettingsSnapshot[K]): void {
    this.snapshot[key] = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch {
      /* ignore */
    }
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
