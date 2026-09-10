import * as THREE from 'three';
import { TAU } from '../utils/MathUtils';
import { Random } from '../utils/Random';

export interface CurvePose {
  x: number;
  z: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
}

export interface ProjectionResult {
  s: number;
  lateral: number;
  index: number;
}

interface SamplePoint {
  x: number;
  z: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
}

/**
 * LoopRoad — la carretera en ANILLO CERRADO generada con semilla (patrón de THE ROAD `RoadCurve`).
 * El bucle ES la geometría: caminar lo bastante lejos te devuelve por el otro lado, sin teleportes.
 * El arco del pueblo (control 0) se suaviza para tener una "calle principal" casi recta.
 */
export class LoopRoad {
  readonly points: SamplePoint[];
  readonly count: number;
  readonly step: number;
  readonly length: number;

  constructor(seed: number, radius: number, spacing = 2) {
    const rand = new Random(seed);
    const controlCount = 14;
    const controls: THREE.Vector3[] = [];
    for (let i = 0; i < controlCount; i++) {
      const angle = (i / controlCount) * TAU;
      let jitter = rand.range(0.82, 1.22);
      const nearVillage = Math.min(i, controlCount - i);
      if (nearVillage <= 1) jitter = 1 + (jitter - 1) * 0.22;
      const r = radius * jitter;
      controls.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
    }

    const curve = new THREE.CatmullRomCurve3(controls, true, 'centripetal', 0.5);
    const approxLength = curve.getLength();
    const divisions = Math.max(96, Math.round(approxLength / spacing));
    const spaced = curve.getSpacedPoints(divisions);

    this.count = divisions;
    this.step = approxLength / divisions;
    this.length = this.step * this.count;

    this.points = new Array<SamplePoint>(this.count);
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
    return Math.floor(this.wrapS(s) / this.step) % this.count;
  }

  at(s: number, out: CurvePose): CurvePose {
    const f = this.wrapS(s) / this.step;
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
    const a = this.points[bestIndex];
    const b = this.points[(bestIndex + 1) % this.count];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const apx = x - a.x;
    const apz = z - a.z;
    const abLenSq = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
    const lateral = apx * a.nx + apz * a.nz;
    const s = this.wrapS((bestIndex + t) * this.step);
    return { s, lateral, index: bestIndex };
  }
}
