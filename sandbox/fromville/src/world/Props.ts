import * as THREE from 'three';
import { MAT, lampHeadGeo, lampPoleGeo, rockGeo } from './kits';
import type { LampSpec, RockSpec } from './layout';

/**
 * Props — elementos repetitivos instanciados: farolas (poste + cabeza) a lo largo de la calle y
 * rocas dispersas. Un lote = 1 draw call. Las cabezas de farola irán emisivas de noche (Fase 7+).
 */
export function buildProps(lamps: LampSpec[], rocks: RockSpec[]): THREE.Group {
  const group = new THREE.Group();
  const dummy = new THREE.Object3D();

  if (lamps.length > 0) {
    const pole = new THREE.InstancedMesh(lampPoleGeo(), MAT.metal, lamps.length);
    const head = new THREE.InstancedMesh(lampHeadGeo(), MAT.lampGlow, lamps.length);
    lamps.forEach((l, i) => {
      dummy.position.set(l.x, 0, l.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      pole.setMatrixAt(i, dummy.matrix);
      head.setMatrixAt(i, dummy.matrix);
    });
    pole.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    group.add(pole, head);
  }

  if (rocks.length > 0) {
    const rockMesh = new THREE.InstancedMesh(rockGeo(), MAT.rock, rocks.length);
    rocks.forEach((r, i) => {
      dummy.position.set(r.x, r.scale * 0.3, r.z);
      dummy.rotation.set((i * 1.3) % 3, (i * 2.1) % 3, (i * 0.7) % 3);
      dummy.scale.setScalar(r.scale);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(i, dummy.matrix);
    });
    rockMesh.instanceMatrix.needsUpdate = true;
    group.add(rockMesh);
  }

  return group;
}
