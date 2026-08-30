import * as THREE from 'three';
import type { AssetManager } from '../core/AssetManager';
import { Random, deriveSeed } from '../utils/Random';
import type { RoadCurve } from './RoadCurve';

/** Texto sobre canvas para señales (totalmente original). */
export function buildSignTexture(
  assets: AssetManager,
  key: string,
  lines: string[],
  bg: string,
  fg: string,
  border?: string,
): THREE.Texture {
  return assets.canvasTexture(key, 512, 256, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 256);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, 484, 228);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = lines.length > 1 ? 64 : 84;
    ctx.font = `bold ${size}px 'Segoe UI', Arial, sans-serif`;
    const totalHeight = lines.length * size * 1.15;
    lines.forEach((line, i) => {
      ctx.fillText(line, 256, 128 - totalHeight / 2 + size * 0.58 + i * size * 1.15, 460);
    });
    // desgaste
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(30,32,28,${Math.random() * 0.16})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2.2, 2.2);
    }
  });
}

function wreck(rand: Random): THREE.Group {
  const group = new THREE.Group();
  const charred = new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.95, metalness: 0.1 });
  const brokenGlass = new THREE.MeshStandardMaterial({ color: '#0b0f13', roughness: 0.3, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 4.1), charred);
  body.position.y = 0.5;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 2.0), brokenGlass);
  cabin.position.set(0, 0.95, -0.2);
  const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 8);
  wheelGeometry.rotateZ(Math.PI / 2);
  for (const [x, z] of [
    [-0.8, 1.35],
    [0.8, -1.4],
    [-0.8, -1.4],
  ]) {
    const wheel = new THREE.Mesh(wheelGeometry, charred);
    wheel.position.set(x, 0.32, z);
    group.add(wheel);
  }
  group.add(body, cabin);
  group.rotation.z = rand.range(-0.06, 0.06);
  return group;
}

function signPost(
  texture: THREE.Texture,
  width: number,
  height: number,
  poleHeight: number,
): { group: THREE.Group; boardMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, poleHeight, 6),
    new THREE.MeshStandardMaterial({ color: '#565b60', roughness: 0.6, metalness: 0.5 }),
  );
  pole.position.y = poleHeight / 2;
  const boardMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), boardMaterial);
  board.position.y = poleHeight - height / 2 - 0.15;
  board.castShadow = true;
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: '#4a4f54', roughness: 0.8 }),
  );
  back.position.y = board.position.y;
  back.rotation.y = Math.PI;
  group.add(pole, board, back);
  return { group, boardMaterial };
}

export interface LandmarksResult {
  group: THREE.Group;
  /** coordenadas de arco de cada landmark (para eventos de reconocimiento) */
  positions: { wreckNear: number; wreckFar: number; townSign: number; slowSign: number };
  /** material del cartel del pueblo (anomalía: cambiar el mapa) */
  townSignBoardMaterial: THREE.MeshStandardMaterial;
}

/* ------------------------------------------------------------------ */
/* barricada de obras (bloquea la vuelta antes del árbol)              */
/* ------------------------------------------------------------------ */

export interface BarrierResult {
  group: THREE.Group;
  /** colliders de la barricada en coordenadas de mundo */
  colliders: { x: number; z: number; r: number }[];
  /** refs registradas en CollisionSystem (para eliminarlas al desaparecer) */
  colliderRefs?: { x: number; z: number; r: number }[];
}

