import * as THREE from 'three';
import { CreatureFSM, type Intent } from '../ai/CreatureFSM';
import { PerceptionSystem, type SenseInput, type SenseResult } from '../ai/PerceptionSystem';
import { WaypointGraph } from '../ai/WaypointGraph';
import { clamp, damp, shortestAngle } from '../utils/MathUtils';
import { Random } from '../utils/Random';
import type { CollisionSystem } from '../world/CollisionSystem';
import type { LoopRoad } from '../world/LoopRoad';

export interface CreatureUpdate {
  dt: number;
  playerX: number;
  playerZ: number;
  playerDirX: number;
  playerDirZ: number;
  flashlightOn: boolean;
  sprinting: boolean;
  walking: boolean;
  active: boolean;
  safe: boolean;
  nightFactor: number;
}

const SILHOUETTE = new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 1, metalness: 0 });

/**
 * Creature — "The Hollow" (AI.md §1): silueta humanoide ALARGADA y de proporciones incorrectas
 * (brazos que llegan casi a las rodillas, cabeza sin rostro), casi negra para leerse como recorte.
 * Movimiento "a saltos": poses que se fijan en ticks irregulares (sin interpolar) → inquietante.
 * Une percepción (`PerceptionSystem`) + comportamiento (`CreatureFSM`) + navegación (waypoints del
 * anillo + steering seek con esquiva por colisión). NUNCA corre (AI.md §2.7): camina con
 * deliberación y corta el paso; la persecución es breve y se pierde con silencio / refugio.
 */
export class Creature {
  readonly group = new THREE.Group();
  readonly pos = new THREE.Vector3();
  heading = 0;
  dirX = 0;
  dirZ = 1;
  awareness = 0;
  onConsume: (() => void) | null = null;

  private readonly fsm: CreatureFSM;
  private readonly perception: PerceptionSystem;
  private readonly graph: WaypointGraph;
  private readonly rand: Random;
  private readonly sense: SenseResult = {
    dist: 0,
    canSee: false,
    spotlighted: false,
    sightStim: 0,
    noiseStim: 0,
    spotStim: 0,
    stimulus: 0,
  };
  private readonly senseInput: SenseInput = {
    cx: 0,
    cz: 0,
    cdx: 0,
    cdz: 1,
    px: 0,
    pz: 0,
    pdx: 0,
    pdz: 1,
    flashlightOn: false,
    sprinting: false,
    walking: false,
  };
  private readonly pathBuf: number[] = [];
  private patrolIndex = 0;
  private patrolDir = 1;
  private poseTimer = 0;
  private consumedFired = false;
  private denX = 0;
  private denZ = 0;

  private torso: THREE.Group;
  private armL: THREE.Object3D;
  private armR: THREE.Object3D;
  private head: THREE.Object3D;

  constructor(
    curve: LoopRoad,
    collisions: CollisionSystem,
    spawnS: number,
    seed: number,
    private readonly radius = 0.5,
  ) {
    this.graph = new WaypointGraph(curve, curve.count);
    this.perception = new PerceptionSystem(collisions);
    this.fsm = new CreatureFSM();
    this.rand = new Random(seed);
    this.collisions = collisions;

    const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
    curve.at(spawnS, pose);
    this.pos.set(pose.x, 0, pose.z);
    this.patrolIndex = this.graph.nearest(this.pos.x, this.pos.z, 0);
    const denIdx = Math.floor(curve.count / 2);
    this.denX = curve.points[denIdx].x;
    this.denZ = curve.points[denIdx].z;

    this.group.position.copy(this.pos);
    const built = this.buildBody();
    this.torso = built.torso;
    this.armL = built.armL;
    this.armR = built.armR;
    this.head = built.head;
    this.group.add(built.root);
    this.group.visible = false;
  }

  private collisions: CollisionSystem;

  get state() {
    return this.fsm.state;
  }

  /** el Director (Fase 9) fuerza modo/objetivo. */
  setMode(state: Parameters<CreatureFSM['setMode']>[0], target?: { x: number; z: number }): void {
    this.fsm.setMode(state, target);
  }
  recall(): void {
    this.fsm.recall();
  }

