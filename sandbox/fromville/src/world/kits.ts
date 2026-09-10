import * as THREE from 'three';
import type { LandmarkKind } from './layout';

/** Materiales compartidos (gris estilizado; el color final lo da DayNight + PostFX). */
export const MAT = {
  house: new THREE.MeshStandardMaterial({ color: 0x6b7078, roughness: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.9 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x33373c, roughness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 1 }),
  accent: new THREE.MeshStandardMaterial({ color: 0x8a4a24, roughness: 0.8 }),
  /** cabeza de farola: emisivo (bloom lo capta). La intensidad la fija el Game según nightFactor. */
  lampGlow: new THREE.MeshStandardMaterial({
    color: 0x1a1408,
    emissive: 0xffb45c,
    emissiveIntensity: 0,
    roughness: 1,
  }),
  metal: new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 0.55, metalness: 0.4 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }),
  foliage: new THREE.MeshStandardMaterial({ color: 0x33463a, roughness: 1 }),
  impostor: new THREE.MeshStandardMaterial({ color: 0x2b3a2c, roughness: 1, side: THREE.DoubleSide }),
  rock: new THREE.MeshStandardMaterial({ color: 0x4a463f, roughness: 1 }),
};

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

/** techo a 4 aguas: cono de 4 lados escalado a la huella w×d */
function pyramid(w: number, d: number, h: number, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(1, h, 4), mat);
  m.rotation.y = Math.PI / 4;
  m.scale.set(w / Math.SQRT2, 1, d / Math.SQRT2);
  return m;
}

function makeHouse(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const body = box(w, h, d, MAT.house);
  body.position.y = h / 2;
  const rh = Math.max(1, h * 0.45);
  const roof = pyramid(w + 0.5, d + 0.5, rh, MAT.roof);
  roof.position.y = h + rh / 2;
  const door = box(0.9, 1.9, 0.12, MAT.dark);
  door.position.set(0, 0.95, d / 2 + 0.06);
  g.add(body, roof, door);
  return g;
}

function makeDiner(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const body = box(w, h, d, MAT.wall);
  body.position.y = h / 2;
  const roof = box(w + 0.4, 0.35, d + 0.4, MAT.roof);
  roof.position.y = h + 0.17;
  const door = box(1, 2, 0.12, MAT.dark);
  door.position.set(0, 1, d / 2 + 0.06);
  g.add(body, roof, door);
  for (const x of [-w * 0.32, w * 0.32]) {
    const win = box(1.2, 1, 0.12, MAT.dark);
    win.position.set(x, h * 0.55, d / 2 + 0.06);
    g.add(win);
  }
  const pole = box(0.15, 1.4, 0.15, MAT.metal);
  pole.position.set(w * 0.42, h + 0.7, d / 2);
  const sign = box(1.8, 0.9, 0.14, MAT.accent);
  sign.position.set(w * 0.42, h + 1.6, d / 2);
  g.add(pole, sign);
  return g;
}

function makeSheriff(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const body = box(w, h, d, MAT.house);
  body.position.y = h / 2;
  const rh = h * 0.4;
  const roof = pyramid(w + 0.4, d + 0.4, rh, MAT.roof);
  roof.position.y = h + rh / 2;
  const cupola = box(1.1, 1.1, 1.1, MAT.wall);
  cupola.position.y = h + rh + 0.55;
  const cap = pyramid(1.4, 1.4, 0.8, MAT.roof);
  cap.position.y = h + rh + 1.5;
  const door = box(1, 2, 0.12, MAT.dark);
  door.position.set(0, 1, d / 2 + 0.06);
  const sign = box(1.4, 0.5, 0.12, MAT.accent);
  sign.position.set(0, h - 0.4, d / 2 + 0.1);
  g.add(body, roof, cupola, cap, door, sign);
  return g;
}