export function buildBarrier(curve: RoadCurve, barrierS: number): BarrierResult {
  const group = new THREE.Group();
  const pose = curve.at(barrierS, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
  group.position.set(pose.x, 0, pose.z);
  group.rotation.y = Math.atan2(pose.tx, pose.tz);

  const postMaterial = new THREE.MeshStandardMaterial({ color: '#3a3f44', roughness: 0.7, metalness: 0.4 });

  // listón con franjas rojas/blancas alternadas (segmentos, sin textura)
  const plank = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const segment = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.3, 0.1),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#c9c4b8' : '#a03a2c', roughness: 0.7 }),
    );
    segment.position.x = -3.1 + i * 0.885;
    plank.add(segment);
  }
  plank.position.y = 1.0;
  const plankLow = plank.clone();
  plankLow.position.y = 0.55;
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.25, 6), postMaterial);
  postL.position.set(-3.4, 0.62, 0);
  const postR = postL.clone();
  postR.position.x = 3.4;
  group.add(plank, plankLow, postL, postR);

  const colliders: { x: number; z: number; r: number }[] = [];
  const sin = Math.sin(group.rotation.y);
  const cos = Math.cos(group.rotation.y);
  for (const offset of [-2.3, 0, 2.3]) {
    const wx = pose.x + cos * offset;
    const wz = pose.z - sin * offset;
    colliders.push({ x: wx, z: wz, r: 1.15 });
  }

  return { group, colliders };
}

/* ------------------------------------------------------------------ */
/* túnel bajo la montaña                                               */
/* ------------------------------------------------------------------ */

export interface TunnelResult {
  group: THREE.Group;
  /** rango de coordenada de arco [start, end] para detectar "dentro" */
  range: [number, number];
  /** colliders de los muros (registrar en CollisionSystem) */
  colliders: { x: number; z: number; r: number }[];
}

export function buildTunnel(curve: RoadCurve, tunnelS: number, length = 120): TunnelResult {
  const group = new THREE.Group();
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#232a24', roughness: 1, flatShading: true });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#2e3134', roughness: 0.95 });
  const stripeMaterials = [
    new THREE.MeshStandardMaterial({ color: '#c9c4b8', roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: '#a03a2c', roughness: 0.7 }),
  ];
  const colliders: { x: number; z: number; r: number }[] = [];
  const step = 10;
  const count = Math.ceil(length / step);

  for (let i = 0; i <= count; i++) {
    const s = tunnelS + i * step;
    curve.at(s, pose);
    const yaw = Math.atan2(pose.tx, pose.tz);
    const at = (lateral: number, y: number): THREE.Vector3 =>
      new THREE.Vector3(pose.x + pose.nx * lateral, y, pose.z + pose.nz * lateral);

    // muros laterales
    for (const side of [1, -1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.6, step + 0.4), wallMaterial);
      wall.position.copy(at(side * 4.1, 2.3));
      wall.rotation.y = yaw;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }
    // techo
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, step + 0.4), wallMaterial);
    ceiling.position.copy(at(0, 4.75));
    ceiling.rotation.y = yaw;
    group.add(ceiling);

    // portal con franjas en ambas entradas
    if (i === 0 || i === count) {
      for (let k = 0; k < 8; k++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.18), stripeMaterials[k % 2]);
        const angle = (k / 8) * Math.PI - Math.PI / 2;
        stripe.position.copy(at(Math.sin(angle * 2) * 0, 4.9));
        stripe.position.add(new THREE.Vector3(pose.nx * (k - 3.5) * 1.05, 0, pose.nz * (k - 3.5) * 1.05));
        stripe.rotation.y = yaw;
        group.add(stripe);
      }
    }

    // roca sobre el túnel (la montaña)
    if (i % 2 === 0) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rand_range(11, 16), 0), rockMaterial);
      rock.position.copy(at(rand_range(-3, 3), rand_range(7, 10)));
      rock.rotation.set(rand_range(0, 3), rand_range(0, 3), rand_range(0, 3));
      rock.castShadow = true;
      group.add(rock);
      const rockSide = new THREE.Mesh(new THREE.IcosahedronGeometry(rand_range(7, 10), 0), rockMaterial);
      rockSide.position.copy(at(9, rand_range(1, 3)));
      rockSide.rotation.set(rand_range(0, 3), rand_range(0, 3), rand_range(0, 3));
      group.add(rockSide);
      const rockSide2 = new THREE.Mesh(new THREE.IcosahedronGeometry(rand_range(7, 10), 0), rockMaterial);
      rockSide2.position.copy(at(-9, rand_range(1, 3)));
      rockSide2.rotation.set(rand_range(0, 3), rand_range(0, 3), rand_range(0, 3));
      group.add(rockSide2);
    }

    // colliders de muros
    for (const side of [1, -1]) {
      colliders.push({
        x: pose.x + pose.nx * side * 4.1,
        z: pose.z + pose.nz * side * 4.1,
        r: 1.2,
      });
    }
  }

  return { group, range: [tunnelS, tunnelS + length], colliders };
}

