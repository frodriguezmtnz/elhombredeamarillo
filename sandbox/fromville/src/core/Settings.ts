export type Quality = 'LOW' | 'MED' | 'HIGH';

export interface SettingsSnapshot {
  quality: Quality;
  sensitivity: number;
}

const STORAGE_KEY = 'fromville:settings';

const DEFAULTS: SettingsSnapshot = { quality: 'MED', sensitivity: 1 };

/** Ajustes persistidos en localStorage (calidad + sensibilidad). Sin backend. */
export class Settings {
  private snapshot: SettingsSnapshot;

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
  }
}
