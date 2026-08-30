import { clamp } from '../utils/MathUtils';

export type Quality = 'low' | 'medium' | 'high';

export interface RoadSettings {
  quality: Quality;
  sensitivity: number; // 0.2 - 3
  masterVolume: number; // 0 - 1
  ambientVolume: number; // 0 - 1
  effectsVolume: number; // 0 - 1
  fullscreen: boolean;
}

const STORAGE_KEY = 'the-road.settings.v1';

export const DEFAULT_SETTINGS: RoadSettings = {
  quality: 'medium',
  sensitivity: 1,
  masterVolume: 0.8,
  ambientVolume: 0.7,
  effectsVolume: 0.8,
  fullscreen: false,
};

export class Settings {
  private data: RoadSettings;
  private listeners = new Set<() => void>();

  constructor() {
    this.data = { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Partial<RoadSettings> = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch {
      /* almacenamiento no disponible: usar defaults */
    }
    this.data.sensitivity = clamp(this.data.sensitivity, 0.2, 3);
  }

  get(): Readonly<RoadSettings> {
    return this.data;
  }

  set<K extends keyof RoadSettings>(key: K, value: RoadSettings[K]): void {
    this.data[key] = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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
