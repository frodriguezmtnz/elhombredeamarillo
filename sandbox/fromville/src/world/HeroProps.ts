import type { AssetManager } from '../core/AssetManager';
import type { CurvePose } from './LoopRoad';
import type { World } from './World';
import { WORLD } from './layout';

const P = 'assets/props/';

/**
 * Coloca los hero assets de Blender (GLB) junto a la plaza: pozo, cajón, barril, tumbatas y un
 * "Hollow" a lo lejos como teaser. Se ancla a la carretera usando su tangente(normal), y cada carga
 * es tolerante a fallos (si falta un .glb, el mundo sigue con su versión procedural).
 */
export async function placeHeroProps(assets: AssetManager, world: World): Promise<number> {
  const group = world.group;
  const pose: CurvePose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  world.curve.at(WORLD.villageS, pose);
  const along = (a: number, off = 0) => ({
    x: pose.x + pose.tx * a + pose.nx * off,
    z: pose.z + pose.tz * a + pose.nz * off,
  });

  const jobs: Promise<unknown>[] = [];
  const add = (url: string, x: number, z: number, rotY = 0, scale = 1) => {
    jobs.push(
      assets
        .instantiate(url)
        .then((g) => {
          g.position.set(x, 0, z);
          g.rotation.y = rotY;
          g.scale.setScalar(scale);
          group.add(g);
        })
        .catch(() => {
          /* asset ausente: se queda el procedural de la Fase 4 */
        }),
    );
  };

  const well = along(2, 1.6);
  add(`${P}well.glb`, well.x, well.z);
  const crate = along(9, WORLD.roadHalfWidth + 1.4);
  const barrel = along(10.5, WORLD.roadHalfWidth + 1.4);
  add(`${P}crate.glb`, crate.x, crate.z, 0.4);
  add(`${P}barrel.glb`, barrel.x, barrel.z);

  const church = world.layout.landmarks.find((l) => l.id === 'church');
  if (church) {
    for (let i = 0; i < 3; i++) {
      add(`${P}tombstone.glb`, church.x + (i - 1) * 1.6, church.z + 3 + (i % 2) * 1.2, 0.15 * i);
    }
  }

  const far = along(-70, 0);
  add(`${P}hollow.glb`, far.x, far.z, Math.atan2(pose.x - far.x, pose.z - far.z));

  await Promise.all(jobs);
  return jobs.length;
}
