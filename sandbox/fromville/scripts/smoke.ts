/**
 * Smoke determinista del mundo gris (sin navegador): valida que el anillo cierra, que la
 * proyección es estable, que POIs/bosque/farolas no invaden la calzada y que el spawn es válido.
 * Se ejecuta vía `pnpm --filter fromville smoke` (esbuild bundle → node).
 */
import * as THREE from 'three';
import { Creature } from '../src/creatures/Creature.ts';
import { Door } from '../src/interaction/Door.ts';
import { RefugeSystem } from '../src/interaction/RefugeSystem.ts';
import { ringDelta } from '../src/utils/MathUtils.ts';
import { CollisionSystem } from '../src/world/CollisionSystem.ts';
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
  const { curve, landmarks, trees, lamps, spawn } = buildLayout(seed);
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  // 1. anillo cerrado
  curve.at(curve.length, pose);
  const endX = pose.x;
  const endZ = pose.z;
  curve.at(0, pose);
  if (Math.hypot(endX - pose.x, endZ - pose.z) > 0.5) fail(`[${seed}] el anillo no cierra`);

  // 2. proyección s → posición → s estable
  let maxErr = 0;
  for (let i = 0; i < 200; i++) {
    const s = (i / 200) * curve.length;
    curve.at(s, pose);
    const back = curve.project(pose.x, pose.z, curve.sampleIndex(s), 80);
    maxErr = Math.max(maxErr, ringDelta(back.s, s, curve.length));
  }
  if (maxErr > 1.5) fail(`[${seed}] proyección inestable: ${maxErr.toFixed(2)}m`);

  // 3. los POIs quedan FUERA de la calzada
  for (const lm of landmarks) {
    const proj = curve.project(lm.x, lm.z, curve.sampleIndex(WORLD.villageS), curve.count);
    if (Math.abs(proj.lateral) < WORLD.roadHalfWidth + 1) {
      fail(`[${seed}] POI '${lm.id}' sobre la carretera (lateral ${proj.lateral.toFixed(1)}m)`);
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

  // 5. las farolas flanquean la calzada (lejos pero pegadas)
  for (const lamp of lamps) {
    const proj = curve.project(lamp.x, lamp.z, curve.sampleIndex(WORLD.villageS), curve.count);
    if (Math.abs(proj.lateral) < WORLD.roadHalfWidth + 0.4) {
      fail(`[${seed}] farola sobre la carretera (lateral ${proj.lateral.toFixed(1)}m)`);
      break;
    }
  }

  // 6. spawn sobre la calzada y despejado de árboles
  const spawnProj = curve.project(spawn.x, spawn.z, curve.sampleIndex(WORLD.villageS), curve.count);
  if (Math.abs(spawnProj.lateral) > WORLD.roadHalfWidth) fail(`[${seed}] spawn fuera de la calzada`);
  for (const tree of trees) {
    if (Math.hypot(tree.x - spawn.x, tree.z - spawn.z) < 3) fail(`[${seed}] árbol bloquea el spawn`);
  }

  // 7. determinismo + tier de LOD
  const again = buildLayout(seed);
  if (again.landmarks.length !== landmarks.length || again.trees.length !== trees.length) {
    fail(`[${seed}] el layout no es determinista`);
  }
  const near = trees.filter((t) => t.near).length;
  if (near === 0 || near === trees.length) fail(`[${seed}] LOD degenerado (near ${near}/${trees.length})`);

  if (failures === 0) {
    ok(
      `seed ${seed}: anillo ${curve.length.toFixed(0)}m · ${landmarks.length} POIs · ${near} árboles near / ${
        trees.length - near
      } far · ${lamps.length} farolas`,
    );
  }
}

// 8. Fase 6: máquina de estados de puertas + regla de sellos (GAME_DESIGN §5)
{
  const ctx = { dayFactor: 0.2, phase: 'NIGHT', player: new THREE.Vector3() };
  const door = new Door('t', new THREE.Vector3());
  if (door.safe) fail('F6: la puerta arranca insegura, no sellada');
  door.interact(ctx, 'secondary'); // sellar (cerrada)
  if (!door.safe) fail('F6: sellar una puerta cerrada debería ponerla safe');
  if (door.canInteract(ctx, 'primary')) fail('F6: sellada no se puede abrir sin quitar el sello');
  door.interact(ctx, 'secondary'); // quitar sello
  door.interact(ctx, 'primary'); // abrir
  if (!door.open) fail('F6: la primaria debería abrir una puerta cerrada');
  if (door.canInteract(ctx, 'secondary')) fail('F6: no se puede sellar una puerta abierta');
  door.interact(ctx, 'primary'); // cerrar
  const refuge = { id: 'r', x: 0, z: 0, radius: 3, doors: [door] };
  if (RefugeSystem.isSealed(refuge)) fail('F6: refugio sin sellar no es seguro');
  door.interact(ctx, 'secondary'); // sellar
  if (!RefugeSystem.isSealed(refuge)) fail('F6: refugio con puerta sellada es seguro');
  const locked = new Door('l', new THREE.Vector3(), { locked: true });
  if (locked.canInteract(ctx, 'primary') || locked.canInteract(ctx, 'secondary')) {
    fail('F6: una puerta con llave no admite interacción');
  }
  if (failures === 0) ok('Fase 6: puertas + regla de sellos correctas');
}

// 9. Fase 8: percepción (awareness) + FSM de la criatura → Consume (AI.md §2)
{
  const seed = 1234;
  const { curve } = buildLayout(seed);
  const collisions = new CollisionSystem(); // vacío: sin oclusión → test determinista de la FSM
  const creature = new Creature(curve, collisions, WORLD.villageS + 90, seed ^ 0x51ed);
  const player = { x: creature.pos.x + 18, z: creature.pos.z };
  let consumed = 0;
  creature.onConsume = () => {
    consumed++;
  };
  const dt = 1 / 60;
  let sawChase = false;
  for (let i = 0; i < 3600; i++) {
    const dx = creature.pos.x - player.x;
    const dz = creature.pos.z - player.z;
    const d = Math.hypot(dx, dz) || 1;
    creature.update({
      dt,
      playerX: player.x,
      playerZ: player.z,
      playerDirX: dx / d, // apuntándole con la linterna → se autodelata
      playerDirZ: dz / d,
      flashlightOn: true,
      sprinting: false,
      walking: true,
      active: true,
      safe: false,
      nightFactor: 1,
    });
    if (creature.state === 'Chase') sawChase = true;
    if (!Number.isFinite(creature.pos.x) || !Number.isFinite(creature.pos.z)) {
      fail('F8: posición de la criatura se vuelve NaN');
      break;
    }
    if (consumed > 0) break;
  }
  if (consumed === 0) fail(`F8: la criatura no llegó a consumir (estado final ${creature.state})`);
  if (!sawChase) fail('F8: nunca entró en Chase antes de consumir');

  // de día debe volver a letargo (Dormant) y no perseguir
  creature.reset();
  for (let i = 0; i < 600; i++) {
    creature.update({
      dt,
      playerX: player.x,
      playerZ: player.z,
      playerDirX: 0,
      playerDirZ: 1,
      flashlightOn: false,
      sprinting: false,
      walking: false,
      active: false,
      safe: false,
      nightFactor: 0,
    });
  }
  if (creature.state !== 'Dormant') fail(`F8: de día no quedó en letargo (${creature.state})`);

  if (failures === 0) ok('Fase 8: percepción + FSM + Consume correctos (y letargo de día)');
}

if (failures > 0) {
  console.error(failures, 'fallos');
  process.exit(1);
}
console.log('SMOKE OK');
