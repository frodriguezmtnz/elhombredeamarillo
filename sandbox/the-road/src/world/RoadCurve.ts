import * as THREE from 'three';
import { TAU } from '../utils/MathUtils';
import { Random } from '../utils/Random';

export interface CurvePoint {
  x: number;
  z: number;
  /** tangente unitaria */
  tx: number;
  tz: number;
  /** normal lateral unitaria (izquierda respecto a la tangente) */
  nx: number;
  nz: number;
}

export interface CurvePose {
  x: number;
  z: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
}

export interface ProjectionResult {
  /** coordenada de arco [0..length) */
  s: number;
  /** desplazamiento lateral con signo (positivo = izquierda) */
  lateral: number;
  index: number;
}

/**
 * RoadCurve — carretera en anillo cerrado generada con semilla.
 *
 * Puntos de control sobre un círculo con jitter radial + Catmull-Rom cerrada.
 * El anillo cerrado permite que "la carretera siempre devuelve al pueblo"
 * sin teletransportes: el bucle ES la geometría.
 * El arco del pueblo (índice de control 0) se suaviza para que la calle principal
 * sea casi recta.
 */
export class RoadCurve {
  readonly points: CurvePoint[];
  readonly count: number;
  readonly step: number;
  readonly length: number;

  constructor(seed: number, radius: number, spacing = 2) {
    const rand = new Random(seed);
    const controlCount = 14;
    const controls: THREE.Vector3[] = [];
    for (let i = 0; i < controlCount; i++) {
      const angle = (i / controlCount) * TAU;
      let jitter = rand.range(0.8, 1.24);
      const nearVillage = Math.min(i, controlCount - i); // 0,1,2...
      if (nearVillage <= 1) jitter = 1 + (jitter - 1) * 0.22;
      const r = radius * jitter;
      controls.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
    }

    const curve = new THREE.CatmullRomCurve3(controls, true, 'centripetal', 0.5);
    const approxLength = curve.getLength();
    const divisions = Math.max(64, Math.round(approxLength / spacing));
    const spaced = curve.getSpacedPoints(divisions); // divisions+1 puntos, último ≈ primero

    this.count = divisions;
    this.step = approxLength / divisions;
    this.length = this.step * this.count;

    this.points = new Array<CurvePoint>(this.count);
    for (let i = 0; i < this.count; i++) {
      const prev = spaced[(i - 1 + this.count) % this.count];
      const next = spaced[(i + 1) % this.count];
      const p = spaced[i];
      let tx = next.x - prev.x;
      let tz = next.z - prev.z;
      const len = Math.hypot(tx, tz) || 1;
      tx /= len;
      tz /= len;
      this.points[i] = { x: p.x, z: p.z, tx, tz, nx: -tz, nz: tx };
    }
  }

  wrapS(s: number): number {
    const length = this.length;
    return s - length * Math.floor(s / length);
  }

  sampleIndex(s: number): number {
    const wrapped = this.wrapS(s);
    return Math.floor(wrapped / this.step) % this.count;
  }

  /** pose interpolada en la coordenada de arco s */
  at(s: number, out: CurvePose): CurvePose {
    const wrapped = this.wrapS(s);
    const f = wrapped / this.step;
    const i0 = Math.floor(f) % this.count;
    const i1 = (i0 + 1) % this.count;
    const t = f - Math.floor(f);
    const a = this.points[i0];
    const b = this.points[i1];
    out.x = a.x + (b.x - a.x) * t;
    out.z = a.z + (b.z - a.z) * t;
    out.tx = a.tx + (b.tx - a.tx) * t;
    out.tz = a.tz + (b.tz - a.tz) * t;
    const tl = Math.hypot(out.tx, out.tz) || 1;
    out.tx /= tl;
    out.tz /= tl;
    out.nx = -out.tz;
    out.nz = out.tx;
    return out;
  }

  /** posición lateral: offset positivo = izquierda */
  lateralAt(s: number, offset: number, out: CurvePose): CurvePose {
    this.at(s, out);
    out.x += out.nx * offset;
    out.z += out.nz * offset;
    return out;
  }

  /**
   * Proyección local de una posición mundial sobre la curva.
   * `hint` es el índice aproximado previo (búsqueda en ventana ±window).
   */
  project(x: number, z: number, hint: number, window = 60): ProjectionResult {
    let bestIndex = hint;
    let bestDistSq = Number.POSITIVE_INFINITY;
    for (let k = -window; k <= window; k++) {
      const index = (((hint + k) % this.count) + this.count) % this.count;
      const p = this.points[index];
      const dx = x - p.x;
      const dz = z - p.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIndex = index;
      }
    }
    // refinar proyectando sobre el segmento bestIndex → bestIndex+1
    const a = this.points[bestIndex];
    const b = this.points[(bestIndex + 1) % this.count];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const apx = x - a.x;
    const apz = z - a.z;
    const abLenSq = abx * abx + abz * abz || 1;
    let t = (apx * abx + apz * abz) / abLenSq;
    t = Math.max(0, Math.min(1, t));
    const lateral = apx * a.nx + apz * a.nz;
    const s = this.wrapS((bestIndex + t) * this.step);
    return { s, lateral, index: bestIndex };
  }

  /** índice aproximado desde un ángulo (para búsquedas globales baratas) */
  indexFromAngle(angle: number): number {
    const normalized = ((angle % TAU) + TAU) % TAU;
    return Math.floor((normalized / TAU) * this.count) % this.count;
  }
}
