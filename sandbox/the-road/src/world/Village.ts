import * as THREE from 'three';
import type { AssetManager } from '../core/AssetManager';
import { Random, deriveSeed } from '../utils/Random';
import type { CollisionSystem } from './CollisionSystem';
import type { RoadCurve } from './RoadCurve';

/**
 * Village — Marrow Falls.
 * 8-12 edificios sobre el arco del anillo (villageS = 0), plaza con tablón,
 * gasolinera, motel, torre de agua visible desde la carretera.
 * applyLoopState() aplica las pequeñas diferencias de cada vuelta.
 */

interface BuildingSpec {
  s: number;
  lateral: number;
  width: number;
  depth: number;
  height: number;
  roof: number;
  litWindows: number; // 0..1 proporción de ventanas encendidas
  kind: 'house' | 'diner' | 'motel' | 'gas' | 'hall';
}

const SPECS: BuildingSpec[] = [
  { s: 108, lateral: 13, width: 9, depth: 7, height: 3.4, roof: 1.6, litWindows: 0.3, kind: 'gas' },
  { s: 62, lateral: 11.5, width: 10, depth: 6.5, height: 3.2, roof: 0.4, litWindows: 0.75, kind: 'diner' },
  { s: 18, lateral: -12.5, width: 12, depth: 8, height: 5.6, roof: 1.2, litWindows: 0.25, kind: 'motel' },
  { s: -12, lateral: 11, width: 6.5, depth: 6, height: 3, roof: 1.7, litWindows: 0.5, kind: 'house' },
  { s: -34, lateral: -11.5, width: 7, depth: 6.5, height: 3.1, roof: 1.6, litWindows: 0, kind: 'house' },
  { s: -56, lateral: 12, width: 6.8, depth: 6.2, height: 2.9, roof: 1.8, litWindows: 0.35, kind: 'house' },
  { s: -80, lateral: -12, width: 7.2, depth: 6, height: 3.2, roof: 1.5, litWindows: 0, kind: 'house' },
  { s: -104, lateral: 13, width: 11, depth: 8, height: 4.2, roof: 1.4, litWindows: 0.2, kind: 'hall' },
  { s: 84, lateral: -11, width: 6.4, depth: 5.8, height: 3, roof: 1.6, litWindows: 0, kind: 'house' },
  { s: 40, lateral: -10.5, width: 6.6, depth: 6, height: 3, roof: 1.7, litWindows: 0.4, kind: 'house' },
];

const WALL_VARY = ['#524a42', '#44403c', '#57493c', '#3f3b38'];

export interface VillageResult {
  group: THREE.Group;
  /** posición del tablón de anuncios (aparece la fotografía, Fase 9) */
  noticeBoardPos: THREE.Vector3;
  /** posiciones para NPCs */
  npcSpots: {
    diner: THREE.Vector3;
    gas: THREE.Vector3;
    bench: THREE.Vector3;
    motel: THREE.Vector3;
    road: THREE.Vector3;
  };
  /** enciende/apaga todas las luces del pueblo (llegan con la noche) */
  setLights(on: boolean): void;
  /** aplicar cambios por vuelta (puerta abierta, ventana encendida, letrero) */
  applyLoopState(loops: number): void;
  update(dt: number): void;
}

function makeHouse(spec: BuildingSpec, rand: Random): { group: THREE.Group; windows: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const wallColor = WALL_VARY[rand.int(0, WALL_VARY.length - 1)];
  const wall = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.92 });
  const roof = new THREE.MeshStandardMaterial({ color: '#26221e', roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(spec.width, spec.height, spec.depth), wall);
  body.position.y = spec.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  if (spec.roof > 0.5) {
    // tejado a dos aguas (prisma)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-spec.width / 2 - 0.35, 0);
    roofShape.lineTo(0, spec.roof);
    roofShape.lineTo(spec.width / 2 + 0.35, 0);
    roofShape.lineTo(-spec.width / 2 - 0.35, 0);
    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, { depth: spec.depth + 0.5, bevelEnabled: false });
    roofGeometry.translate(0, spec.height, -(spec.depth + 0.5) / 2);
    const roofMesh = new THREE.Mesh(roofGeometry, roof);
    roofMesh.castShadow = true;
    group.add(roofMesh);
  } else {
    // tejado plano con pretil (gasolinera/diner)
    const trim = new THREE.Mesh(new THREE.BoxGeometry(spec.width + 0.3, 0.3, spec.depth + 0.3), roof);
    trim.position.y = spec.height + 0.1;
    group.add(trim);
  }

  // ventanas: planos emisivos en la cara que mira a la carretera (-X local, girado luego)
  const windows: THREE.MeshStandardMaterial[] = [];
  const cols = Math.max(1, Math.floor(spec.width / 2.2));
  const rows = Math.max(1, Math.floor(spec.height / 2.1));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lit = rand.next() < spec.litWindows;
      const material = new THREE.MeshStandardMaterial({
        color: lit ? '#ffc98a' : '#0b0e12',
        emissive: lit ? '#ffb46a' : '#000000',
        emissiveIntensity: lit ? 1.1 : 0,
        roughness: 0.4,
      });
      const window = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.95), material);
      const x = (col - (cols - 1) / 2) * 2.2;
      const y = 1.35 + row * 2.1;
      window.position.set(x, y, spec.depth / 2 + 0.02);
      group.add(window);
      const windowBack = window.clone();
      windowBack.position.z = -spec.depth / 2 - 0.02;
      windowBack.rotation.y = Math.PI;
      group.add(windowBack);
      windows.push(material);
    }
  }

  // puerta
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 2.05),
    new THREE.MeshStandardMaterial({ color: '#17130f', roughness: 0.85 }),
  );
  door.position.set(spec.width / 2 + 0.02, 1.03, 0);
  door.rotation.y = Math.PI / 2;
  group.add(door);

  return { group, windows };
}

