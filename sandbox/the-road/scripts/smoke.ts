import { ringDelta } from '../src/utils/MathUtils.ts';
/**
 * Smoke test del mundo (sin navegador):
 * verifica que la curva cierra, que la proyección es estable
 * y que las posiciones clave no colisionan con la carretera.
 * Ejecutar: node --experimental-strip-types scripts/smoke.ts
 */
import { RoadCurve } from '../src/world/RoadCurve.ts';
import { WORLD } from '../src/world/World.ts';

const curve = new RoadCurve(483920, WORLD.radius);
const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

let failures = 0;
const fail = (message: string): void => {
  console.error('✘', message);
  failures++;
};

// 1. la curva es un anillo cerrado
curve.at(curve.length, pose);
const endX = pose.x;
const endZ = pose.z;
curve.at(0, pose);
const gap = Math.hypot(endX - pose.x, endZ - pose.z);
if (gap > 0.5) fail(`el anillo no cierra: gap ${gap.toFixed(3)}m`);
else console.log('✔ anillo cerrado (gap', gap.toFixed(4), 'm)');

// 2. la proyección s → posición → s es estable
let maxError = 0;
for (let i = 0; i < 200; i++) {
  const s = (i / 200) * curve.length;
  curve.at(s, pose);
  const back = curve.project(pose.x, pose.z, curve.sampleIndex(s), 80);
  const error = ringDelta(back.s, s, curve.length);
  if (error > maxError) maxError = error;
}
if (maxError > 1.5) fail(`proyección inestable: error máximo ${maxError.toFixed(2)}m`);
else console.log('✔ proyección estable (error máximo', maxError.toFixed(3), 'm)');

// 3. separación mínima entre inicio, árbol y pueblo
const order = [WORLD.villageS, WORLD.startS, WORLD.treeS];
for (let i = 0; i < order.length - 1; i++) {
  const d = ringDelta(order[i], order[i + 1], curve.length);
  if (d < 100) fail(`posiciones demasiado cercanas: ${order[i]} → ${order[i + 1]} = ${d.toFixed(0)}m`);
}
console.log('✔ separación de posiciones clave correcta');
console.log('  longitud del anillo:', curve.length.toFixed(0), 'm');
console.log('  samples:', curve.count, '· step:', curve.step.toFixed(2), 'm');

if (failures > 0) {
  console.error(failures, 'failures');
  process.exit(1);
}
console.log('SMOKE OK');
