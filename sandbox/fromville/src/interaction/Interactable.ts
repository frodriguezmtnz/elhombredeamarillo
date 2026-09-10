import type * as THREE from 'three';

/** Modo de interacción: primaria (E) o secundaria (Shift+E). */
export type InteractMode = 'primary' | 'secondary';

/** Contexto vivo que el `InteractionManager` inyecta a `canInteract`/`onInteract`. */
export interface InteractionContext {
  dayFactor: number; // 0 noche / 1 día
  phase: string;
  player: THREE.Vector3;
}

/**
 * IInteractable (GAME_DESIGN §6): una única interfaz para TODO lo interactuable (puertas, cerrojos,
 * notas, interruptores…). Nada de lógica por objeto: el InteractionManager pregunta y delega.
 */
export interface IInteractable {
  readonly id: string;
  readonly position: THREE.Vector3;
  /** radio de detección (distancia horizontal al jugador); 0 = usa el del manager */
  readonly radius?: number;
  label(ctx: InteractionContext, mode: InteractMode): string;
  canInteract(ctx: InteractionContext, mode: InteractMode): boolean;
  interact(ctx: InteractionContext, mode: InteractMode): void;
}