function rand_range(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/* ------------------------------------------------------------------ */
/* lago iluminado por la luna                                          */
/* ------------------------------------------------------------------ */

export function buildLake(curve: RoadCurve, lakeS: number, lateral: number): THREE.Group {
  const group = new THREE.Group();
  const pose = curve.at(lakeS, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
  group.position.set(pose.x + pose.nx * lateral, 0, pose.z + pose.nz * lateral);
  group.rotation.y = Math.atan2(pose.tx, pose.tz);

  const shore = new THREE.Mesh(
    new THREE.CircleGeometry(1, 28),
    new THREE.MeshStandardMaterial({ color: '#0d120d', roughness: 1 }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.scale.set(58, 36, 1);
  shore.position.y = 0.012;

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 28),
    new THREE.MeshStandardMaterial({
      color: '#0d1a26',
      roughness: 0.1,
      metalness: 0.85,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.set(50, 30, 1);
  water.position.y = 0.02;

  // franja de la luna sobre el agua (siempre visible, también a través de la niebla)
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 26),
    new THREE.MeshBasicMaterial({
      color: '#d5e4f5',
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  streak.rotation.x = -Math.PI / 2;
  streak.rotation.z = Math.atan2(-620, -400); // azimut de la luna
  streak.position.y = 0.03;
  // orientar la franja a lo largo del reflejo
  streak.rotation.y = 0;

  group.add(shore, water, streak);
  return group;
}

/* ------------------------------------------------------------------ */
/* faro lejano (nunca alcanzable)                                      */
/* ------------------------------------------------------------------ */

export interface LighthouseResult {
  group: THREE.Group;
  /** grupo de haces giratorios */
  beam: THREE.Group;
}

export function buildLighthouse(position: THREE.Vector3): LighthouseResult {
  const group = new THREE.Group();
  group.position.copy(position);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.4, 22, 10),
    new THREE.MeshStandardMaterial({ color: '#7d8791', roughness: 0.85 }),
  );
  tower.position.y = 11;
  group.add(tower);
  for (const y of [6.5, 14.5]) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(2.75, 3.05, 2.2, 10),
      new THREE.MeshStandardMaterial({ color: '#7c2f26', roughness: 0.85 }),
    );
    band.position.y = y;
    group.add(band);
  }
  const lampGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 1.9, 10),
    new THREE.MeshStandardMaterial({
      color: '#2a2416',
      emissive: '#ffe9b0',
      emissiveIntensity: 3.2,
      fog: false,
    }),
  );
  lampGlass.position.y = 22.8;
  group.add(lampGlass);
  // halo visible a cientos de metros
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: '#ffedb8',
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      fog: false,
      depthWrite: false,
    }),
  );
  glow.scale.set(14, 14, 1);
  glow.position.y = 22.8;
  group.add(glow);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, 1.4, 10),
    new THREE.MeshStandardMaterial({ color: '#3a3f44', roughness: 0.9 }),
  );
  roof.position.y = 24.4;
  group.add(roof);

  // dos haces opuestos, aditivos y sin niebla (ven a través de ella)
  const beam = new THREE.Group();
  beam.position.y = 22.8;
  const beamGeometry = new THREE.CylinderGeometry(0.6, 8.5, 150, 12, 1, true);
  beamGeometry.rotateX(Math.PI / 2);
  beamGeometry.translate(0, 0, 75);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: '#fff3c8',
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
  });
  const beamA = new THREE.Mesh(beamGeometry, beamMaterial);
  const beamB = new THREE.Mesh(beamGeometry, beamMaterial);
  beamB.rotation.y = Math.PI;
  beam.add(beamA, beamB);
  group.add(beam);

  return { group, beam };
}

