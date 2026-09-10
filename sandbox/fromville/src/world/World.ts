import * as THREE from 'three';
import type { CollisionSystem } from './CollisionSystem';
import type { LoopRoad } from './LoopRoad';
import { buildLayout } from './layout';
import type { WorldLayout } from './layout';
import { WORLD } from './layout';

/**
 * World — bloque GRIS de la Fase 1: suelo, carretera-bucle (anillo), pueblo de cajas y bosque
 * instanciado. Sin materiales PBR ni Blender todavía (Fase 5). La geometría la decide `layout.ts`
 * (determinista por seed); aquí solo se convierte en mallas y colliders.
 */
export class World {
  readonly group = new THREE.Group();
  readonly curve: LoopRoad;
  readonly layout: WorldLayout;

  constructor(scene: THREE.Scene, seed: number, collisions: CollisionSystem) {
    this.layout = buildLayout(seed);
    this.curve = this.layout.curve;
    this.addAtmosphere(scene);
    this.buildGround();
    this.buildRoad();
    this.buildTown(collisions);
    this.buildForest(collisions);
    scene.add(this.group);
  }

  /** terreno plano en Fase 1 (0 en todo el anillo); Terrain real llega más adelante */
  heightAt(_x: number, _z: number): number {
    return 0;
  }

  project(x: number, z: number, hint: number): { s: number; lateral: number; index: number } {
    return this.curve.project(x, z, hint);
  }

  private addAtmosphere(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x141a21);
    scene.fog = new THREE.FogExp2(0x141a21, 0.011);

    const hemi = new THREE.HemisphereLight(0x93a6ba, 0x3a352f, 1.05);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2e0, 1.2);
    sun.position.set(-60, 90, 40);
    scene.add(sun);
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
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1e22,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    this.group.add(new THREE.Mesh(geo, mat));
  }

  private buildTown(collisions: CollisionSystem): void {
    for (const box of this.layout.boxes) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(box.w, box.h, box.d),
        new THREE.MeshStandardMaterial({ color: 0x767c84, roughness: 0.9 }),
      );
      mesh.position.set(box.x, box.h / 2, box.z);
      mesh.rotation.y = box.rot;
      this.group.add(mesh);
      collisions.addBox(box.x, box.z, box.w / 2, box.d / 2, 'building');
    }
  }

  private buildForest(collisions: CollisionSystem): void {
    const trees = this.layout.trees;
    const count = trees.length;

    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6);
    trunkGeo.translate(0, 0.7, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);

    const foliageGeo = new THREE.ConeGeometry(1.15, 3.2, 7);
    foliageGeo.translate(0, 3.0, 0);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x33463a, roughness: 1 });
    const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, count);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = trees[i];
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, ((i * 2.399) % Math.PI) * 2, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      foliage.setMatrixAt(i, dummy.matrix);
      collisions.add(t.x, t.z, t.r, 'tree');
    }
    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;
    this.group.add(trunks, foliage);
  }
}
