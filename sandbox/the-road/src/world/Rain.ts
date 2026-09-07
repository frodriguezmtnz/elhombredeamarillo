import * as THREE from 'three';
import { damp } from '../utils/MathUtils';

/**
 * Rain — lluvia que "solo existe cerca de ti": LineSegments en una caja
 * de 40×26m centrada en la cámara, con envolvente por factor.
 */
const DROPS = 900;
const BOX_W = 40;
const BOX_H = 24;
const BOX_D = 26;

export class Rain {
  readonly group = new THREE.Group();
  private readonly lines: THREE.LineSegments;
  private readonly material: THREE.LineBasicMaterial;
  private readonly positions: Float32Array;
  private factor = 0;
  private target = 0;

  constructor() {
    this.positions = new Float32Array(DROPS * 6);
    for (let i = 0; i < DROPS; i++) {
      const x = (Math.random() - 0.5) * BOX_W;
      const y = Math.random() * BOX_H;
      const z = (Math.random() - 0.5) * BOX_D;
      const len = 0.35 + Math.random() * 0.3;
      this.positions.set([x, y, z, x + 0.06, y - len, z], i * 6);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.LineBasicMaterial({
      color: '#8fa5b8',
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    });
    this.lines = new THREE.LineSegments(geometry, this.material);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
    this.group.visible = false;
  }

  setTarget(factor: number): void {
    this.target = Math.max(0, Math.min(1, factor));
  }

  get active(): boolean {
    return this.target > 0.01;
  }

  /** factor actual 0..1 (para el audio) */
  get level(): number {
    return this.factor;
  }

  update(dt: number, camera: THREE.Camera): void {
    this.factor = damp(this.factor, this.target, 4, dt);
    this.material.opacity = this.factor * 0.4;
    this.group.visible = this.factor > 0.01;
    if (!this.group.visible) return;

    // la caja sigue a la cámara
    const camPos = camera.position;
    this.group.position.set(camPos.x, camPos.y - BOX_H * 0.45, camPos.z);

    const fall = 22 * dt;
    for (let i = 0; i < DROPS; i++) {
      const base = i * 6;
      this.positions[base + 1] -= fall;
      this.positions[base + 4] -= fall;
      // viento ligero
      this.positions[base] += 1.4 * dt;
      this.positions[base + 3] += 1.4 * dt;
      if (this.positions[base + 1] < -BOX_H * 0.55) {
        const x = (Math.random() - 0.5) * BOX_W;
        const z = (Math.random() - 0.5) * BOX_D;
        const len = 0.35 + Math.random() * 0.3;
        this.positions[base] = x;
        this.positions[base + 1] = BOX_H * 0.55;
        this.positions[base + 2] = z;
        this.positions[base + 3] = x + 0.06;
        this.positions[base + 4] = BOX_H * 0.55 - len;
        this.positions[base + 5] = z;
      }
    }
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
