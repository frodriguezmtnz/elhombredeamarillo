import type { LoopRoad } from '../world/LoopRoad';

/**
 * WaypointGraph — navegación barata para MVP (AI.md §3): SIN navmesh. El anillo de la carretera es
 * el grafo: cada sample de `LoopRoad` es un nodo y sus vecinos son el anterior/siguiente (anillo
 * cerrado). Sobre un único bucle, el A* se reduce al arco más corto, así que `path` lo calcula
 * directo (O(1) en la elección + O(k) en el tramo). Los nodos extra (claros/senderos) se pueden
 * añadir después; por ahora el pueblo tiene una sola carretera.
 */
export class WaypointGraph {
  constructor(
    private readonly curve: LoopRoad,
    readonly count: number,
  ) {}

  /** separación entre nodos consecutivos (metros). */
  get step(): number {
    return this.curve.step;
  }

  /** nodo más cercano a un punto del mundo. */
  nearest(x: number, z: number, hint: number): number {
    return this.curve.project(x, z, hint).index;
  }

  nodeX(i: number): number {
    return this.curve.points[((i % this.count) + this.count) % this.count].x;
  }

  nodeZ(i: number): number {
    return this.curve.points[((i % this.count) + this.count) % this.count].z;
  }

  /** distancia de arco (en nodos) por el camino más corto del anillo. */
  arcSteps(from: number, to: number): number {
    const d = Math.abs(from - to) % this.count;
    return Math.min(d, this.count - d);
  }

  /**
   * Secuencia de índices desde `from` (excluido) hasta `to` (incluido) por el arco más corto.
   * `out` se reutiliza para no asignar cada frame. Devuelve la longitud escrita.
   */
  path(from: number, to: number, out: number[]): number {
    const n = this.count;
    const a = ((from % n) + n) % n;
    const b = ((to % n) + n) % n;
    if (a === b) {
      out[0] = b;
      return 1;
    }
    const cw = (b - a + n) % n; // pasos en sentido creciente
    const ccw = a - b > 0 ? a - b : a + n - b; // pasos en sentido decreciente
    const goCw = cw <= ccw;
    let len = 0;
    let i = a;
    const steps = goCw ? cw : ccw;
    for (let s = 0; s < steps; s++) {
      i = goCw ? (i + 1) % n : (i - 1 + n) % n;
      out[len++] = i;
    }
    return len;
  }
}