function makeChurch(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const nave = box(w, h, d, MAT.wall);
  nave.position.y = h / 2;
  const roof = pyramid(w + 0.4, d + 0.4, h * 0.4, MAT.roof);
  roof.position.y = h + h * 0.2;
  g.add(nave, roof);
  const towerH = h + 5;
  const tower = box(1.8, towerH, 1.8, MAT.wall);
  tower.position.set(0, towerH / 2, -d / 2 + 1);
  const spire = pyramid(2, 2, 3.4, MAT.roof);
  spire.position.set(0, towerH + 1.7, -d / 2 + 1);
  const crossV = box(0.16, 1.2, 0.16, MAT.accent);
  crossV.position.set(0, towerH + 4, -d / 2 + 1);
  const crossH = box(0.7, 0.16, 0.16, MAT.accent);
  crossH.position.set(0, towerH + 4.2, -d / 2 + 1);
  g.add(tower, spire, crossV, crossH);
  return g;
}

function makeGas(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const canopy = box(w, 0.4, d, MAT.roof);
  canopy.position.y = h;
  g.add(canopy);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = box(0.3, h, 0.3, MAT.metal);
      post.position.set((sx * (w - 1)) / 2, h / 2, (sz * (d - 1)) / 2);
      g.add(post);
    }
  }
  for (const x of [-w * 0.2, w * 0.2]) {
    const pump = box(0.7, 1.3, 0.5, MAT.accent);
    pump.position.set(x, 0.65, 0);
    g.add(pump);
  }
  return g;
}

function makeWaterTower(w: number, h: number, d: number): THREE.Group {
  const g = new THREE.Group();
  const legH = h * 0.62;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = box(0.35, legH, 0.35, MAT.metal);
      leg.position.set((sx * w) / 3, legH / 2, (sz * d) / 3);
      g.add(leg);
    }
  }
  const tankR = w * 0.62;
  const tankH = h * 0.3;
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(tankR, tankR, tankH, 12), MAT.house);
  tank.position.y = legH + tankH / 2;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(tankR * 1.05, h * 0.14, 12), MAT.roof);
  cap.position.y = legH + tankH + h * 0.07;
  g.add(tank, cap);
  return g;
}

/** Construye el grupo de un POI por tipo (huella w×d, altura h, base en y=0). */
export function buildLandmark(kind: LandmarkKind, w: number, h: number, d: number): THREE.Group {
  switch (kind) {
    case 'house':
      return makeHouse(w, h, d);
    case 'diner':
      return makeDiner(w, h, d);
    case 'sheriff':
      return makeSheriff(w, h, d);
    case 'church':
      return makeChurch(w, h, d);
    case 'gas':
      return makeGas(w, h, d);
    case 'watertower':
      return makeWaterTower(w, h, d);
  }
}

/* ---- geometrías para instancing (bosque, farolas, rocas) ---- */

export function treeTrunkGeo(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6);
  g.translate(0, 0.7, 0);
  return g;
}

export function treeFoliageGeo(): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(1.15, 3.2, 7);
  g.translate(0, 3.0, 0);
  return g;
}

/** impostor barato: dos quads en aspa (cruz) que leen como masa arbórea a distancia */
export function impostorGeo(): THREE.BufferGeometry {
  const hw = 0.9;
  const ht = 0.28;
  const top = 4.2;
  const positions = new Float32Array([
    -hw,
    0,
    0,
    hw,
    0,
    0,
    ht,
    top,
    0,
    -ht,
    top,
    0, // A (plano XY)
    0,
    0,
    -hw,
    0,
    0,
    hw,
    0,
    top,
    ht,
    0,
    top,
    -ht, // B (plano ZY)
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  g.computeVertexNormals();
  return g;
}

export function lampPoleGeo(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.06, 0.09, 4.2, 6);
  g.translate(0, 2.1, 0);
  return g;
}

export function lampHeadGeo(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(0.55, 0.18, 0.3);
  g.translate(0, 4.25, 0);
  return g;
}

export function rockGeo(): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(0.6, 0);
}
