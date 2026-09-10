import { ringDelta } from '../utils/MathUtils';
import { Random } from '../utils/Random';
import { LoopRoad } from './LoopRoad';

/** Parámetros del mundo. Única fuente de verdad; la valida `scripts/smoke.ts`. */
export const WORLD = {
  radius: 220,
  roadHalfWidth: 3.6,
  /** coordenada de arco del núcleo urbano (control 0, tramo suavizado = calle principal) */
  villageS: 0,
  buildingCount: 8,
  treeCount: 260,
  /** radio de "plaza" alrededor del núcleo donde no se ponen árboles (deja sitio al pueblo) */
  townKeep: 70,
} as const;

export interface BoxSpec {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rot: number;
}

export interface TreeSpec {
  x: number;
  z: number;
  scale: number;
  r: number;
}

export interface WorldLayout {
  curve: LoopRoad;
  boxes: BoxSpec[];
  trees: TreeSpec[];
  spawn: { x: number; z: number; yaw: number };
}

/**
 * `buildLayout(seed)` es PURO y determinista: misma semilla → mismo pueblo. No toca THREE.Scene,
 * solo matemática/posición, para poder probarlo en Node (smoke) sin navegador ni render.
 */
export function buildLayout(seed: number): WorldLayout {
  const curve = new LoopRoad(seed, WORLD.radius);
  const rand = new Random(seed ^ 0x9e3779b9);
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  // --- pueblo: cajas a ambos lados de la calle principal, SIGUIENDO la curva ---
  const boxes: BoxSpec[] = [];
  curve.at(WORLD.villageS, pose);
  for (let i = 0; i < WORLD.buildingCount; i++) {
    const along = (i - (WORLD.buildingCount - 1) / 2) * 9;
    const side = i % 2 === 0 ? 1 : -1;
    const lateral = WORLD.roadHalfWidth + 3 + rand.range(0, 3);
    const w = rand.range(4, 7);
    const h = rand.range(3, 6);
    const d = rand.range(4, 8);
    curve.at(WORLD.villageS + along, pose);
    boxes.push({
      x: pose.x + pose.nx * lateral * side,
      z: pose.z + pose.nz * lateral * side,
      w,
      h,
      d,
      rot: Math.atan2(pose.tx, pose.tz) + (side < 0 ? Math.PI : 0),
    });
  }

  // --- bosque: árboles a lo largo del anillo, fuera de la calzada y de la plaza ---
  const trees: TreeSpec[] = [];
  let guard = 0;
  while (trees.length < WORLD.treeCount && guard < WORLD.treeCount * 8) {
    guard++;
    const s = rand.range(0, curve.length);
    const side = rand.sign();
    const lateral = WORLD.roadHalfWidth + 8 + rand.range(0, 40);
    const nearTown = ringDelta(s, WORLD.villageS, curve.length) < WORLD.townKeep;
    if (nearTown && lateral < 30) continue;
    curve.at(s, pose);
    const x = pose.x + pose.nx * lateral * side;
    const z = pose.z + pose.nz * lateral * side;
    const scale = rand.range(0.7, 1.7);
    trees.push({ x, z, scale, r: 0.6 * scale });
  }

  // --- spawn sobre la calzada, mirando a lo largo de la carretera ---
  curve.at(WORLD.villageS, pose);
  const spawn = { x: pose.x, z: pose.z, yaw: Math.atan2(-pose.tx, -pose.tz) };

  return { curve, boxes, trees, spawn };
}
