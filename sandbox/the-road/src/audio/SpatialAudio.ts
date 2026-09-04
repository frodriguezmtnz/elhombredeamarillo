import * as THREE from 'three';
import type { AudioManager } from '../core/AudioManager';

/**
 * SpatialAudio — efectos posicionales con PannerNode.
 * El listener se sincroniza con la cámara cada frame.
 */
export class SpatialAudio {
  private audio: AudioManager;

  constructor(audio: AudioManager) {
    this.audio = audio;
  }

  updateListener(camera: THREE.Camera): void {
    const context = this.audioContext();
    if (!context) return;
    const listener = context.listener;
    const position = camera.getWorldPosition(tempVec1);
    const forward = camera.getWorldDirection(tempVec2);
    if (listener.positionX) {
      const t = context.currentTime;
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

  /** ráfaga de ruido filtrado en una posición del mundo */
  playAt(
    position: THREE.Vector3,
    options: { frequency: number; duration: number; gain?: number; q?: number; type?: BiquadFilterType },
  ): void {
    const context = this.audioContext();
    if (!context || !this.audio.effects) return;
    const loop = this.audio.noiseLoop(false);
    if (!loop) return;
    const panner = context.createPanner();
    panner.panningModel = 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance = 3;
    panner.maxDistance = 140;
    panner.rolloffFactor = 1.7;
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
    const t0 = context.currentTime;
    loop.gain.gain.setValueAtTime(options.gain ?? 0.5, t0);
    loop.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.duration);
    loop.gain.connect(panner);
    panner.connect(this.audio.effects);
    loop.source.start(t0);
    loop.source.stop(t0 + options.duration + 0.05);
  }

  private audioContext(): AudioContext | null {
    return this.audio.audioContext;
  }
}

const tempVec1 = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
