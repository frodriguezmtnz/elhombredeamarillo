import type { InputManager } from '../core/InputManager';
import type { FirstPersonController } from '../player/FirstPersonController';
import type { IInteractable, InteractMode, InteractionContext } from './Interactable';

/**
 * InteractionManager (`GAME_DESIGN §6` / `TECH_ARCHITECTURE §6`): un único sistema decide qué hay
 * *bajo la mira*. Selecciona el interactuable más cercano dentro de su radio **y** dentro del cono
 * de visión (evita disparar objetos a la espalda). Expone `hovered` + callback de prompt y gestiona
 * la pulsación: primaria (E) y secundaria (Shift+E → cerrojo/sello). El raycast con oclusión por
 * mallas es una mejora de pulido; en gris-box basta proximidad+cono, y es headless-testable.
 */
export class InteractionManager {
  private readonly items = new Set<IInteractable>();
  hovered: IInteractable | null = null;
  defaultRadius = 3.0;
  /** cos del semiangulo del cono de mira (0.5 ≈ 60°) */
  aimCos = 0.42;
  onPrompt: ((text: string | null) => void) | null = null;
  onInteract: ((item: IInteractable, mode: InteractMode) => void) | null = null;

  constructor(
    private readonly player: FirstPersonController,
    private readonly input: InputManager,
  ) {}

  add(item: IInteractable): void {
    this.items.add(item);
  }

  update(base: { dayFactor: number; phase: string }): void {
    const ctx: InteractionContext = { ...base, player: this.player.position };

    let best: IInteractable | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    const p = this.player.position;
    const f = this.player.lookDirection;
    const flen = Math.hypot(f.x, f.z) || 1;

    for (const item of this.items) {
      const dx = item.position.x - p.x;
      const dz = item.position.z - p.z;
      const dist = Math.hypot(dx, dz);
      const r = item.radius ?? this.defaultRadius;
      if (dist > r) continue;
      const dlen = Math.hypot(dx, dz) || 1;
      const dot = (dx / dlen) * (f.x / flen) + (dz / dlen) * (f.z / flen);
      if (dot < this.aimCos) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }

    if (best !== this.hovered) {
      this.hovered = best;
      this.onPrompt?.(best ? best.label(ctx, this.modifierMode()) : null);
    } else if (best) {
      // refresca el texto mientras está enfocado (puede cambiar por estado)
      this.onPrompt?.(best.label(ctx, this.modifierMode()));
    }

    if (best && this.input.actionPressed('interact')) {
      const mode = this.modifierMode();
      if (best.canInteract(ctx, mode)) {
        best.interact(ctx, mode);
        this.onInteract?.(best, mode);
        this.onPrompt?.(best.label(ctx, mode));
      } else {
        this.onPrompt?.(best.label(ctx, mode));
      }
    }
  }

  private modifierMode(): InteractMode {
    return this.input.actionDown('run') ? 'secondary' : 'primary';
  }
}
