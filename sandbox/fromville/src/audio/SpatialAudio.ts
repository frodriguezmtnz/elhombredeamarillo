import * as THREE from 'three';
import type { AudioManager } from '../core/AudioManager';

/**
 * SpatialAudio (`TECH_ARCHITECTURE §8`): sincroniza el `AudioListener` con la cámara del jugador y
 * reproduce ráfagas de ruido en una posición del mundo (HRTF/`PannerNode` → p.ej. susurros o golpes
 * que se oyen "a la espalda"). Solo espacializa fuentes puntuales; la cama ambiental es no-posicional.
 */
export class SpatialAudio {
  constructor(private readonly audio: AudioManager) {}

  updateListener(camera: THREE.Camera): void {
    const ctx = this.audio.audioContext;
    if (!ctx) return;
    const listener = ctx.listener;
    const position = camera.getWorldPosition(pos);
    const forward = camera.getWorldDirection(dir);
    const t = ctx.currentTime;
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(position.x, t, 0.02);
      listener.positionY.setTargetAtTime(position.y, t, 0.02);
      listener.positionZ.setTargetAtTime(position.z, t, 0.02);
      listener.forwardX.setTargetAtTime(forward.x, t, 0.02);
      listener.forwardY.setTargetAtTime(forward.y, t, 0.02);
      listener.forwardZ.setTargetAtTime(forward.z, t, 0.02);
      listener.upX.setTargetAtTime(0, t, 0.02);
      listener.upY.setTargetAtTime(1, t, 0.02);
      listener.upZ.setTargetAtTime(0, t, 0.02);
    } else {
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
    }
  }

  /** ráfaga de ruido filtrado en una posición del mundo (devuelve el source para efectos largos). */
  playAt(
    position: THREE.Vector3,
    options: {
      frequency: number;
      duration: number;
      gain?: number;
      q?: number;
      type?: BiquadFilterType;
      bus?: 'horror' | 'player';
    },
  ): void {
    const ctx = this.audio.audioContext;
    if (!ctx) return;
    const loop = this.audio.noiseLoop(false);
    if (!loop) return;
    const destination = (options.bus === 'player' ? this.audio.player : this.audio.horror) ?? ctx.destination;
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 3;
    panner.maxDistance = 160;
    panner.rolloffFactor = 1.6;
    if (panner.positionX) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }
    loop.filter.type = options.type ?? 'bandpass';
    loop.filter.frequency.value = options.frequency;
    loop.filter.Q.value = options.q ?? 2;
    const t0 = ctx.currentTime;
    loop.gain.gain.setValueAtTime(options.gain ?? 0.5, t0);
    loop.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.duration);
    loop.gain.connect(panner);
    panner.connect(destination);
    loop.source.start(t0);
    loop.source.stop(t0 + options.duration + 0.05);
  }
}

const pos = new THREE.Vector3();
const dir = new THREE.Vector3();
