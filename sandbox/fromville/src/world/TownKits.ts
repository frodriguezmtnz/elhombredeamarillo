import type * as THREE from 'three';
import type { AssetManager } from '../core/AssetManager';
import type { World } from './World';
import type { LandmarkKind, LandmarkSpec } from './layout';

const K = 'assets/kits/';

/** POIs que ya tienen kit de Blender (Fase 5+). */
export const GLB_KIT_KINDS: Partial<Record<LandmarkKind, string>> = {
  diner: `${K}diner.glb`,
  sheriff: `${K}sheriff.glb`,
  church: `${K}church.glb`,
  gas: `${K}gas.glb`,
  watertower: `${K}watertower.glb`,
  motel: `${K}motel.glb`,
  colina: `${K}colina.glb`,
};

/** Casas GLB (Fase 5+/MCP): footprint canónico 6×6, base z=0, puerta en +X, muro alto 3.5.
 *  Se escalan a la huella aleatoria del landmark (w, h, d) conservando proporciones del cuerpo. */
const HOUSE_REF = { w: 6, d: 6, h: 3.5 };
const HOUSE_VARIANTS = [`${K}house-a.glb`, `${K}house-b.glb`, `${K}house-c.glb`];

interface KitPlacement {
  url: string;
  sx: number;
  sy: number;
  sz: number;
}

/**
 * Materiales emisivos exportados desde los kits GLB (neón de rótulos y ventanas cálidas). El Game
 * modula su `emissiveIntensity` con el `nightFactor` (de día apagados, de noche encendidos).
 * Los GLB comparten instancias de material vía AssetManager, así que se recogen una vez por nombre.
 */
export const kitEmissives = {
  neon: [] as THREE.MeshStandardMaterial[],
  windows: [] as THREE.MeshStandardMaterial[],
};

function harvestEmissives(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const mat = m as THREE.MeshStandardMaterial;
      if (!mat?.emissive) continue;
      const nm = mat.name ?? '';
      if (nm.includes('fvm_neon') && !kitEmissives.neon.includes(mat)) kitEmissives.neon.push(mat);
      else if (nm.includes('fvm_windowGlow') && !kitEmissives.windows.includes(mat)) kitEmissives.windows.push(mat);
    }
  });
}

/** Resuelve el GLB y la escala para un landmark (POI con kit a escala 1; casa según su huella). */
function kitFor(lm: LandmarkSpec): KitPlacement | null {
  const url = GLB_KIT_KINDS[lm.kind];
  if (url) return { url, sx: 1, sy: 1, sz: 1 };
  if (lm.kind === 'house') {
    const dash = lm.id.lastIndexOf('-');
    const idx = dash >= 0 ? Number(lm.id.slice(dash + 1)) : 0;
    const variant = HOUSE_VARIANTS[(Number.isFinite(idx) ? idx : 0) % HOUSE_VARIANTS.length];
    return {
      url: variant,
      sx: lm.w / HOUSE_REF.w,
      sy: lm.h / HOUSE_REF.h,
      sz: lm.d / HOUSE_REF.d,
    };
  }
  return null;
}

/**
 * Reemplaza los landmarks procedurales por sus GLB modelados en Blender (vía MCP). Cada kit de
 * POI está modelado a las dimensiones del `layout` (escala 1, base y=0, entrada +X → mira a la
 * carretera con `rotation.y = lm.rot`); las casas se escalan a su huella. Es **aditivo y tolerante
 * a fallos**: si un `.glb` no carga, se queda el gris-box de `Town.ts` y la colisión (independiente)
 * no cambia.
 */
export async function upgradeTownKits(assets: AssetManager, world: World): Promise<number> {
  const jobs = world.layout.landmarks
    .map((lm) => ({ lm, kit: kitFor(lm) }))
    .filter((e): e is { lm: LandmarkSpec; kit: KitPlacement } => e.kit !== null)
    .map(({ lm, kit }) =>
      assets
        .instantiate(kit.url)
        .then((gltf) => {
          const old = world.group.getObjectByName(lm.id);
          gltf.name = lm.id;
          gltf.position.set(lm.x, 0, lm.z);
          gltf.rotation.y = lm.rot;
          gltf.scale.set(kit.sx, kit.sy, kit.sz);
          gltf.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          harvestEmissives(gltf);
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
