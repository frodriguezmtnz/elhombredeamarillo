import * as THREE from 'three';
import { MAT, impostorGeo, treeFoliageGeo, treeTrunkGeo } from './kits';
import type { TreeSpec } from './layout';

/**
 * Forest — bosque instanciado con LOD estático por distancia a la carretera:
 *  - near  → tronco + copa (cylinder+cone), se ve detallado al caminar el borde.
 *  - far   → impostor (dos quads en aspa), baratísimo; lo tapa la niebla de todos modos.
 * Cada lote es 1 draw call (InstancedMesh), no 1 por árbol (PERFORMANCE.md §3).
 */
export function buildForest(trees: TreeSpec[]): THREE.Group {
  const group = new THREE.Group();
  const near = trees.filter((t) => t.near);
  const far = trees.filter((t) => !t.near);
  const dummy = new THREE.Object3D();

  if (near.length > 0) {
    const trunk = new THREE.InstancedMesh(treeTrunkGeo(), MAT.trunk, near.length);
    const foliage = new THREE.InstancedMesh(treeFoliageGeo(), MAT.foliage, near.length);
    near.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, (i * 2.399) % (Math.PI * 2), 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);
      foliage.setMatrixAt(i, dummy.matrix);
    });
    trunk.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    group.add(trunk, foliage);
  }

  if (far.length > 0) {
    const impostors = new THREE.InstancedMesh(impostorGeo(), MAT.impostor, far.length);
    far.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
      dummy.scale.set(t.scale * 1.2, t.scale, t.scale * 1.2);
      dummy.updateMatrix();
      impostors.setMatrixAt(i, dummy.matrix);
    });
    impostors.instanceMatrix.needsUpdate = true;
    group.add(impostors);
  }

  return group;
}
