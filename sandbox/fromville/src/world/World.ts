import * as THREE from 'three';
import type { CollisionSystem } from './CollisionSystem';
import { buildForest } from './Forest';
import type { LoopRoad } from './LoopRoad';
import { buildProps } from './Props';
import { buildTown } from './Town';
import { buildLayout } from './layout';
import type { WorldLayout } from './layout';
import { WORLD } from './layout';

/**
 * World — contenedor del entorno gris (Fase 4): suelo, carretera-bucle (anillo), POIs del pueblo
 * (kits), bosque con LOD/impostores y props (farolas, rocas). La geometría la decide `layout.ts`
 * (determinista por seed); los módulos la convierten en mallas. Las luces/niebla las gobierna
 * DayNight (Fase 3). Sin materiales PBR ni Blender todavía (Fase 5).
 */
export class World {
  readonly group = new THREE.Group();
  readonly curve: LoopRoad;
  readonly layout: WorldLayout;
  /** luces + niebla las maneja DayNight (Fase 3); World solo las crea y expone */
  readonly hemi: THREE.HemisphereLight;
  readonly sun: THREE.DirectionalLight;
  readonly fog: THREE.FogExp2;

  constructor(scene: THREE.Scene, seed: number, collisions: CollisionSystem) {
    this.layout = buildLayout(seed);
    this.curve = this.layout.curve;

    this.hemi = new THREE.HemisphereLight(0xa9b3bd, 0x4a4239, 0.9);
    this.sun = new THREE.DirectionalLight(0xfff0d6, 1.15);
    this.sun.position.set(-60, 90, 40);
    this.fog = new THREE.FogExp2(0x7c828a, 0.01);
    scene.background = new THREE.Color(0x7c828a);
    scene.fog = this.fog;
    scene.add(this.hemi, this.sun);

    this.buildGround();
    this.buildRoad();
    this.group.add(buildTown(this.layout.landmarks, collisions));
    this.group.add(buildForest(this.layout.trees));
    this.group.add(buildProps(this.layout.lamps, this.layout.rocks));
    this.registerScatterColliders(collisions);
    scene.add(this.group);
  }

  /** terreno plano (0 en todo el anillo); Terrain real llega más adelante */
  heightAt(_x: number, _z: number): number {
    return 0;
  }

  project(x: number, z: number, hint: number): { s: number; lateral: number; index: number } {
    return this.curve.project(x, z, hint);
  }

  /** colisión de los elementos dispersos (árboles, rocas, postes de farola) */
  private registerScatterColliders(collisions: CollisionSystem): void {
    for (const t of this.layout.trees) collisions.add(t.x, t.z, t.r, 'tree');
    for (const r of this.layout.rocks) collisions.add(r.x, r.z, r.scale * 0.6, 'rock');
    for (const l of this.layout.lamps) collisions.add(l.x, l.z, 0.25, 'lamp');
  }

  private buildGround(): void {
    const disc = new THREE.CircleGeometry(WORLD.radius * 1.7, 64);
    disc.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(disc, new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 1 }));
    this.group.add(ground);
  }

  private buildRoad(): void {
    const { points, count } = this.curve;
    const hw = WORLD.roadHalfWidth;
    const y = 0.03;
    const positions = new Float32Array(count * 2 * 3);
    const indices: number[] = [];
    for (let i = 0; i < count; i++) {
      const p = points[i];
      positions[i * 6 + 0] = p.x + p.nx * hw;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = p.z + p.nz * hw;
      positions[i * 6 + 3] = p.x - p.nx * hw;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = p.z - p.nz * hw;
      const a = i * 2;
      const b = i * 2 + 1;
      const j = (i + 1) % count;
      const c = j * 2;
      const d = j * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 1, side: THREE.DoubleSide });
    this.group.add(new THREE.Mesh(geo, mat));
  }
}