  /** tras el Consume (elipsis): vuelve a letargo y se resetea el disparador. */
  reset(): void {
    this.consumedFired = false;
    this.awareness = 0;
    this.fsm.state = 'Dormant';
    this.fsm.intent = 'idle';
    this.fsm.lastKnown.valid = false;
    this.group.visible = false;
  }

  update(u: CreatureUpdate): void {
    const dt = u.dt;
    const active = u.active;
    this.group.visible = this.fsm.state !== 'Dormant';
    if (this.fsm.state === 'Dormant' && !active) {
      this.awareness = damp(this.awareness, 0, 1, dt);
      this.group.position.copy(this.pos);
      return;
    }

    this.senseInput.cx = this.pos.x;
    this.senseInput.cz = this.pos.z;
    this.senseInput.cdx = this.dirX;
    this.senseInput.cdz = this.dirZ;
    this.senseInput.px = u.playerX;
    this.senseInput.pz = u.playerZ;
    this.senseInput.pdx = u.playerDirX;
    this.senseInput.pdz = u.playerDirZ;
    this.senseInput.flashlightOn = u.flashlightOn;
    this.senseInput.sprinting = u.sprinting;
    this.senseInput.walking = u.walking;
    this.perception.sense(this.senseInput, this.sense);

    this.awareness =
      this.sense.stimulus > this.awareness
        ? damp(this.awareness, this.sense.stimulus, 0.35, dt)
        : damp(this.awareness, this.sense.stimulus, 3, dt);

    const caught = this.sense.dist < 1.7;
    const { intent } = this.fsm.update({
      dt,
      awareness: this.awareness,
      dist: this.sense.dist,
      canSee: this.sense.canSee,
      active,
      safe: u.safe,
      caught,
      px: u.playerX,
      pz: u.playerZ,
    });

    if (this.fsm.state === 'Consume' && !this.consumedFired) {
      this.consumedFired = true;
      this.onConsume?.();
    }

    const speed = this.speedFor(intent);
    this.behave(intent, u, speed, dt);
    this.collisions.resolve(this.pos, this.radius);
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    this.animatePose(dt, speed);
  }

  private speedFor(intent: Intent): number {
    switch (intent) {
      case 'patrol':
        return 1.5;
      case 'lastKnown':
        return 2.2;
      case 'stalkFollow':
        return 1.9;
      case 'seek':
        return 3.2;
      case 'retreat':
        return 2.6;
      default:
        return 0;
    }
  }

