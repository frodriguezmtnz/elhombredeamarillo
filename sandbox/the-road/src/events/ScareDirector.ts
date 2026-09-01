import * as THREE from 'three';
import { Random, deriveSeed } from '../utils/Random';

/**
 * ScareDirector — latido de terror: garantiza un evento cada 18-35s
 * estés donde estés, eligiendo del pool adecuado al contexto.
 * Los efectos visuales/audio los ejecuta el Game vía callbacks.
 */

export interface ScareContext {
  driving: boolean;
  inVillage: boolean;
  inTunnel: boolean;
  inEscape: boolean;
  speed: number;
  playerPos: THREE.Vector3;
  forward: THREE.Vector3;
  night: boolean;
}

export interface ScareCallbacks {
  crows(at: THREE.Vector3): void;
  eyes(at: THREE.Vector3): void;
  whisper(): void;
  stall(): void;
  thunder(): void;
  doorSlam(at: THREE.Vector3): void;
  phone(at: THREE.Vector3): void;
  spider(): void;
  crossingFigure(): void;
  falseCrash(): void;
}

type Kind =
  | 'crows'
  | 'eyes'
  | 'whisper'
  | 'stall'
  | 'thunder'
  | 'doorSlam'
  | 'phone'
  | 'spider'
  | 'crossingFigure'
  | 'falseCrash';

export class ScareDirector {
  private readonly callbacks: ScareCallbacks;
  private readonly rand: Random;
  private beatTimer = 14;
  private thunderTimer = 22;
  private lastKind: Kind | null = null;
  private stallDone = false;
  private spiderUsed = false;

  constructor(callbacks: ScareCallbacks, seed: number) {
    this.callbacks = callbacks;
    this.rand = new Random(deriveSeed(seed, 'scare'));
  }

  /** la calada del túnel es obligatoria la primera vez (la pide el Game) */
  forceStallOnce(): void {
    if (!this.stallDone) {
      this.stallDone = true;
      this.callbacks.stall();
    }
  }

  /** marca la araña como vista (evita doble susto tras la aparición garantizada) */
  markSpiderUsed(): void {
    this.spiderUsed = true;
  }

  /** nuevo intento de fuga: rearmar los eventos únicos-por-intento */
  beginAttempt(): void {
    this.spiderUsed = false;
  }

  update(dt: number, context: ScareContext): void {
    // ---- truenos: cadencia propia ----
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0) {
      this.thunderTimer = this.rand.range(context.night ? 30 : 45, context.night ? 60 : 90);
      this.callbacks.thunder();
    }

    // ---- latido principal ----
    this.beatTimer -= dt;
    if (this.beatTimer > 0) return;
    this.beatTimer = context.inEscape ? this.rand.range(12, 22) : this.rand.range(14, 26);

    if (context.inVillage) {
      this.fireVillage(context);
      return;
    }
    if (!context.driving) {
      this.beatTimer = 6;
      return;
    }
    this.fireDriving(context);
  }

  private fireVillage(context: ScareContext): void {
    const kinds: Kind[] = ['doorSlam', 'phone', 'whisper', 'doorSlam'];
    const kind = this.pick(kinds);
    if (kind === 'doorSlam') {
      this.callbacks.doorSlam(randomOffset(context.playerPos, this.rand, 18));
    } else if (kind === 'phone') {
      this.callbacks.phone(randomOffset(context.playerPos, this.rand, 12));
    } else {
      this.callbacks.whisper();
    }
  }

  private fireDriving(context: ScareContext): void {
    const pool: Kind[] = ['crows', 'eyes', 'whisper', 'thunder', 'spider', 'crossingFigure', 'falseCrash'];
    if (context.speed > 5 && !context.inTunnel) pool.push('stall');
    if (context.inTunnel && !this.stallDone) {
      this.stallDone = true;
      this.callbacks.stall();
      return;
    }
    if (context.night) pool.push('eyes', 'whisper', 'crossingFigure');
    const kind = this.pick(pool);
    switch (kind) {
      case 'crows':
        this.callbacks.crows(aheadOf(context.playerPos, context.forward, this.rand, 20));
        break;
      case 'eyes':
        if (context.night) this.callbacks.eyes(aheadOf(context.playerPos, context.forward, this.rand, 22));
        else this.callbacks.whisper();
        break;
      case 'stall':
        this.stallDone = true;
        this.callbacks.stall();
        break;
      case 'spider':
        if (!this.spiderUsed) {
          this.spiderUsed = true;
          this.callbacks.spider();
        } else {
          this.callbacks.crossingFigure();
        }
        break;
      case 'crossingFigure':
        this.callbacks.crossingFigure();
        break;
      case 'falseCrash':
        this.callbacks.falseCrash();
        break;
      case 'thunder':
        this.callbacks.thunder();
        break;
      default:
        this.callbacks.whisper();
        break;
    }
  }

  private pick(pool: Kind[]): Kind {
    const filtered = pool.filter((kind) => kind !== this.lastKind || pool.length === 1);
    const kind = this.rand.pick(filtered.length > 0 ? filtered : pool);
    this.lastKind = kind;
    return kind;
  }
}

function aheadOf(position: THREE.Vector3, forward: THREE.Vector3, rand: Random, distance: number): THREE.Vector3 {
  const lateral = rand.sign() * rand.range(5, 8);
  return new THREE.Vector3(
    position.x + forward.x * distance - forward.z * lateral,
    0,
    position.z + forward.z * distance + forward.x * lateral,
  );
}

function randomOffset(position: THREE.Vector3, rand: Random, range: number): THREE.Vector3 {
  return new THREE.Vector3(position.x + rand.range(-range, range), 0, position.z + rand.range(-range, range));
}
