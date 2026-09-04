import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Random } from '../utils/Random';
import type { RoadCurve } from './RoadCurve';

/**
 * Forest — bosque instanciado en 3 capas (NEAR/MID/FAR) + arbustos de borde.
 * Una sola geometría fusionada por capa => pocas draw calls para miles de árboles.
 */

function paint(geometry: THREE.BufferGeometry, color: string): THREE.BufferGeometry {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function makePineGeometry(simplified: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = paint(new THREE.CylinderGeometry(0.13, 0.26, 2.4, 5), '#2a1e14');
  trunk.translate(0, 1.2, 0);
  parts.push(trunk);
  const cones = simplified ? 2 : 3;
  const radii = [1.55, 1.1, 0.72];
  const heights = [2.7, 2.2, 1.7];
  const ys = [2.9, 4.4, 5.7];
  const shades = ['#15231a', '#1a2b1f', '#203526'];
  for (let i = 0; i < cones; i++) {
    const cone = paint(new THREE.ConeGeometry(radii[i], heights[i], 6), shades[i]);
    cone.translate(0, ys[i], 0);
    parts.push(cone);
  }
  return mergeGeometries(parts, false) as THREE.BufferGeometry;
}

function makeBushGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const a = paint(new THREE.IcosahedronGeometry(0.52, 0), '#1c2b1d');
  a.translate(0, 0.3, 0);
  const b = paint(new THREE.IcosahedronGeometry(0.34, 0), '#223526');
  b.translate(0.36, 0.22, 0.14);
  parts.push(a, b);
  return mergeGeometries(parts, false) as THREE.BufferGeometry;
}

