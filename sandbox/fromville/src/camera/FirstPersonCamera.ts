import * as THREE from 'three';
import { damp } from '../utils/MathUtils';

export interface ViewState {
  /** velocidad planar normalizada 0..1 (andar=0.6, correr=1) */
  speed01: number;
  sprinting: boolean;
}

/**
 * FirstPersonCamera — dueño de la PerspectiveCamera y de sus modificadores "de cuerpo":
 * FOV que se abre al correr (feedback de velocidad), head-bob vertical y roll sutil de apoyo.
 * `reducedMotion` (prefers-reduced-motion) apaga bob/roll (TECH_ARCHITECTURE.md §11).
 */
export class FirstPersonCamera {
  readonly camera: THREE.PerspectiveCamera;

  private readonly baseFov = 72;
  private readonly sprintFov = 80;
  private fov = this.baseFov;
  private bobPhase = 0;
  private bobAmp = 0;
  private roll = 0;

  reducedMotion = false;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 1000);
    this.camera.rotation.order = 'YXZ';
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  resetBob(): void {
    this.bobPhase = 0;
    this.bobAmp = 0;
    this.roll = 0;
  }

  update(dt: number, state: ViewState): void {
    const targetFov = state.sprinting ? this.sprintFov : this.baseFov;
    this.fov = damp(this.fov, targetFov, 0.12, dt);
    if (Math.abs(this.fov - this.camera.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }

    if (this.reducedMotion) {
      this.bobAmp = 0;
      this.roll = 0;
      return;
    }

    if (state.speed01 > 0.05) {
      this.bobPhase += dt * (6.5 + state.speed01 * 6.5);
      this.bobAmp = damp(this.bobAmp, 0.02 + state.speed01 * 0.035, 0.25, dt);
    } else {
      this.bobAmp = damp(this.bobAmp, 0, 0.25, dt);
      this.bobPhase = damp(this.bobPhase, Math.round(this.bobPhase / Math.PI) * Math.PI, 0.2, dt);
    }
    const targetRoll = Math.sin(this.bobPhase * 0.5) * (state.sprinting ? 0.008 : 0.004);
    this.roll = damp(this.roll, targetRoll, 0.2, dt);
  }

  /** aplica posición (con bob) + rotación (yaw/pitch/roll) a la cámara */
  applyTo(position: THREE.Vector3, yaw: number, pitch: number): void {
    this.camera.position.set(position.x, position.y + Math.sin(this.bobPhase) * this.bobAmp, position.z);
    this.camera.rotation.set(pitch, yaw, this.roll);
  }
}