  private behave(intent: Intent, u: CreatureUpdate, speed: number, dt: number): void {
    if (intent === 'hold') {
      this.faceTo(u.playerX, u.playerZ, dt, 4);
      return;
    }
    if (intent === 'idle') return;

    let tx = this.pos.x;
    let tz = this.pos.z;
    let arrive = 0.6;

    if (intent === 'patrol') {
      tx = this.graph.nodeX(this.patrolIndex);
      tz = this.graph.nodeZ(this.patrolIndex);
      arrive = this.graph.step * 1.6;
      if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < arrive) {
        if (this.rand.chance(0.12)) this.patrolDir *= -1;
        this.patrolIndex = (this.patrolIndex + this.patrolDir + this.graph.count) % this.graph.count;
      }
    } else if (intent === 'retreat') {
      tx = this.denX;
      tz = this.denZ;
      arrive = 3;
      if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < arrive) {
        this.fsm.state = 'Dormant';
        this.group.visible = false;
      }
    } else if (intent === 'stalkFollow') {
      const d = this.sense.dist;
      if (d > 14) {
        tx = u.playerX;
        tz = u.playerZ;
      } else if (d < 9) {
        tx = this.pos.x - (u.playerX - this.pos.x);
        tz = this.pos.z - (u.playerZ - this.pos.z);
      } else {
        this.faceTo(u.playerX, u.playerZ, dt, 3);
        return;
      }
    } else {
      // seek / lastKnown: directo si está cerca; si no, sigue el arco del anillo hacia el objetivo
      const gx = intent === 'seek' ? u.playerX : this.fsm.lastKnown.x;
      const gz = intent === 'seek' ? u.playerZ : this.fsm.lastKnown.z;
      const d = Math.hypot(gx - this.pos.x, gz - this.pos.z);
      if (d < 24 || (intent === 'seek' && d < 40)) {
        tx = gx;
        tz = gz;
      } else {
        const from = this.graph.nearest(this.pos.x, this.pos.z, this.patrolIndex);
        const to = this.graph.nearest(gx, gz, from);
        const len = this.graph.path(from, to, this.pathBuf);
        const node = len > 0 ? (this.pathBuf[Math.min(len - 1, 2)] as number) : to;
        tx = this.graph.nodeX(node);
        tz = this.graph.nodeZ(node);
        this.patrolIndex = node;
        arrive = this.graph.step * 1.6;
      }
    }

    this.steerTo(tx, tz, speed, dt);
  }

  private steerTo(tx: number, tz: number, speed: number, dt: number): void {
    const dx = tx - this.pos.x;
    const dz = tz - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-3 || speed <= 0) return;
    const nx = dx / d;
    const nz = dz / d;
    this.pos.x += nx * speed * dt;
    this.pos.z += nz * speed * dt;
    this.faceTo(tx, tz, dt, 3.5);
  }

  private faceTo(x: number, z: number, dt: number, turn: number): void {
    const desired = Math.atan2(x - this.pos.x, z - this.pos.z);
    this.heading += shortestAngle(this.heading, desired) * clamp(turn * dt, 0, 1);
    this.dirX = Math.sin(this.heading);
    this.dirZ = Math.cos(this.heading);
  }

  /** pose "a saltos": en ticks de duración irregular fija poses nuevas sin interpolar (AI.md §1). */
  private animatePose(dt: number, speed: number): void {
    this.poseTimer -= dt;
    if (this.poseTimer > 0) return;
    this.poseTimer = this.rand.range(0.12, 0.55);
    const moving = speed > 0.05;
    this.torso.rotation.y = this.rand.range(-0.18, 0.18);
    this.torso.rotation.z = this.rand.range(-0.05, 0.05);
    this.head.rotation.y = this.rand.range(-0.3, 0.3);
    const swing = moving ? this.rand.range(-0.5, 0.5) : this.rand.range(-0.12, 0.12);
    this.armL.rotation.x = swing;
    this.armR.rotation.x = -swing + this.rand.range(-0.1, 0.1);
    this.group.position.y = moving ? this.rand.range(-0.03, 0.03) : 0;
  }

  private buildBody(): {
    root: THREE.Group;
    torso: THREE.Group;
    armL: THREE.Object3D;
    armR: THREE.Object3D;
    head: THREE.Object3D;
  } {
    const root = new THREE.Group();
    const torso = new THREE.Group();
    torso.position.y = 1.15;
    root.add(torso);

    const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 8), SILHOUETTE);
    trunk.position.y = 0.1;
    torso.add(trunk);

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), SILHOUETTE);
    this.head.position.y = 0.72;
    this.head.scale.set(0.9, 1.25, 0.9);
    torso.add(this.head);

    const armGeo = new THREE.CapsuleGeometry(0.05, 0.95, 3, 6);
    const armL = new THREE.Group();
    armL.position.set(-0.19, 0.55, 0);
    const armLMesh = new THREE.Mesh(armGeo, SILHOUETTE);
    armLMesh.position.y = -0.5;
    armL.add(armLMesh);
    const armR = new THREE.Group();
    armR.position.set(0.19, 0.55, 0);
    const armRMesh = new THREE.Mesh(armGeo, SILHOUETTE);
    armRMesh.position.y = -0.5;
    armR.add(armRMesh);
    torso.add(armL, armR);

    const legGeo = new THREE.CapsuleGeometry(0.06, 0.95, 3, 6);
    for (const sx of [-0.1, 0.1]) {
      const leg = new THREE.Mesh(legGeo, SILHOUETTE);
      leg.position.set(sx, 0.55, 0);
      root.add(leg);
    }

    root.scale.setScalar(1.15); // ~2.4 m: más alto que el jugador → impone
    return { root, torso, armL, armR, head: this.head };
  }
}