/** Coches abandonados, señales y postes telefónicos a lo largo del anillo. */
export function buildLandmarks(curve: RoadCurve, assets: AssetManager, seed: number): LandmarksResult {
  const rand = new Random(deriveSeed(seed, 'landmarks'));
  const group = new THREE.Group();
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  const positions = { wreckNear: 0, wreckFar: 0, townSign: 0, slowSign: 0 };
  let townSignBoardMaterial = new THREE.MeshStandardMaterial();

  const place = (object: THREE.Object3D, s: number, lateral: number, extraYaw: number): void => {
    curve.at(s, pose);
    object.position.set(pose.x + pose.nx * lateral, 0, pose.z + pose.nz * lateral);
    object.rotation.y = Math.atan2(pose.tx, pose.tz) + extraYaw;
    group.add(object);
  };

  // 1. coche quemado en el tramo de vuelta
  positions.wreckNear = 520;
  const wreck1 = wreck(rand);
  wreck1.rotation.y += rand.range(-0.4, 0.4);
  place(wreck1, positions.wreckNear, -5.6, 0);

  // 2. pickup abandonado entre el inicio y el pueblo
  positions.wreckFar = 380;
  const wreck2 = wreck(rand);
  wreck2.rotation.y += Math.PI * 0.86;
  place(wreck2, positions.wreckFar, 5.8, 0);

  // 3. señal grande del pueblo
  positions.townSign = 205;
  const townTexture = buildSignTexture(
    assets,
    'sign-town',
    ['MARROW FALLS', 'POP. 114'],
    '#184a2b',
    '#dfe6dc',
    '#dfe6dc',
  );
  const townSign = signPost(townTexture, 3.4, 1.7, 2.6);
  townSignBoardMaterial = townSign.boardMaterial;
  place(townSign.group, positions.townSign, -4.9, 0.35);

  // 4. señal amarilla
  positions.slowSign = 450;
  const slowTexture = buildSignTexture(assets, 'sign-slow', ['REDUCE', 'SPEED'], '#c9a227', '#151515');
  place(signPost(slowTexture, 1.7, 1.7, 2.3).group, positions.slowSign, 4.9, -0.2);

  // 5. farola caída
  curve.at(1150, pose);
  const deadLamp = new THREE.Group();
  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 5.2, 6),
    new THREE.MeshStandardMaterial({ color: '#3c4044', roughness: 0.7, metalness: 0.5 }),
  );
  lampPole.position.y = 2.6;
  lampPole.rotation.z = 1.25;
  deadLamp.add(lampPole);
  place(deadLamp, 1150, -6.2, 0.7);

  // 6. postes telefónicos instanciados (todo el anillo)
  const poleSpacing = 52;
  const poleCount = Math.floor(curve.length / poleSpacing);
  const poleGeometry = new THREE.CylinderGeometry(0.09, 0.13, 7.5, 5);
  const crossarmGeometry = new THREE.BoxGeometry(1.7, 0.09, 0.09);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#2b2118', roughness: 1 });
  const crossMaterial = new THREE.MeshStandardMaterial({ color: '#241b13', roughness: 1 });
  const poles = new THREE.InstancedMesh(poleGeometry, poleMaterial, poleCount);
  const crossarms = new THREE.InstancedMesh(crossarmGeometry, crossMaterial, poleCount);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  for (let i = 0; i < poleCount; i++) {
    const s = i * poleSpacing + 20;
    curve.lateralAt(s, 6.9, pose);
    const yaw = Math.atan2(pose.tx, pose.tz);
    pos.set(pose.x, 3.75, pose.z);
    quat.setFromAxisAngle(up, yaw);
    matrix.compose(pos, quat, one);
    poles.setMatrixAt(i, matrix);
    pos.y = 6.7;
    matrix.compose(pos, quat, one);
    crossarms.setMatrixAt(i, matrix);
  }
  group.add(poles, crossarms);

  return { group, positions, townSignBoardMaterial };
}
