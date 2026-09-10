import * as THREE from 'three';
import type { Quality } from '../core/Settings';
import { clamp, lerp } from '../utils/MathUtils';

export type Phase = 'DAY' | 'SUNSET' | 'DUSK' | 'NIGHT' | 'DANGER' | 'DAWN';

interface Palette {
  day: number;
  sunColor: number;
  sunI: number;
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  sky: number;
  fogColor: number;
  fogD: number;
  tint: [number, number, number];
  sat: number;
}

/** Paletas por fase (VISUAL_DIRECTION.md §2): día sepia lechoso → atardecer naranja → crepúsculo
 * púrpura → noche azul-verdosa → danger (pico) → alba. Desaturadas + tinte para el LUT. */
const P: Record<Phase, Palette> = {
  DAY: {
    day: 1,
    sunColor: 0xfff0d6,
    sunI: 1.15,
    hemiSky: 0xa9b3bd,
    hemiGround: 0x4a4239,
    hemiI: 0.9,
    sky: 0x7c828a,
    fogColor: 0x7c828a,
    fogD: 0.01,
    tint: [1.02, 1.0, 0.96],
    sat: 0.86,
  },
  SUNSET: {
    day: 0.5,
    sunColor: 0xff8a3d,
    sunI: 0.95,
    hemiSky: 0x6d5a6b,
    hemiGround: 0x3a2f2a,
    hemiI: 0.7,
    sky: 0x3a2f38,
    fogColor: 0x4a3a3a,
    fogD: 0.013,
    tint: [1.06, 0.9, 0.8],
    sat: 0.8,
  },
  DUSK: {
    day: 0.2,
    sunColor: 0xb06a9a,
    sunI: 0.4,
    hemiSky: 0x3a3550,
    hemiGround: 0x241f28,
    hemiI: 0.5,
    sky: 0x201f2e,
    fogColor: 0x26242f,
    fogD: 0.017,
    tint: [0.9, 0.9, 1.06],
    sat: 0.8,
  },
  NIGHT: {
    day: 0.0,
    sunColor: 0x9fb6d6,
    sunI: 0.22,
    hemiSky: 0x36444f,
    hemiGround: 0x181a14,
    hemiI: 0.5,
    sky: 0x0e141c,
    fogColor: 0x0e141c,
    fogD: 0.016,
    tint: [0.85, 0.92, 1.06],
    sat: 0.78,
  },
  DANGER: {
    day: 0.0,
    sunColor: 0x7fa0c8,
    sunI: 0.14,
    hemiSky: 0x24303c,
    hemiGround: 0x101208,
    hemiI: 0.34,
    sky: 0x080c12,
    fogColor: 0x080c12,
    fogD: 0.022,
    tint: [0.8, 0.88, 1.1],
    sat: 0.72,
  },
  DAWN: {
    day: 0.5,
    sunColor: 0xffd9a0,
    sunI: 0.6,
    hemiSky: 0x7a6f74,
    hemiGround: 0x33302a,
    hemiI: 0.6,
    sky: 0x4a4550,
    fogColor: 0x4a4550,
    fogD: 0.015,
    tint: [1.02, 0.98, 0.95],
    sat: 0.82,
  },
};

/** Duraciones de fase (HORROR_SYSTEM.md §3). Un ciclo completo ≈ 845 s a timeScale 1. */
const TIMELINE: { phase: Phase; duration: number }[] = [
  { phase: 'DAY', duration: 300 },
  { phase: 'SUNSET', duration: 75 },
  { phase: 'DUSK', duration: 40 },
  { phase: 'NIGHT', duration: 300 },
  { phase: 'DANGER', duration: 90 },
  { phase: 'DAWN', duration: 40 },
];
const CYCLE = TIMELINE.reduce((sum, seg) => sum + seg.duration, 0);
const FOG_SCALE: Record<Quality, number> = { LOW: 1.35, MED: 1.0, HIGH: 0.8 };

export interface DayNightDeps {
  scene: THREE.Scene;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  fog: THREE.FogExp2;
}

/**
 * DayNight — reloj del mundo por fases. Interpola (con suavizado independiente del framerate)
 * dirección/intensidad del sol, hemisphere, color del cielo/fondo, densidad de niebla y el tinte
 * de LUT para el PostFX. Expone `onPhaseChange` (lo consumirán el Horror Director y el audio).
 * Es el "reloj" que consulta las criaturas (Dormant de día) en fases posteriores.
 */
