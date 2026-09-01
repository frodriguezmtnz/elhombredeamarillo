import * as THREE from 'three';
import { damp, shortestAngle } from '../utils/MathUtils';
import { buildNPC } from './NPC';
import type { NPCVisual } from './NPC';

export interface NPCSpawn {
  key: string;
  name: string;
  coatColor: string;
  hat: boolean;
  /** posición base */
  position: THREE.Vector3;
  /** posición alternativa a partir de N vueltas */
  altPosition?: { position: THREE.Vector3; loops: number };
  seed: number;
}

/** Habitante instanciado en el mundo: idle + mirar al jugador + relevo por vueltas. */
export class NPCInstance {
  readonly key: string;
  readonly name: string;
  readonly visual: NPCVisual;
  readonly interactablePosition = new THREE.Vector3();
  collider: { x: number; z: number; r: number } | null = null;
  hidden = false;

  private readonly spawn: NPCSpawn;
  private readonly group: THREE.Group;
  private bobPhase: number;
  private baseYaw: number;
  private swapped = false;

  constructor(spawn: NPCSpawn) {
    this.spawn = spawn;
    this.key = spawn.key;
    this.name = spawn.name;
    this.visual = buildNPC({
      name: spawn.name,
      key: spawn.key,
      coatColor: spawn.coatColor,
      hat: spawn.hat,
      seed: spawn.seed,
    });
    this.group = this.visual.group;
    this.group.position.copy(spawn.position);
    this.baseYaw = this.group.rotation.y;
    this.bobPhase = spawn.seed % 6.28;
    this.interactablePosition.set(spawn.position.x, 1.4, spawn.position.z);
  }

  applyLoops(loops: number): void {
    const alt = this.spawn.altPosition;
    if (!alt || this.swapped || loops < alt.loops) return;
    this.swapped = true;
    this.group.position.copy(alt.position);
    this.interactablePosition.set(alt.position.x, 1.4, alt.position.z);
    if (this.collider) {
      this.collider.x = alt.position.x;
      this.collider.z = alt.position.z;
    }
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    if (this.hidden) return;
    // idle: leve balanceo
    this.bobPhase += dt * 1.4;
    this.visual.head.position.y = 1.48 + Math.sin(this.bobPhase) * 0.012;

    // mirar al jugador si está cerca
    const dx = playerPos.x - this.group.position.x;
    const dz = playerPos.z - this.group.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 5.5) {
      const targetYaw = Math.atan2(dx, dz);
      const delta = shortestAngle(this.group.rotation.y, targetYaw);
      this.group.rotation.y += delta * Math.min(1, dt * 3.2);
    } else {
      const delta = shortestAngle(this.group.rotation.y, this.baseYaw);
      this.group.rotation.y = damp(this.group.rotation.y, this.group.rotation.y + delta, 0.4, dt);
    }
  }
}

export class NPCController {
  readonly npcs: NPCInstance[] = [];

  spawn(...spawns: NPCSpawn[]): void {
    for (const spawn of spawns) this.npcs.push(new NPCInstance(spawn));
  }

  applyLoops(loops: number): void {
    for (const npc of this.npcs) npc.applyLoops(loops);
  }

  /** desaparición total (loop 3): nadie en las calles */
  hideAll(): void {
    for (const npc of this.npcs) {
      npc.visual.group.visible = false;
      npc.hidden = true;
    }
  }

  /** interactuables activos (para desactivar el diálogo de los desaparecidos) */
  get instances(): NPCInstance[] {
    return this.npcs;
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    for (const npc of this.npcs) npc.update(dt, playerPos);
  }
}
