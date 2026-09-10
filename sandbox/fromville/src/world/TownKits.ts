import type * as THREE from 'three';
import type { AssetManager } from '../core/AssetManager';
import type { World } from './World';
import type { LandmarkKind } from './layout';

const K = 'assets/kits/';

/** POIs que ya tienen kit de Blender (Fase 5+). `house` sigue procedural (huella aleatoria). */
export const GLB_KIT_KINDS: Partial<Record<LandmarkKind, string>> = {
  diner: `${K}diner.glb`,
  sheriff: `${K}sheriff.glb`,
  church: `${K}church.glb`,
  gas: `${K}gas.glb`,
  watertower: `${K}watertower.glb`,
};

/**
 * Reemplaza los landmarks procedurales por sus GLB modelados en Blender (vía MCP). Cada kit está
 * modelado a las dimensiones exactas del `layout` (escala 1, base en y=0, entrada en +X → mira a la
 * carretera con `rotation.y = lm.rot`). Es **aditivo y tolerante a fallos**: si un `.glb` no carga,
 * se queda el gris-box de `Town.ts` y la colisión (que es independiente) no cambia.
 */
export async function upgradeTownKits(assets: AssetManager, world: World): Promise<number> {
  const jobs = world.layout.landmarks
    .map((lm) => ({ lm, url: GLB_KIT_KINDS[lm.kind] }))
    .filter((e): e is { lm: (typeof world.layout.landmarks)[number]; url: string } => Boolean(e.url))
    .map(({ lm, url }) =>
      assets
        .instantiate(url)
        .then((gltf) => {
          const old = world.group.getObjectByName(lm.id);
          gltf.name = lm.id;
          gltf.position.set(lm.x, 0, lm.z);
          gltf.rotation.y = lm.rot;
          gltf.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          if (old?.parent) {
            old.parent.add(gltf);
            old.parent.remove(old);
          } else {
            world.group.add(gltf);
          }
          return 1;
        })
        .catch(() => 0),
    );
  const results = await Promise.all(jobs);
  return results.reduce((a, b) => a + b, 0);
}