function scatter(
  mesh: THREE.InstancedMesh,
  rand: Random,
  positions: { x: number; z: number }[],
  scaleRange: [number, number],
): void {
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const scale = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const tint = new THREE.Color();
  for (let i = 0; i < positions.length; i++) {
    const s = rand.range(scaleRange[0], scaleRange[1]);
    pos.set(positions[i].x, 0, positions[i].z);
    quat.setFromAxisAngle(up, rand.next() * Math.PI * 2);
    scale.set(s, s * rand.range(0.92, 1.12), s);
    matrix.compose(pos, quat, scale);
    mesh.setMatrixAt(i, matrix);
    // variación de tono: verde apagado, algún ejemplar otoñal
    if (rand.chance(0.08)) tint.setRGB(0.32, 0.27, 0.16);
    else tint.setRGB(rand.range(0.8, 1.1), rand.range(0.85, 1.05), rand.range(0.8, 1.05));
    mesh.setColorAt(i, tint);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export interface ForestLayers {
  group: THREE.Group;
  /** posiciones de árboles cercanos con colisión (para CollisionSystem) */
  colliders: { x: number; z: number; r: number }[];
}

export interface LakeExclusion {
  s: number;
  half: number;
  /** -1 o +1 = un lado; 0 = ambos lados */
  side: number;
  maxOffset: number;
}

export function buildForest(
  curve: RoadCurve,
  seed: number,
  villageS: number,
  villageHalf: number,
  treeS: number,
  clearances: LakeExclusion[] = [],
): ForestLayers {
  const inClearance = (s: number, side: number, offset: number): boolean => {
    for (const c of clearances) {
      if (c.side !== 0 && c.side !== side) continue;
      if (Math.abs(s - c.s) < c.half && Math.abs(offset) < c.maxOffset) return true;
    }
    return false;
  };
  const rand = new Random(seed ^ 0x5eed);
  const group = new THREE.Group();
  const colliders: { x: number; z: number; r: number }[] = [];
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  const inExclusion = (s: number, margin: number): boolean => {
    const dVillage = Math.min(Math.abs(s - villageS), curve.length - Math.abs(s - villageS));
    if (dVillage < villageHalf + margin) return true;
    const dTree = Math.min(Math.abs(s - treeS), curve.length - Math.abs(s - treeS));
    return dTree < 24;
  };

  // ---- capa NEAR: bordes de carretera, densa, con colisión ----
  const nearSpacing = 6.2;
  const nearPositions: { x: number; z: number }[] = [];
  for (let s = 0; s < curve.length; s += nearSpacing) {
    if (inExclusion(s, 0)) continue;
    for (const side of [1, -1]) {
      if (rand.chance(0.86)) {
        const offset = side * rand.range(7.2, 24);
        if (inClearance(s, side, Math.abs(offset))) continue;
        curve.lateralAt(s + rand.range(-1.6, 1.6), offset, pose);
        nearPositions.push({ x: pose.x, z: pose.z });
      }
    }
  }
  const nearGeometry = makePineGeometry(false);
  const forestMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const nearMesh = new THREE.InstancedMesh(nearGeometry, forestMaterial, nearPositions.length);
  nearMesh.castShadow = true;
  nearMesh.receiveShadow = true;
  scatter(nearMesh, rand, nearPositions, [0.75, 1.5]);
  group.add(nearMesh);
  // colisión solo para una parte (los primeros N) para no saturar el sistema
  for (let i = 0; i < nearPositions.length; i++) {
    if (i % 2 === 0) colliders.push({ x: nearPositions[i].x, z: nearPositions[i].z, r: 0.55 });
  }

  // ---- capa MID: detrás de la near ----
  const midPositions: { x: number; z: number }[] = [];
  for (let s = 0; s < curve.length; s += 14) {
    if (inExclusion(s, 20)) continue;
    for (const side of [1, -1]) {
      if (rand.chance(0.8)) {
        const offset = side * rand.range(24, 80);
        if (inClearance(s, side, Math.abs(offset))) continue;
        curve.lateralAt(s + rand.range(-4, 4), offset, pose);
        midPositions.push({ x: pose.x, z: pose.z });
      }
    }
  }
  const midMesh = new THREE.InstancedMesh(makePineGeometry(true), forestMaterial, midPositions.length);
  scatter(midMesh, rand, midPositions, [1.0, 2.1]);
  group.add(midMesh);

  // ---- capa FAR: relleno radial del valle (siluetas) ----
  const farPositions: { x: number; z: number }[] = [];
  let attempts = 0;
  while (farPositions.length < 520 && attempts < 4000) {
    attempts++;
    const angle = rand.next() * Math.PI * 2;
    const radius = rand.range(95, 880);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const guess = curve.indexFromAngle(angle);
    const projection = curve.project(x, z, guess, 30);
    if (Math.abs(projection.lateral) < 42) continue;
    const inZone = clearances.some(
      (c) =>
        Math.abs(projection.s - c.s) < c.half + 15 &&
        (c.side === 0 ? Math.abs(projection.lateral) < c.maxOffset + 20 : projection.lateral * c.side > 0) &&
        Math.abs(projection.lateral) < (c.side === 0 ? c.maxOffset + 20 : 85),
    );
    if (inZone) continue;
    farPositions.push({ x, z });
  }
  const farMesh = new THREE.InstancedMesh(makePineGeometry(true), forestMaterial, farPositions.length);
  scatter(farMesh, rand, farPositions, [1.6, 3.2]);
  group.add(farMesh);

  // ---- arbustos de borde (sin colisión) ----
  const bushPositions: { x: number; z: number }[] = [];
  for (let s = 0; s < curve.length; s += 11) {
    if (rand.chance(0.62)) {
      const side = rand.sign();
      curve.lateralAt(s + rand.range(-3, 3), side * rand.range(5.8, 9.5), pose);
      bushPositions.push({ x: pose.x, z: pose.z });
    }
  }
  const bushMesh = new THREE.InstancedMesh(makeBushGeometry(), forestMaterial, bushPositions.length);
  scatter(bushMesh, rand, bushPositions, [0.7, 1.35]);
  group.add(bushMesh);

  return { group, colliders };
}
