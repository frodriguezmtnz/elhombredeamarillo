import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Random, deriveSeed } from '../utils/Random';
import type { RoadCurve } from './RoadCurve';

export interface TreePointOfInterest {
  id: string;
  position: THREE.Vector3;
  label: string;
  caption: string;
}

export interface FallenTreeResult {
  group: THREE.Group;
  /** colliders que bloquean la carretera (coordenadas de mundo) */
  colliders: { x: number; z: number; r: number }[];
  points: TreePointOfInterest[];
}

/**
 * FallenTree — el gran árbol caído que bloquea la carretera.
 * Construido por piezas low-poly: tronco, raíces, ramas rotas, hojas,
 * escombros y marcas de arrastre en el asfalto.
 */
export function buildFallenTree(curve: RoadCurve, treeS: number, seed: number): FallenTreeResult {
  const rand = new Random(deriveSeed(seed, 'fallen-tree'));
  const group = new THREE.Group();
  const colliders: { x: number; z: number; r: number }[] = [];
  const points: TreePointOfInterest[] = [];

  const pose = curve.at(treeS, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
  const roadYaw = Math.atan2(pose.tx, pose.tz);
  group.position.set(pose.x, 0, pose.z);
  group.rotation.y = roadYaw;

  // el tronco cruza la carretera en diagonal (en espacio local: carretera = eje Z)
  const trunkLength = 15.5;
  const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.66, trunkLength, 7, 1);
  trunkGeometry.rotateZ(Math.PI / 2); // eje → X local
  trunkGeometry.translate(0, 0.95, 0);
  const bark = new THREE.MeshStandardMaterial({ color: '#2a1f14', roughness: 1, metalness: 0 });
  const trunk = new THREE.Mesh(trunkGeometry, bark);
  trunk.rotation.y = -0.55; // diagonal cruzando la carretera
  trunk.rotation.z = 0.05;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // tocón con tierra y raíces (extremo elevado, lado izquierdo de la carretera)
  const rootBall = new THREE.Group();
  const earth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 2.0, 1.1, 7),
    new THREE.MeshStandardMaterial({ color: '#191410', roughness: 1 }),
  );
  earth.position.y = 0.5;
  rootBall.add(earth);
  for (let i = 0; i < 5; i++) {
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, rand.range(1.4, 2.6), 5), bark);
    const angle = rand.next() * Math.PI * 2;
    root.position.set(
      Math.cos(angle) * rand.range(0.8, 1.6),
      rand.range(0.2, 0.9),
      Math.sin(angle) * rand.range(0.8, 1.6),
    );
    root.rotation.set(rand.range(-1.2, 1.2), angle, rand.range(-1.2, 1.2));
    root.castShadow = true;
    rootBall.add(root);
  }
  rootBall.position.set(-Math.cos(0.55) * (trunkLength / 2 - 0.3), 0.9, Math.sin(0.55) * (trunkLength / 2 - 0.3));
  group.add(rootBall);

  // ramas rotas sobre la calzada
  const branchMaterial = bark;
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#1c2a1c', roughness: 1 });
  for (let i = 0; i < 8; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, rand.range(0.09, 0.16), rand.range(1.6, 3.8), 5),
      branchMaterial,
    );
    branch.position.set(rand.range(-3, 3), 0.1 + rand.next() * 0.12, rand.range(-4.5, 4.5));
    branch.rotation.set(Math.PI / 2 + rand.range(-0.4, 0.4), rand.next() * Math.PI, rand.range(-0.3, 0.3));
    branch.castShadow = true;
    group.add(branch);
    if (i % 3 === 0) {
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(rand.range(0.45, 0.8), 0), foliageMaterial);
      leaves.position.copy(branch.position).add(new THREE.Vector3(rand.range(-0.5, 0.5), 0.35, rand.range(-0.5, 0.5)));
      leaves.castShadow = true;
      group.add(leaves);
    }
  }

  // escombros pequeños
  const debrisGeometries: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 12; i++) {
    const size = rand.range(0.08, 0.3);
    const debris = new THREE.BoxGeometry(size, size * 0.6, size * rand.range(1.5, 3.2));
    debris.rotateY(rand.next() * Math.PI);
    debris.translate(rand.range(-4.5, 4.5), 0.05, rand.range(-6, 6));
    debrisGeometries.push(debris);
  }
  const debrisMesh = new THREE.Mesh(mergeGeometries(debrisGeometries, false) as THREE.BufferGeometry, bark);
  debrisMesh.castShadow = true;
  group.add(debrisMesh);

  // marcas de arrastre en el asfalto (bajo el tronco)
  const marks = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 13.5),
    new THREE.MeshStandardMaterial({ color: '#0c0e10', roughness: 0.9, transparent: true, opacity: 0.5 }),
  );
  marks.rotation.x = -Math.PI / 2;
  marks.rotation.z = -0.55;
  marks.position.y = 0.026;
  group.add(marks);

  // ---- colliders: cadena de círculos a lo largo del tronco (en mundo) ----
  const sin = Math.sin(roadYaw - 0.55);
  const cos = Math.cos(roadYaw - 0.55);
  for (let d = -trunkLength / 2 + 1.1; d <= trunkLength / 2 - 1.1; d += 1.35) {
    const wx = pose.x + cos * d;
    const wz = pose.z + sin * d;
    colliders.push({ x: wx, z: wz, r: 1.05 });
  }
  // raíces bloquean su zona
  colliders.push({ x: rootBall.position.x + pose.x, z: rootBall.position.z + pose.z, r: 1.9 });

  // ---- puntos de interés (coordenadas de mundo) ----
  const worldAt = (localX: number, localZ: number, y: number): THREE.Vector3 =>
    new THREE.Vector3(
      pose.x + Math.cos(roadYaw) * localZ + Math.sin(roadYaw) * localX,
      y,
      pose.z - Math.sin(roadYaw) * localZ + Math.cos(roadYaw) * localX,
    );

  points.push(
    {
      id: 'tree-trunk',
      position: worldAt(0, 0, 1.1),
      label: 'Examine trunk',
      caption:
        'Freshly fallen — the break is white and wet. But the nearest trees show no wind damage. It did not fall. It was placed.',
    },
    {
      id: 'tree-roots',
      position: worldAt(rootBall.position.x, rootBall.position.z, 1.2),
      label: 'Examine roots',
      caption: 'The root ball is caked with dark soil. Fine pale roots snap under your fingers like wire.',
    },
    {
      id: 'tree-branches',
      position: worldAt(1.8, 2.6, 0.5),
      label: 'Examine branches',
      caption: 'Every twig is snapped in the same direction. Something came through here — fast, and wide.',
    },
    {
      id: 'tree-road',
      position: worldAt(-2.4, -3.2, 0.4),
      label: 'Examine the road',
      caption:
        'Long drag marks under the trunk. They begin in the middle of the asphalt. They do not reach either side.',
    },
    {
      id: 'tree-forest',
      position: worldAt(4.6, -6.5, 1.4),
      label: 'Listen',
      caption: 'The forest has gone quiet. No birds. Only the power lines overhead, humming.',
    },
  );

  return { group, colliders, points };
}
