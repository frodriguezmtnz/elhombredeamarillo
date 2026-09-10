import * as THREE from 'three';
import type { CollisionSystem } from './CollisionSystem';
import { buildLandmark } from './kits';
import type { LandmarkSpec } from './layout';

/**
 * Town — monta los POIs del layout con sus kits y registra colisión. Cada landmark es un grupo
 * con su huella (w×d); la torre de agua usa un círculo (patas). Día/noche y luz ya los lleva World.
 */
export function buildTown(landmarks: LandmarkSpec[], collisions: CollisionSystem): THREE.Group {
  const group = new THREE.Group();
  for (const lm of landmarks) {
    const node = buildLandmark(lm.kind, lm.w, lm.h, lm.d);
    node.name = lm.id;
    node.position.set(lm.x, 0, lm.z);
    node.rotation.y = lm.rot;
    group.add(node);
    if (lm.kind === 'watertower') collisions.add(lm.x, lm.z, 2.4, lm.id);
    else collisions.addBox(lm.x, lm.z, lm.w / 2, lm.d / 2, lm.id);
  }
  return group;
}
