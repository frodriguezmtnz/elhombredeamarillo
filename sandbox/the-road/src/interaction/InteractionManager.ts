import type * as THREE from 'three';
import type { Interactable } from './Interactable';

/**
 * Registro de puntos interactivos + selección del mejor candidato
 * (más cercano y dentro del cono de visión del jugador).
 */
export class InteractionManager {
  private readonly items = new Set<Interactable>();

  get size(): number {
    return this.items.size;
  }

  add(item: Interactable): Interactable {
    this.items.add(item);
    return item;
  }

  remove(item: Interactable): void {
    this.items.delete(item);
  }

  findBest(eye: THREE.Vector3, forward: THREE.Vector3): { item: Interactable; distance: number } | null {
    let best: Interactable | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of this.items) {
      if (!item.active) continue;
      const dx = item.position.x - eye.x;
      const dy = item.position.y - eye.y;
      const dz = item.position.z - eye.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance > item.radius || distance < 1e-4) continue;
      const invDist = 1 / distance;
      const dot = forward.x * dx * invDist + forward.y * dy * invDist + forward.z * dz * invDist;
      // cono generoso: mirar aproximadamente hacia el objeto
      if (dot < 0.55) continue;
      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best ? { item: best, distance: bestDistance } : null;
  }
}
