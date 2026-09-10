import type { CollisionSystem } from '../world/CollisionSystem';

export interface SenseInput {
  /** posición y dirección (unidad, plano XZ) de la criatura */
  cx: number;
  cz: number;
  cdx: number;
  cdz: number;
  /** posición y dirección (unidad) del jugador */
  px: number;
  pz: number;
  pdx: number;
  pdz: number;
  flashlightOn: boolean;
  sprinting: boolean;
  walking: boolean;
}

export interface SenseResult {
  dist: number;
  canSee: boolean;
  spotlighted: boolean;
  sightStim: number;
  noiseStim: number;
  spotStim: number;
  /** el mayor de los estímulos → objetivo de `awareness` este frame */
  stimulus: number;
}

const SIGHT_RANGE = 22;
const SIGHT_CONE_COS = 0.42; // ~±65° de frente
const SPOT_RANGE = 30;
const SPOT_CONE_COS = 0.94; // el cono de la linterna es estrecho
const HEAR_RUN = 42;
const HEAR_WALK = 18;
const HEAR_IDLE = 8;

/**
 * PerceptionSystem (AI.md §2, capa 1): NO es un estado, es un sensor. Cada frame devuelve los
 * estímulos que alimentan el `awareness` de la criatura: línea de visión (cono frontal + oclusión
 * por colisión), ruido del jugador (correr > andar > quieto) y el "autodelatarse" al apuntarle con
 * la linterna. El `Creature` integra estos estímulos en un escalar [0,1] con subida rápida y
 * decaimiento lento (pierde el rastro → pasa a Search).
 */
export class PerceptionSystem {
  constructor(private readonly collisions: CollisionSystem) {}

  sense(input: SenseInput, out: SenseResult): SenseResult {
    const toX = input.px - input.cx;
    const toZ = input.pz - input.cz;
    const dist = Math.hypot(toX, toZ) || 1e-4;
    const nx = toX / dist;
    const nz = toZ / dist;

    const blocked = this.collisions.blocked(input.cx, input.cz, input.px, input.pz, 'creature');
    const facingPlayer = nx * input.cdx + nz * input.cdz > SIGHT_CONE_COS;
    const canSee = !blocked && dist < SIGHT_RANGE && facingPlayer;

    // linterna: si el jugador le da de frente, lo revela (el cono va del jugador hacia la criatura)
    const aimedAtCreature = -nx * input.pdx + -nz * input.pdz > SPOT_CONE_COS;
    const spotlighted = input.flashlightOn && !blocked && dist < SPOT_RANGE && aimedAtCreature;

    const gait = input.sprinting ? 0.9 : input.walking ? 0.55 : 0.22;
    const hearRange = input.sprinting ? HEAR_RUN : input.walking ? HEAR_WALK : HEAR_IDLE;
    const noiseStim = Math.max(0, 1 - dist / hearRange) * gait;
    const sightStim = canSee ? 0.8 : 0;
    const spotStim = spotlighted ? 0.95 : 0;

    out.dist = dist;
    out.canSee = canSee;
    out.spotlighted = spotlighted;
    out.sightStim = sightStim;
    out.noiseStim = noiseStim;
    out.spotStim = spotStim;
    out.stimulus = Math.max(noiseStim, sightStim, spotStim);
    return out;
  }
}
