import * as THREE from 'three';
import type { AudioManager } from '../core/AudioManager';
import { TAU } from '../utils/MathUtils';
import type { SpatialAudio } from './SpatialAudio';

/**
 * HorrorAudio (`TECH_ARCHITECTURE §8`, `HORROR_SYSTEM §1`): cues del terror — susurros, golpes y
 * crujidos espacializados (HRTF) para que "el peligro se oiga antes de verse". Aquí solo hay un
 * **scheduler mínimo** que dispara cues puntuales de noche; el disparo dirigido por tensión llegará
 * con el Horror Director (Fase 9), reutilizando estas mismas rutinas.
 */
export class HorrorAudio {
  private nextAt = 0;
  private readonly scratch = new THREE.Vector3();

  constructor(
    private readonly audio: AudioManager,
    private readonly spatial: SpatialAudio,
    private readonly playerPos: () => THREE.Vector3,
  ) {}

  whisper(position: THREE.Vector3, intensity = 1): void {
    this.spatial.playAt(position, {
      frequency: 1300 + Math.random() * 800,
      q: 6,
      gain: 0.4 * intensity,
      duration: 1.0,
      bus: 'horror',
    });
  }

  knock(position: THREE.Vector3, intensity = 1): void {
    this.spatial.playAt(position, {
      frequency: 110,
      duration: 0.28,
      gain: 0.6 * intensity,
      q: 0.7,
      type: 'lowpass',
      bus: 'horror',
    });
  }

  creak(position: THREE.Vector3, intensity = 1): void {
    this.spatial.playAt(position, {
      frequency: 340,
      duration: 0.7,
      gain: 0.35 * intensity,
      q: 9,
      type: 'bandpass',
      bus: 'horror',
    });
  }

  /** sting grave no-posicional: marca una transición de fase peligrosa. */
  lowSting(intensity = 1): void {
    this.audio.burst({
      duration: 1.6,
      frequency: 58,
      q: 0.5,
      gain: 0.35 * intensity,
      type: 'lowpass',
      bus: this.audio.horror ?? undefined,
    });
  }

  /**
   * Programa un cue espacial ocasional SOLO al anochecer (NIGHT / DANGER / DUSK), a 12–28 m del
   * jugador. No sustituye al Director (Fase 9); es la prueba viva del pipeline de audio 3D.
   */
  update(dayFactor: number, phase: string): void {
    if (!this.audio.ready) return;
    const night = phase === 'NIGHT' || phase === 'DANGER' || phase === 'DUSK';
    if (!night) {
      this.nextAt = this.audio.now + 4;
      return;
    }
    const now = this.audio.now;
    if (now < this.nextAt) return;
    this.nextAt = now + 14 + Math.random() * 20;
    const p = this.playerPos();
    const angle = Math.random() * TAU;
    const radius = 12 + Math.random() * 16;
    const pos = this.scratch.set(p.x + Math.cos(angle) * radius, 1.3, p.z + Math.sin(angle) * radius);
    const roll = Math.random();
    const intensity = 1.1 - dayFactor * 0.3; // más presente cuanto más noche
    if (roll < 0.45) this.whisper(pos, intensity);
    else if (roll < 0.75) this.creak(pos, intensity);
    else this.knock(pos, intensity);
  }
}
