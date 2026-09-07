import * as THREE from 'three';
import { Random } from '../utils/Random';

/**
 * NPC — habitante low-poly procedural: abrigo cápsula + cabeza + gorra opcional.
 */
export interface NPCVisual {
  group: THREE.Group;
  head: THREE.Mesh;
}

export interface NPCOptions {
  name: string;
  key: string;
  coatColor: string;
  hat: boolean;
  seed: number;
}

export function buildNPC(options: NPCOptions): NPCVisual {
  const rand = new Random(options.seed);
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: options.coatColor, roughness: 0.95 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.78, 4, 8), coat);
  body.position.y = 0.78;
  body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#b98d68', roughness: 0.85 }),
  );
  head.position.y = 1.48;
  head.castShadow = true;
  group.add(body, head);
  if (options.hat) {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.03, 10),
      new THREE.MeshStandardMaterial({ color: '#23201c', roughness: 1 }),
    );
    brim.position.y = 1.63;
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.14, 10),
      new THREE.MeshStandardMaterial({ color: '#23201c', roughness: 1 }),
    );
    crown.position.y = 1.71;
    group.add(brim, crown);
  }
  group.rotation.y = rand.range(0, Math.PI * 2);
  void options.name;
  return { group, head };
}
