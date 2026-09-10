import * as THREE from 'three';
import type { LampSpec } from './layout';

const WARM = 0xffb066;

/**
 * LampLights — en vez de una luz por farola (habría cientos), mantiene un pequeño pool de
 * PointLights que cada frame se reposicionan sobre las `count` farolas MÁS CERCANAS al jugador.
 * La intensidad escala con `nightFactor` (de día están apagadas). Sin sombras: barato.
 */
export class LampLights {
  private readonly lights: THREE.PointLight[] = [];
  private readonly targets: LampSpec[];
  private readonly count: number;
  private readonly bestLamp: (LampSpec | null)[];
  private readonly bestDist: number[];

  constructor(scene: THREE.Scene, lamps: LampSpec[], count = 5) {
    this.targets = lamps;
    this.count = Math.max(1, Math.min(count, lamps.length || 1));
    this.bestLamp = new Array(this.count).fill(null);
    this.bestDist = new Array(this.count).fill(Number.POSITIVE_INFINITY);
    for (let i = 0; i < this.count; i++) {
      const light = new THREE.PointLight(WARM, 0, 16, 2);
      light.position.set(0, 4.1, 0);
      scene.add(light);
      this.lights.push(light);
    }
  }

  /** x,z del jugador, nightFactor 0..1 y un factor de flicker (parpadeo puntual). */
  update(px: number, pz: number, nightFactor: number, flicker = 1): void {
    const intensity = nightFactor * flicker;
    if (intensity <= 0.001) {
      for (const l of this.lights) l.intensity = 0;
      return;
    }
    this.selectNearest(px, pz);
    for (let i = 0; i < this.lights.length; i++) {
      const lamp = this.bestLamp[i];
      const light = this.lights[i];
      if (!lamp) {
        light.intensity = 0;
        continue;
      }
      light.position.set(lamp.x, 4.1, lamp.z);
      light.intensity = intensity * 50; // candela: ~1.4 a 6 m, ~0.5 a 10 m (charco cálido de luz)
    }
  }

  /** selección parcial (una pasada) de las `count` farolas más cercanas, sin ordenar ni asignar. */
  private selectNearest(px: number, pz: number): void {
    this.bestLamp.fill(null);
    this.bestDist.fill(Number.POSITIVE_INFINITY);
    let filled = 0;
    let worst = 0;
    for (const lamp of this.targets) {
      const d = (lamp.x - px) ** 2 + (lamp.z - pz) ** 2;
      if (filled < this.count) {
        this.bestLamp[filled] = lamp;
        this.bestDist[filled] = d;
        filled++;
      } else if (d < this.bestDist[worst]) {
        this.bestLamp[worst] = lamp;
        this.bestDist[worst] = d;
      } else {
        continue;
      }
      if (filled === this.count) {
        worst = 0;
        for (let i = 1; i < this.count; i++) if (this.bestDist[i] > this.bestDist[worst]) worst = i;
      }
    }
  }

  dispose(scene: THREE.Scene): void {
    for (const l of this.lights) {
      scene.remove(l);
      l.dispose();
    }
  }
}
