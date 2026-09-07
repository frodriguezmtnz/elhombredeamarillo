import type * as THREE from 'three';
import type { StoryPhase } from '../core/GameState';

/** Contexto evaluado cada frame (barato de construir). */
export interface EventContext {
  phase: StoryPhase;
  /** coordenada de arco actual */
  s: number;
  /** longitud total del anillo (para distancias) */
  ringLength: number;
  speed: number;
  loops: number;
  /** intentos de fuga realizados */
  attempts: number;
  ringDeltaToTree: number;
  ringDeltaToVillage: number;
  playerPos: THREE.Vector3;
}

/** API que los eventos pueden usar (estrecha, sin exponer el Game completo). */
export interface EventApi {
  narration(text: string, seconds?: number): void;
  caption(text: string, seconds?: number): void;
  lowStinger(): void;
  /** cambia el texto de la señal del pueblo (anomalía) */
  swapTownSign(): void;
  /** silueta al borde de la carretera (anomalía) */
  showFigure(): void;
}

export interface GameEventDef {
  id: string;
  once?: boolean;
  /** si true, puede dispararse una vez por intento de fuga */
  everyAttempt?: boolean;
  cooldown?: number;
  condition(ctx: EventContext): boolean;
  fire(api: EventApi, ctx: EventContext): void;
}
