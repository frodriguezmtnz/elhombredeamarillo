/**
 * Smoke determinista del mundo gris (sin navegador): valida que el anillo cierra, que la
 * proyección es estable, que ni pueblo ni bosque invaden la calzada y que el spawn es válido.
 * Se ejecuta vía `pnpm --filter fromville smoke` (esbuild bundle → node).
 */
import { ringDelta } from '../src/utils/MathUtils.ts';
import { WORLD, buildLayout } from '../src/world/layout.ts';

let failures = 0;
const fail = (message: string): void => {
  console.error('\u2718', message);
  failures++;
};
const ok = (message: string): void => {
  console.log('\u2714', message);
};

for (const seed of [1234, 987654, 424242]) {
  const { curve, boxes, trees, spawn } = buildLayout(seed);
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  // 1. anillo cerrado
  curve.at(curve.length, pose);
  const endX = pose.x;
  const endZ = pose.z;
  curve.at(0, pose);
  const gap = Math.hypot(endX - pose.x, endZ - pose.z);
  if (gap > 0.5) fail(`[${seed}] el anillo no cierra: gap ${gap.toFixed(3)}m`);

  // 2. proyección s → posición → s estable
  let maxErr = 0;
  for (let i = 0; i < 200; i++) {
    const s = (i / 200) * curve.length;
    curve.at(s, pose);
    const back = curve.project(pose.x, pose.z, curve.sampleIndex(s), 80);
    maxErr = Math.max(maxErr, ringDelta(back.s, s, curve.length));
  }
  if (maxErr > 1.5) fail(`[${seed}] proyección inestable: error ${maxErr.toFixed(2)}m`);

  // 3. el pueblo queda FUERA de la calzada (lateral > semiancho)
  for (const box of boxes) {
    const proj = curve.project(box.x, box.z, curve.sampleIndex(WORLD.villageS), curve.count);
    if (Math.abs(proj.lateral) < WORLD.roadHalfWidth + 1) {
      fail(`[${seed}] edificio sobre la carretera (lateral ${proj.lateral.toFixed(1)}m)`);
      break;
    }
  }

  // 4. el bosque queda FUERA de la calzada
  for (const tree of trees) {
    const proj = curve.project(tree.x, tree.z, 0, curve.count);
    if (Math.abs(proj.lateral) < WORLD.roadHalfWidth + 3) {
      fail(`[${seed}] árbol sobre la carretera (lateral ${proj.lateral.toFixed(1)}m)`);
      break;
    }
  }

  // 5. spawn sobre la calzada y despejado de árboles
  const spawnProj = curve.project(spawn.x, spawn.z, curve.sampleIndex(WORLD.villageS), curve.count);
  if (Math.abs(spawnProj.lateral) > WORLD.roadHalfWidth) fail(`[${seed}] spawn fuera de la calzada`);
  for (const tree of trees) {
    if (Math.hypot(tree.x - spawn.x, tree.z - spawn.z) < 3) fail(`[${seed}] árbol bloquea el spawn`);
  }

  // 6. determinismo
  const again = buildLayout(seed);
  if (again.boxes.length !== boxes.length || again.trees.length !== trees.length) {
    fail(`[${seed}] el layout no es determinista`);
  }

  if (failures === 0) {
    ok(`seed ${seed}: anillo ${curve.length.toFixed(0)}m · ${boxes.length} edificios · ${trees.length} árboles`);
  }
}

if (failures > 0) {
  console.error(failures, 'fallos');
  process.exit(1);
}
console.log('SMOKE OK');
