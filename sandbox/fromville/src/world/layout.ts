import { ringDelta } from '../utils/MathUtils';
import { Random } from '../utils/Random';
import { LoopRoad } from './LoopRoad';

/** Parámetros del mundo. Única fuente de verdad; la valida `scripts/smoke.ts`. */
export const WORLD = {
  radius: 220,
  roadHalfWidth: 3.6,
  /** coordenada de arco del núcleo urbano (control 0, tramo suavizado = calle principal) */
  villageS: 0,
  /** árboles con lateral menor que esto usan geometría detallada; el resto, impostor */
  nearLateral: 22,
  treeCount: 340,
  rockCount: 46,
  /** radio de "plaza" alrededor del núcleo donde no se ponen árboles (deja sitio al pueblo) */
  townKeep: 74,
} as const;

export type LandmarkKind = 'house' | 'diner' | 'sheriff' | 'church' | 'gas' | 'watertower';

export interface LandmarkSpec {
  id: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  rot: number;
  w: number;
  d: number;
  h: number;
}

export interface TreeSpec {
  x: number;
  z: number;
  scale: number;
  r: number;
  near: boolean;
}

export interface LampSpec {
  x: number;
  z: number;
}

export interface RockSpec {
  x: number;
  z: number;
  scale: number;
}

export interface WorldLayout {
  curve: LoopRoad;
  landmarks: LandmarkSpec[];
  trees: TreeSpec[];
  lamps: LampSpec[];
  rocks: RockSpec[];
  spawn: { x: number; z: number; yaw: number };
}

interface Pose {
  x: number;
  z: number;
  tx: number;
  tz: number;
  nx: number;
  nz: number;
}

function place(
  curve: LoopRoad,
  s: number,
  lateral: number,
  side: number,
  out: Pose,
): { x: number; z: number; rot: number } {
  curve.at(s, out);
  return {
    x: out.x + out.nx * lateral * side,
    z: out.z + out.nz * lateral * side,
    rot: Math.atan2(out.tx, out.tz) + (side < 0 ? Math.PI : 0),
  };
}

/**
 * `buildLayout(seed)` es PURO y determinista: misma semilla → mismo pueblo. No toca THREE.Scene,
 * solo matemática/posición, para poder probarlo en Node (smoke) sin navegador ni render.
 */
export function buildLayout(seed: number): WorldLayout {
  const curve = new LoopRoad(seed, WORLD.radius);
  const rand = new Random(seed ^ 0x9e3779b9);
  const pose: Pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  const hw = WORLD.roadHalfWidth;

  // --- POIs / landmarks (WORLD_DESIGN.md §4): nombres originales, ver IP_ORIGINALITY.md ---
  const landmarks: LandmarkSpec[] = [];
  const named: { kind: LandmarkKind; s: number; side: number; lat: number; w: number; d: number; h: number }[] = [
    { kind: 'diner', s: WORLD.villageS + 4, side: 1, lat: hw + 4, w: 9, d: 6, h: 3.4 },
    { kind: 'sheriff', s: WORLD.villageS - 6, side: -1, lat: hw + 4, w: 7, d: 6, h: 4 },
    { kind: 'church', s: WORLD.villageS + 20, side: 1, lat: hw + 6, w: 8, d: 13, h: 5.5 },
    { kind: 'gas', s: WORLD.villageS + 260, side: -1, lat: hw + 5, w: 10, d: 8, h: 4.5 },
    { kind: 'watertower', s: WORLD.villageS - 180, side: 1, lat: hw + 12, w: 6, d: 6, h: 16 },
  ];
  for (const lm of named) {
    const p = place(curve, lm.s, lm.lat, lm.side, pose);
    landmarks.push({ id: lm.kind, kind: lm.kind, x: p.x, z: p.z, rot: p.rot, w: lm.w, d: lm.d, h: lm.h });
  }

  // --- casas genéricas alrededor de la plaza ---
  for (let i = 0; i < 6; i++) {
    const along = (i - 2.5) * 10;
    const side = i % 2 === 0 ? 1 : -1;
    const lat = hw + 3 + rand.range(0, 3);
    const p = place(curve, WORLD.villageS + along, lat, side, pose);
    landmarks.push({
      id: `house-${i}`,
      kind: 'house',
      x: p.x,
      z: p.z,
      rot: p.rot,
      w: rand.range(4, 7),
      d: rand.range(4, 8),
      h: rand.range(3, 6),
    });
  }

  // --- farolas a ambos lados de la calle principal (solo cerca del núcleo) ---
  const lamps: LampSpec[] = [];
  for (let i = -2; i <= 2; i++) {
    for (const side of [1, -1]) {
      const p = place(curve, WORLD.villageS + i * 20, hw + 1.3, side, pose);
      lamps.push({ x: p.x, z: p.z });
    }
  }

  // --- bosque: árboles fuera de calzada y plaza, con tier near/far por distancia a la carretera ---
  const trees: TreeSpec[] = [];
  let guard = 0;
  while (trees.length < WORLD.treeCount && guard < WORLD.treeCount * 8) {
    guard++;
    const s = rand.range(0, curve.length);
    const side = rand.sign();
    const lateral = hw + 8 + rand.range(0, 42);
    if (ringDelta(s, WORLD.villageS, curve.length) < WORLD.townKeep && lateral < 30) continue;
    const p = place(curve, s, lateral, side, pose);
    const scale = rand.range(0.7, 1.7);
    trees.push({ x: p.x, z: p.z, scale, r: 0.6 * scale, near: lateral < WORLD.nearLateral });
  }

  // --- rocas dispersas en la banda forestal ---
  const rocks: RockSpec[] = [];
  for (let i = 0; i < WORLD.rockCount; i++) {
    const s = rand.range(0, curve.length);
    const side = rand.sign();
    const lateral = hw + 6 + rand.range(0, 40);
    const p = place(curve, s, lateral, side, pose);
    rocks.push({ x: p.x, z: p.z, scale: rand.range(0.5, 1.6) });
  }

  // --- spawn sobre la calzada, mirando a lo largo de la carretera ---
  curve.at(WORLD.villageS, pose);
  const spawn = { x: pose.x, z: pose.z, yaw: Math.atan2(-pose.tx, -pose.tz) };

  return { curve, landmarks, trees, lamps, rocks, spawn };
}