export class DayNight {
  onPhaseChange: ((phase: Phase, dayFactor: number) => void) | null = null;

  private readonly scene: THREE.Scene;
  private readonly sun: THREE.DirectionalLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly fog: THREE.FogExp2;
  private readonly bg = new THREE.Color();
  private readonly scratch = new THREE.Color();

  private time = 0;
  private timeScale = 1;
  private quality: Quality;
  private phase: Phase = 'DAY';

  // valores corrientes interpolados
  private readonly c = {
    day: 1,
    sunI: P.DAY.sunI,
    hemiI: P.DAY.hemiI,
    fogD: P.DAY.fogD,
    sat: P.DAY.sat,
    sunColor: new THREE.Color(P.DAY.sunColor),
    hemiSky: new THREE.Color(P.DAY.hemiSky),
    hemiGround: new THREE.Color(P.DAY.hemiGround),
    sky: new THREE.Color(P.DAY.sky),
    fogColor: new THREE.Color(P.DAY.fogColor),
    tint: new THREE.Color(P.DAY.tint[0], P.DAY.tint[1], P.DAY.tint[2]),
  };

  constructor(deps: DayNightDeps, quality: Quality) {
    this.scene = deps.scene;
    this.sun = deps.sun;
    this.hemi = deps.hemi;
    this.fog = deps.fog;
    this.quality = quality;
    this.apply();
  }

  get currentPhase(): Phase {
    return this.phase;
  }
  get dayFactor(): number {
    return this.c.day;
  }
  get nightFactor(): number {
    return 1 - this.c.day;
  }
  get moodTint(): THREE.Color {
    return this.c.tint;
  }
  get moodSaturation(): number {
    return this.c.sat;
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
  }

  setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  get timeScaleValue(): number {
    return this.timeScale;
  }

  /** cheat: salta al inicio de la siguiente fase */
  skipToNext(): void {
    const idx = TIMELINE.findIndex((seg) => seg.phase === this.phase);
    const next = (idx + 1) % TIMELINE.length;
    let t = 0;
    for (let i = 0; i < next; i++) t += TIMELINE[i].duration;
    this.time = t + 0.01;
  }

  update(dt: number): void {
    this.time = (this.time + dt * this.timeScale) % CYCLE;
    const phase = this.phaseAt(this.time);
    if (phase !== this.phase) {
      this.phase = phase;
      this.onPhaseChange?.(phase, this.c.day);
    }

    const target = P[this.phase];
    const k = 1 - 2 ** (-dt / 2.5); // halfLife 2.5 s → transiciones suaves entre fases
    this.c.day += (target.day - this.c.day) * k;
    this.c.sunI += (target.sunI - this.c.sunI) * k;
    this.c.hemiI += (target.hemiI - this.c.hemiI) * k;
    this.c.fogD += (target.fogD - this.c.fogD) * k;
    this.c.sat += (target.sat - this.c.sat) * k;
    this.c.sunColor.lerp(this.scratch.setHex(target.sunColor), k);
    this.c.hemiSky.lerp(this.scratch.setHex(target.hemiSky), k);
    this.c.hemiGround.lerp(this.scratch.setHex(target.hemiGround), k);
    this.c.sky.lerp(this.scratch.setHex(target.sky), k);
    this.c.fogColor.lerp(this.scratch.setHex(target.fogColor), k);
    this.c.tint.lerp(this.scratch.setRGB(target.tint[0], target.tint[1], target.tint[2]), k);

    this.apply();
  }

  private apply(): void {
    const d = clamp(this.c.day, 0, 1);
    this.sun.color.copy(this.c.sunColor);
    this.sun.intensity = this.c.sunI;
    this.sun.position.set(-60, lerp(6, 95, d), 40);

    this.hemi.color.copy(this.c.hemiSky);
    this.hemi.groundColor.copy(this.c.hemiGround);
    this.hemi.intensity = this.c.hemiI;

    this.bg.copy(this.c.sky);
    this.scene.background = this.bg;
    this.fog.color.copy(this.c.fogColor);
    this.fog.density = this.c.fogD * FOG_SCALE[this.quality];
  }

  private phaseAt(time: number): Phase {
    let acc = 0;
    for (const seg of TIMELINE) {
      acc += seg.duration;
      if (time < acc) return seg.phase;
    }
    return 'DAY';
  }
}
