import * as THREE from 'three';
import { clamp, damp } from '../utils/MathUtils';

const DRAIN = 1 / 120; // batería dura ~2 min encendida
const RECHARGE = 1 / 300; // se recupera despacio al apagarla (prototype-friendly)
const BASE_INTENSITY = 60;

/**
 * Flashlight — SpotLight anclado a la cámara (linterna, GAME_DESIGN §7). Con batería que se
 * agota al usarla y se recupera al apagarla; la intensidad y el parpadeo (flicker) empeoran
 * cuando queda poca carga o el sistema de terror (HorrorDirector, Fase 9) la estresa.
 */
export class Flashlight {
  private readonly light: THREE.SpotLight;
  private readonly target: THREE.Object3D;
  private readonly camera: THREE.PerspectiveCamera;

  private battery = 1;
  private current = 0; // intensidad suavizada
  private stress = 0; // 0..1, la sube el HorrorDirector para el parpadeo "de susto"

  active = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.light = new THREE.SpotLight(0xfff1dc, 0, 30, 0.5, 0.45, 1.1);
    this.light.position.set(0.16, -0.12, 0);
    this.target = new THREE.Object3D();
    this.target.position.set(0.16, -0.12, -1);
    camera.add(this.light);
    camera.add(this.target);
    this.light.target = this.target;
  }

  get level(): number {
    return this.battery;
  }

  toggle(): boolean {
    if (!this.active && this.battery <= 0.02) {
      this.battery = 0; // sin carga: no enciende
      return false;
    }
    this.active = !this.active;
    return this.active;
  }

  setStress(v: number): void {
    this.stress = clamp(v, 0, 1);
  }

  update(dt: number): void {
    if (this.active) {
      this.battery = clamp(this.battery - dt * DRAIN, 0, 1);
      if (this.battery <= 0) this.active = false;
    } else {
      this.battery = clamp(this.battery + dt * RECHARGE, 0, 1);
    }

    let target = 0;
    if (this.active && this.battery > 0) {
      const charge = this.battery < 0.28 ? clamp(this.battery / 0.28, 0.18, 1) : 1;
      target = BASE_INTENSITY * charge * this.flicker();
    }
    this.current = damp(this.current, target, this.active ? 0.05 : 0.25, dt);
    this.light.intensity = this.current;
  }

  private flicker(): number {
    const low = this.battery < 0.12 ? 1 : this.battery < 0.3 ? 0.35 : 0.06;
    const chance = 0.02 + low * 0.5 + this.stress * 0.3;
    return Math.random() < chance ? 0.12 + Math.random() * 0.6 : 1;
  }

  dispose(): void {
    this.camera.remove(this.light);
    this.camera.remove(this.target);
    this.light.dispose();
  }
}
