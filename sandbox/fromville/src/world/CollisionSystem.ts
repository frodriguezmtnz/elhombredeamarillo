/**
 * Colisión 2D (plano XZ) sin motor físico: círculos (árboles, NPCs, obstáculos) y cajas
 * aproximadas con rejilla de círculos (edificios). Es el mismo patrón barato que THE ROAD.
 */
export interface CircleCollider {
  x: number;
  z: number;
  r: number;
  id?: string;
}

export class CollisionSystem {
  readonly circles: CircleCollider[] = [];

  add(x: number, z: number, r: number, id?: string): CircleCollider {
    const collider: CircleCollider = { x, z, r, id };
    this.circles.push(collider);
    return collider;
  }

  addBox(cx: number, cz: number, halfW: number, halfD: number, id?: string): CircleCollider[] {
    const colliders: CircleCollider[] = [];
    const step = Math.max(halfW, halfD);
    const count = Math.max(1, Math.ceil(step / 1.2));
    for (let ix = 0; ix < count; ix++) {
      for (let iz = 0; iz < count; iz++) {
        const t = count === 1 ? 0.5 : ix / (count - 1);
        const u = count === 1 ? 0.5 : iz / (count - 1);
        colliders.push(this.add(cx - halfW + t * halfW * 2, cz - halfD + u * halfD * 2, 0.9, id));
      }
    }
    return colliders;
  }

  /** empuja `pos` fuera de los colliders (muta x/z). Devuelve true si hubo contacto. */
  resolve(pos: { x: number; z: number }, radius: number): boolean {
    let collided = false;
    for (const circle of this.circles) {
      const dx = pos.x - circle.x;
      const dz = pos.z - circle.z;
      const minDist = circle.r + radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist && distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        const push = (minDist - dist) / dist;
        pos.x += dx * push;
        pos.z += dz * push;
        collided = true;
      } else if (distSq <= 1e-8) {
        pos.x += minDist;
        collided = true;
      }
    }
    return collided;
  }

  /** ¿hay algún collider a menos de r? (audio/efectos) */
  near(x: number, z: number, r: number): boolean {
    for (const circle of this.circles) {
      const dx = x - circle.x;
      const dz = z - circle.z;
      const rr = circle.r + r;
      if (dx * dx + dz * dz < rr * rr) return true;
    }
    return false;
  }

  /**
   * ¿el segmento (x0,z0)→(x1,z1) choca con algún collider? Se usa para la línea de visión de la
   * criatura (AI.md §2): árboles/edificios bloquean la vista. `skip` ignora un id (p. ej. la propia
   * criatura o el jugador). Coste O(n) — vale para unas pocas consultas/frame.
   */
  blocked(x0: number, z0: number, x1: number, z1: number, skip?: string): boolean {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1e-8) return false;
    for (const circle of this.circles) {
      if (skip && circle.id === skip) continue;
      const t = Math.max(0, Math.min(1, ((circle.x - x0) * dx + (circle.z - z0) * dz) / lenSq));
      const px = x0 + dx * t;
      const pz = z0 + dz * t;
      const ex = circle.x - px;
      const ez = circle.z - pz;
      if (ex * ex + ez * ez < circle.r * circle.r) return true;
    }
    return false;
  }
}