export function buildVillage(
  curve: RoadCurve,
  collisions: CollisionSystem,
  assets: AssetManager,
  seed: number,
): VillageResult {
  const rand = new Random(deriveSeed(seed, 'village'));
  const group = new THREE.Group();
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  let motelUpperWindow: THREE.MeshStandardMaterial | null = null;
  let dinerSignMaterial: THREE.MeshStandardMaterial | null = null;
  let dinnerMat: THREE.MeshStandardMaterial | null = null;
  const flickerMaterials: THREE.MeshStandardMaterial[] = [];
  const lightMaterials: { mat: THREE.MeshStandardMaterial; base: number }[] = [];
  const registerLight = (mat: THREE.MeshStandardMaterial, base: number): void => {
    lightMaterials.push({ mat, base });
  };

  const litLamp = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffca7a', emissiveIntensity: 1.5 });
  registerLight(litLamp, 1.5);

  const place = (object: THREE.Object3D, s: number, lateral: number, faceRoad = true): THREE.Vector3 => {
    curve.at(s, pose);
    object.position.set(pose.x + pose.nx * lateral, 0, pose.z + pose.nz * lateral);
    const roadYaw = Math.atan2(pose.tx, pose.tz);
    const side = lateral >= 0 ? 1 : -1;
    object.rotation.y = faceRoad ? roadYaw + (side > 0 ? -Math.PI / 2 : Math.PI / 2) : roadYaw;
    group.add(object);
    return object.position.clone();
  };

  // ---- edificios ----
  for (const spec of SPECS) {
    if (spec.kind === 'gas') {
      // kiosco + marquesina + surtidores
      const station = new THREE.Group();
      const kiosk = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 5),
        new THREE.MeshStandardMaterial({ color: '#4d4843', roughness: 0.9 }),
      );
      kiosk.position.y = 1.5;
      kiosk.castShadow = true;
      station.add(kiosk);
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.35, 6.5),
        new THREE.MeshStandardMaterial({ color: '#3a352f', roughness: 0.85 }),
      );
      canopy.position.set(0, 4.2, 5.6);
      station.add(canopy);
      for (const px of [-3, 3]) {
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.16, 4.2, 6),
          new THREE.MeshStandardMaterial({ color: '#3a352f', roughness: 0.8 }),
        );
        column.position.set(px, 2.1, 5.6);
        station.add(column);
        const pump = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 1.5, 0.5),
          new THREE.MeshStandardMaterial({ color: '#7c2f26', roughness: 0.7 }),
        );
        pump.position.set(px + 1.1, 0.75, 5.6);
        pump.castShadow = true;
        station.add(pump);
      }
      const priceSign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1),
        new THREE.MeshStandardMaterial({ color: '#d8ddda', emissive: '#93a08e', emissiveIntensity: 0.5 }),
      );
      priceSign.position.set(-4.2, 3.4, 3.4);
      station.add(priceSign);
      const pos = place(station, spec.s, spec.lateral);
      collisions.addBox(pos.x, pos.z, 3.4, 5.4);
      continue;
    }

    const house = makeHouse(spec, rand);
    const pos = place(house.group, spec.s, spec.lateral);
    collisions.addBox(
      pos.x,
      pos.z,
      Math.max(spec.width, spec.depth) / 2 + 0.4,
      Math.max(spec.width, spec.depth) / 2 + 0.4,
    );
    flickerMaterials.push(...house.windows);
    for (const mat of house.windows) {
      if (mat.emissiveIntensity > 0) registerLight(mat, 1.1);
    }
    if (spec.kind === 'motel' && house.windows.length > 0) {
      motelUpperWindow = house.windows[house.windows.length - 1];
    }
    if (spec.kind === 'diner') {
      // letrero vertical del diner
      const signTextureMaterial = new THREE.MeshStandardMaterial({
        color: '#ff9a55',
        emissive: '#ff8b45',
        emissiveIntensity: 1.3,
      });
      const dinerSign = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 1.1), signTextureMaterial);
      dinerSign.position.set(0, 4.6, spec.depth / 2 + 0.9);
      house.group.add(dinerSign);
      dinerSignMaterial = signTextureMaterial;
      registerLight(signTextureMaterial, 1.3);
      // porche con luz
      const porchLight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), litLamp);
      porchLight.position.set(2.4, 2.9, spec.depth / 2 + 0.9);
      house.group.add(porchLight);
    }
    if (spec.kind === 'hall') {
      // ventana circular (emblema original del edificio comunitario)
      const rose = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.09, 8, 20),
        new THREE.MeshStandardMaterial({ color: '#8d949c', roughness: 0.4, metalness: 0.6 }),
      );
      rose.position.set(0, 3.2, spec.depth / 2 + 0.06);
      house.group.add(rose);
    }
  }

  // ---- edificio con neón rojo "DINNER" (original, con parpadeo propio) ----
  const dinnerSignTexture = assets.canvasTexture('dinner-neon', 512, 128, (ctx) => {
    ctx.fillStyle = '#0c0507';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 84px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff6f5e';
    const word = 'DINNER';
    const step = 76;
    const startX = 256 - ((word.length - 1) * step) / 2;
    for (let i = 0; i < word.length; i++) ctx.fillText(word[i], startX + i * step, 66);
  });
  const dinnerBuilding = new THREE.Group();
  const dinnerBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3.4, 7),
    new THREE.MeshStandardMaterial({ color: '#2b2320', roughness: 0.95 }),
  );
  dinnerBody.position.y = 1.7;
  dinnerBody.castShadow = true;
  const dinnerNeonMat = new THREE.MeshStandardMaterial({
    color: '#14090b',
    emissive: '#ffffff',
    emissiveMap: dinnerSignTexture,
    emissiveIntensity: 2.2,
  });
  dinnerMat = dinnerNeonMat;
  const dinnerSign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), dinnerNeonMat);
  dinnerSign.position.set(0, 2.75, 3.56);
  // halo aditivo: el neón se lee desde lejos
  const dinnerHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.9),
    new THREE.MeshBasicMaterial({
      map: dinnerSignTexture,
      color: '#ff4030',
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  dinnerHalo.position.set(0, 2.75, 3.54);
  dinnerHalo.name = 'dinner-halo';
  // luz roja real que tiñe el arcén frente al edificio
  const dinnerLight = new THREE.PointLight('#ff3326', 26, 22, 2);
  dinnerLight.position.set(0, 2.6, 4.6);
  const dinnerDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 2.05),
    new THREE.MeshStandardMaterial({ color: '#17130f', roughness: 0.85 }),
  );
  dinnerDoor.position.set(-2.6, 1.03, 3.52);
  dinnerBuilding.add(dinnerBody, dinnerSign, dinnerHalo, dinnerLight, dinnerDoor);
  registerLight(dinnerNeonMat, 2.2);
  const dinnerPos = place(dinnerBuilding, -68, -11.5);
  collisions.addBox(dinnerPos.x, dinnerPos.z, 4.4, 3.9);

  // ---- torre de agua (landmark lejano) ----
  const tower = new THREE.Group();
  const tankMaterial = new THREE.MeshStandardMaterial({ color: '#39414a', roughness: 0.8, metalness: 0.25 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.4, 4.2, 10), tankMaterial);
  tank.position.y = 22;
  tank.castShadow = true;
  tower.add(tank);
  const tankRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: '#23282e', roughness: 0.9 }),
  );
  tankRoof.position.y = 24.9;
  tower.add(tankRoof);
  for (const [lx, lz] of [
    [-2.1, -2.1],
    [2.1, -2.1],
    [-2.1, 2.1],
    [2.1, 2.1],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.2, 20, 6),
      new THREE.MeshStandardMaterial({ color: '#2c3238', roughness: 0.85 }),
    );
    leg.position.set(lx, 10, lz);
    leg.castShadow = true;
    tower.add(leg);
  }
  const towerPos = place(tower, -4, 58, false);
  collisions.addBox(towerPos.x, towerPos.z, 2.6, 2.6);

  // ---- farolas del arcén del pueblo ----
  const lampSpacings = [-120, -96, -72, -48, -24, 0, 24, 48, 72, 96, 120];
  for (const offset of lampSpacings) {
    const lampGroup = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 4.6, 6),
      new THREE.MeshStandardMaterial({ color: '#33383c', roughness: 0.7, metalness: 0.5 }),
    );
    pole.position.y = 2.3;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.24), litLamp);
    head.position.set(0, 4.55, 0.18);
    lampGroup.add(pole, head);
    const lampSide = offset % 48 === 0 ? 6.4 : -6.4;
    const lampPos = place(lampGroup, offset, lampSide);
    collisions.add(lampPos.x, lampPos.z, 0.22);
    if (Math.abs(offset) > 40) flickerMaterials.push(head.material as THREE.MeshStandardMaterial);
  }

  // ---- plaza: tablón + banco ----
  const noticeBoardGroup = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.2, 0.09),
    new THREE.MeshStandardMaterial({ color: '#3d3126', roughness: 0.9 }),
  );
  board.position.y = 1.5;
  const boardRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.07, 0.4),
    new THREE.MeshStandardMaterial({ color: '#241d16', roughness: 0.9 }),
  );
  boardRoof.position.y = 2.2;
  noticeBoardGroup.add(board, boardRoof);
  const noticeBoardPos = place(noticeBoardGroup, 34, 7.6);
  collisions.add(noticeBoardPos.x, noticeBoardPos.z, 0.5);

  const bench = new THREE.Group();
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.09, 0.5),
    new THREE.MeshStandardMaterial({ color: '#3a2e22', roughness: 0.95 }),
  );
  seat.position.y = 0.48;
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.5, 0.08),
    new THREE.MeshStandardMaterial({ color: '#3a2e22', roughness: 0.95 }),
  );
  back.position.set(0, 0.78, -0.24);
  bench.add(seat, back);
  const benchPos = place(bench, 30, 7.2);
  collisions.add(benchPos.x, benchPos.z, 0.6);

  // ---- puntos para NPCs ----
  const spotAt = (s: number, lateral: number): THREE.Vector3 => {
    curve.at(s, pose);
    return new THREE.Vector3(pose.x + pose.nx * lateral, 0, pose.z + pose.nz * lateral);
  };

  // variables internas de animación (antes del return: los closures las capturan)
  let flickerTime = 0;
  let flickerLoop = false;
  let lightsOn = false;

  return {
    group,
    noticeBoardPos,
    npcSpots: {
      diner: spotAt(62, 7.6),
      gas: spotAt(106, 6.8),
      bench: new THREE.Vector3(benchPos.x, 0, benchPos.z),
      motel: spotAt(18, -7.8),
      road: spotAt(134, -4.8),
    },
    setLights(on: boolean): void {
      lightsOn = on;
      for (const entry of lightMaterials) {
        entry.mat.emissiveIntensity = on ? entry.base : 0.02;
      }
    },
    applyLoopState(loops: number): void {
      // vuelta 1: ventana superior del motel se enciende
      if (loops >= 1 && motelUpperWindow) {
        motelUpperWindow.color.set('#ffc98a');
        motelUpperWindow.emissive.set('#ffb46a');
        motelUpperWindow.emissiveIntensity = 1.1;
        if (lightsOn) motelUpperWindow.emissiveIntensity = 1.1;
      }
      // vuelta 2: el letrero del diner parpadea (update lo anima)
      if (loops >= 2 && dinerSignMaterial) {
        flickerLoop = true;
      }
    },
    update(dt: number): void {
      flickerTime += dt;
      if (lightsOn && dinnerMat) {
        // el neón DINNER respira: parpadeos raros, nunca apagones largos
        const dip = Math.sin(flickerTime * 7.3) > 0.965 || Math.sin(flickerTime * 23.7) > 0.988 ? 0.2 : 1;
        dinnerMat.emissiveIntensity = 2.2 * dip;
        const halo = dinnerBuilding.children.find((child) => child.name === 'dinner-halo');
        if (halo) (halo as THREE.Mesh).visible = dip > 0.5;
      }
      if (flickerLoop && dinerSignMaterial) {
        const flicker = Math.sin(flickerTime * 13) > 0.6 || Math.sin(flickerTime * 31) > 0.85 ? 0.15 : 1.3;
        dinerSignMaterial.emissiveIntensity = flicker;
      }
    },
  };
}
