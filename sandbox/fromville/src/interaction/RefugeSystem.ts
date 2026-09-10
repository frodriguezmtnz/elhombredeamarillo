import type { FirstPersonController } from '../player/FirstPersonController';
import type { Door } from './Door';

/** Un refugio = hito + su radio + las puertas que lo sellan (`GAME_DESIGN §5`). */
export interface Refuge {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly doors: Door[];
}

/**
 * RefugeSystem: la **regla de sellos**. Un refugio es seguro solo si TODAS sus puertas están
 * cerradas **y** selladas, y el jugador está dentro de su radio. La seguridad es **activa**:
 * se recalcula cada frame (abrir una puerta o romper un sello la revoca). Es la base de los
 * checkpoints y de las señales del Horror Director (Fase 9).
 */
export class RefugeSystem {
  readonly refuges: Refuge[] = [];
  private inside: Refuge | null = null;
  onSafeChange: ((safe: boolean, refuge: Refuge | null) => void) | null = null;

  add(refuge: Refuge): void {
    this.refuges.push(refuge);
  }

  static isSealed(refuge: Refuge): boolean {
    return refuge.doors.length > 0 && refuge.doors.every((door) => door.safe);
  }

  get current(): Refuge | null {
    return this.inside;
  }

  get safe(): boolean {
    return this.inside !== null && RefugeSystem.isSealed(this.inside);
  }

  update(player: FirstPersonController): void {
    const p = player.position;
    let found: Refuge | null = null;
    for (const refuge of this.refuges) {
      const dx = p.x - refuge.x;
      const dz = p.z - refuge.z;
      if (dx * dx + dz * dz <= refuge.radius * refuge.radius) {
        found = refuge;
        break;
      }
    }
    const wasSafe = this.safe;
    this.inside = found;
    const nowSafe = this.safe;
    if (wasSafe !== nowSafe) this.onSafeChange?.(nowSafe, found);
  }
}
