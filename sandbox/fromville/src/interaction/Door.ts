import type * as THREE from 'three';
import { damp } from '../utils/MathUtils';
import type { IInteractable, InteractMode, InteractionContext } from './Interactable';

/** Panel mínimo que el constructor del mundo puede conectar para animar la apertura. */
interface DoorPanel {
  rotation: THREE.Euler;
  restY: number;
}

/**
 * Door (`GAME_DESIGN §5-6`): puerta con estado persistible {abierta, sellada, con llave}.
 * - primaria (E): abrir/cerrar (bloqueado si está sellada o con llave).
 * - secundaria (Shift+E): sellar/quitar el sello — solo con la puerta **cerrada** (sellar es
 *   deliberado y silencioso; la regla de sellos del refugio lo exige).
 * `safe` = cerrada **y** sellada → es la condición que consulta el RefugeSystem.
 */
export class Door implements IInteractable {
  readonly radius = 3.3;
  open = false;
  sealed = false;
  readonly locked: boolean;
  private swing = 0;
  private target = 0;
  panel: DoorPanel | null = null;

  constructor(
    readonly id: string,
    readonly position: THREE.Vector3,
    opts: { locked?: boolean } = {},
  ) {
    this.locked = Boolean(opts.locked);
  }

  get safe(): boolean {
    return !this.open && this.sealed;
  }

  label(_ctx: InteractionContext, mode: InteractMode): string {
    if (this.locked) return 'Cerrada con llave';
    if (mode === 'secondary') {
      if (this.open) return 'Ciérrala para poder sellar';
      return this.sealed ? 'Quitar el sello' : 'Sellar la puerta';
    }
    if (this.sealed) return 'Sellada — quita el sello primero';
    return this.open ? 'Cerrar la puerta' : 'Abrir la puerta';
  }

  canInteract(_ctx: InteractionContext, mode: InteractMode): boolean {
    if (this.locked) return false;
    if (mode === 'secondary') return !this.open;
    return !this.sealed;
  }

  interact(_ctx: InteractionContext, mode: InteractMode): void {
    if (mode === 'secondary') {
      if (this.open) return;
      this.sealed = !this.sealed;
      return;
    }
    if (this.locked || this.sealed) return;
    this.open = !this.open;
    this.target = this.open ? -Math.PI * 0.62 : 0;
  }

  /** anima el panel (swing) hacia su objetivo; sin panel es no-op */
  update(dt: number): void {
    this.swing = damp(this.swing, this.target, 0.16, dt);
    if (this.panel) this.panel.rotation.y = this.panel.restY + this.swing;
  }
}
