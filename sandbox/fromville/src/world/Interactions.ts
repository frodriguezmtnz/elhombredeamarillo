import * as THREE from 'three';
import { Door } from '../interaction/Door';
import { Note } from '../interaction/Note';
import type { Refuge } from '../interaction/RefugeSystem';
import type { CurvePose } from './LoopRoad';
import type { World } from './World';
import { WORLD } from './layout';

/** Resultado de poblar el mundo con interacciones (Fase 6). */
export interface InteractionBundle {
  doors: Door[];
  refuges: Refuge[];
  notes: Note[];
  group: THREE.Group;
  update(dt: number): void;
}

const locked: Partial<Record<string, boolean>> = { sheriff: true };

/**
 * Deriva del `layout` determinista las interacciones jugables: una puerta por edificio (orientada
 * hacia la carretera), un refugio por puerta y un par de notas legibles. Sin lógica hard-codeada por
 * objeto: todo nace de los POIs, así es reproducible por seed y headless-testable.
 */
export function buildInteractions(world: World): InteractionBundle {
  const group = new THREE.Group();
  const curve = world.curve;
  const doors: Door[] = [];
  const refuges: Refuge[] = [];
  const notes: Note[] = [];
  const visuals: { door: Door; bar: THREE.Mesh }[] = [];

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.7, metalness: 0.2 });
  const pose: CurvePose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  for (const lm of world.layout.landmarks) {
    if (lm.kind === 'watertower') continue;

    const proj = curve.project(lm.x, lm.z, 0, curve.count);
    curve.at(proj.s, pose);
    let dx = pose.x - lm.x;
    let dz = pose.z - lm.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;

    const front = Math.min(lm.w, lm.d) / 2 + 0.35;
    const doorX = lm.x + dx * front;
    const doorZ = lm.z + dz * front;
    const yaw = Math.atan2(dx, dz);

    const door = new Door(`${lm.id}-door`, new THREE.Vector3(doorX, 0, doorZ), {
      locked: locked[lm.kind] ?? false,
    });
    doors.push(door);

    const hinge = new THREE.Group();
    hinge.position.set(doorX, 0, doorZ);
    hinge.rotation.y = yaw;
    const panelGeo = new THREE.BoxGeometry(1.1, 2.1, 0.12);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0.55, 1.05, 0);
    const pivot = new THREE.Group();
    pivot.position.set(-0.55, 0, 0);
    pivot.add(panel);
    hinge.add(pivot);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.16), barMat);
    bar.position.set(0.6, 1.1, 0.14);
    bar.rotation.z = 0.35;
    bar.visible = false;
    hinge.add(bar);

    group.add(hinge);
    door.panel = { rotation: pivot.rotation, restY: 0 };
    visuals.push({ door, bar });

    refuges.push({
      id: lm.id,
      x: doorX,
      z: doorZ,
      radius: 2.9,
      doors: [door],
    });
  }

  const spawn = world.layout.spawn;
  notes.push(
    new Note(
      'note-plaza',
      new THREE.Vector3(spawn.x + 1.4, 0, spawn.z - WORLD.roadHalfWidth - 0.5),
      'Aviso clavado',
      '«No importa lo que oigas por la noche: NADIE sale. Si ya estás dentro, quédate dentro.» — sin firma.',
    ),
    new Note(
      'note-foto',
      new THREE.Vector3(spawn.x - 1.6, 0, spawn.z + WORLD.roadHalfWidth + 0.5),
      'Fotografía desteñida',
      'Un grupo de gente sonríe frente a esta misma carretera. Nadie mira a cámara. En el reverso: «Día 1».',
    ),
  );
  const noteMat = new THREE.MeshStandardMaterial({ color: 0xd9d2bf, roughness: 1 });
  const noteGeo = new THREE.BoxGeometry(0.3, 0.4, 0.02);
  for (const n of notes) {
    const sheet = new THREE.Mesh(noteGeo, noteMat);
    sheet.position.set(n.position.x, 0.25, n.position.z);
    sheet.rotation.x = -0.5;
    group.add(sheet);
  }

  return {
    doors,
    refuges,
    notes,
    group,
    update(dt: number) {
      for (const v of visuals) {
        v.door.update(dt);
        v.bar.visible = v.door.sealed;
      }
    },
  };
}
