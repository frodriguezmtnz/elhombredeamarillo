import type * as THREE from 'three';
import type { IInteractable, InteractMode, InteractionContext } from './Interactable';

/**
 * Note (`GAME_DESIGN §6`, payoff narrativo de Fase 10): documento legible. El `Game` muestra `body`
 * al interactuar (callback `onRead`); el estado `read` evita repetir el reveal completo.
 * Contenido 100 % original (ver IP_ORIGINALITY.md).
 */
export class Note implements IInteractable {
  readonly radius = 2.6;
  read = false;

  constructor(
    readonly id: string,
    readonly position: THREE.Vector3,
    readonly title: string,
    readonly body: string,
  ) {}

  label(_ctx: InteractionContext, _mode: InteractMode): string {
    return this.read ? `Releer · ${this.title}` : `Leer · ${this.title}`;
  }

  canInteract(): boolean {
    return true;
  }

  interact(): void {
    this.read = true;
  }
}
