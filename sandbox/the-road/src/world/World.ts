import * as THREE from 'three';
import { AmbientAudio } from '../audio/AmbientAudio';
import type { AssetManager } from '../core/AssetManager';
import type { AudioManager } from '../core/AudioManager';
import type { Quality } from '../core/Settings';
import { clamp, damp, lerp } from '../utils/MathUtils';
import { Random } from '../utils/Random';
import { CollisionSystem } from './CollisionSystem';
import { buildForest } from './Forest';
import type { ForestLayers } from './Forest';
import { buildRoad } from './Road';
import type { RoadBuildResult } from './Road';
import { RoadCurve } from './RoadCurve';
import type { CurvePose, ProjectionResult } from './RoadCurve';

export const WORLD = {
  /** anillo de ~2.25 km: compacto para el ritmo del MVP */
  radius: 360,
  /** centro del pueblo en coordenada de arco */
  villageS: 0,
  villageHalf: 135,
  /** coordenada de arco donde empieza el jugador */
  startS: 260,
  /** barricada que bloquea el camino de vuelta hasta pasar por el árbol */
  barrierS: 225,
  /** lago al lateral de la carretera (visible desde el primer tramo) */
  lakeS: 620,
  /** túnel bajo la montaña (tramo de fuga) */
  tunnelS: 1430,
  tunnelLength: 120,
  /** faro: alcanzable andando por el camino de tierra */
  lighthouseLateral: 160,
  /** coordenada de arco del árbol caído (intro ~35-40s) */
  treeS: 820,
} as const;

/**
 * World — carretera + bosque + terreno + cielo + iluminación + audio ambiente.
 * El mundo entero es un anillo cerrado estático (el bucle es la geometría);
 * la niebla y el bosque ocultan que el mapa es finito.
 */
export class World {
  readonly curve: RoadCurve;
  readonly group = new THREE.Group();
  readonly collisions = new CollisionSystem();
  readonly ambientAudio: AmbientAudio;
  readonly sun: THREE.DirectionalLight;
  readonly startPose: CurvePose;

  private readonly road: RoadBuildResult;
  private readonly forest: ForestLayers;
  private readonly rand = new Random(20260829);
  private readonly sunOffset = new THREE.Vector3(-70, 95, -55);
  private readonly windPose: CurvePose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  // ---- ciclo atardecer → noche ----
  private readonly skyMat: THREE.ShaderMaterial;
  private readonly starsMat: THREE.PointsMaterial;
  private readonly moonMat: THREE.MeshBasicMaterial;
  private readonly hemi: THREE.HemisphereLight;
  private readonly sceneFog: THREE.FogExp2;
  private readonly duskTop = new THREE.Color('#26313f');
  private readonly nightTop = new THREE.Color('#04060c');
  private readonly duskHorizon = new THREE.Color('#54424a');
  private readonly nightHorizon = new THREE.Color('#141c26');
  private readonly duskFog = new THREE.Color('#2b2830');
  private readonly nightFog = new THREE.Color('#0a0f16');
  private readonly duskSun = new THREE.Color('#d8a878');
  private readonly nightSun = new THREE.Color('#8fa3b8');
  private timeCurrent = 0;
  private timeTarget = 0;
  private timeApplied = -1;
  private fogBoost = false;
  private fogDensityScale = 1;
  /** temporizador del relámpago (0 = sin flash) */
  private flashTime = 0;

  constructor(scene: THREE.Scene, assets: AssetManager, audio: AudioManager, seed: number, quality: Quality) {
    this.ambientAudio = new AmbientAudio(audio);
    this.curve = new RoadCurve(seed, WORLD.radius);
    this.startPose = this.curve.at(WORLD.startS, this.windPose);

    // ---------- niebla ----------
    scene.fog = new THREE.FogExp2('#0a0f16', 0.0052);

    // ---------- terreno ----------
    const rand = this.rand;
    const groundGeo = new THREE.CircleGeometry(920, 96);
    groundGeo.rotateX(-Math.PI / 2);
    const groundPos = groundGeo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(groundPos.count * 3);
    const base = new THREE.Color('#161d13');
    const rich = new THREE.Color('#212c19');
    const dark = new THREE.Color('#0f140c');
    const tmp = new THREE.Color();
    for (let i = 0; i < groundPos.count; i++) {
      const x = groundPos.getX(i);
      const z = groundPos.getZ(i);
      const n =
        Math.sin(x * 0.021 + 1.7) * Math.cos(z * 0.018) * 0.5 +
        Math.sin(x * 0.11) * Math.cos(z * 0.087) * 0.3 +
        (rand.next() - 0.5) * 0.24;
      tmp.copy(n > 0 ? base : dark).lerp(rich, Math.abs(n));
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const ground = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
    );
    ground.position.y = -0.03;
    ground.receiveShadow = quality !== 'low';
    this.group.add(ground);

    // ---------- carretera ----------
    this.road = buildRoad(this.curve, assets);
    this.road.setShadows(quality !== 'low');
    this.group.add(this.road.group);

    // ---------- bosque (excluyendo lago, túnel y camino al faro) ----------
    this.forest = buildForest(this.curve, seed, WORLD.villageS, WORLD.villageHalf, WORLD.treeS, [
      { s: WORLD.lakeS, half: 75, side: -1, maxOffset: 34 },
      { s: WORLD.tunnelS + 60, half: 95, side: 0, maxOffset: 55 },
      { s: 1900, half: 34, side: 1, maxOffset: 175 }, // claro del camino al faro
    ]);
    this.group.add(this.forest.group);
    for (const collider of this.forest.colliders) {
      this.collisions.add(collider.x, collider.z, collider.r);
    }

    // ---------- cielo (gradiente: empieza al atardecer) ----------
    this.sceneFog = new THREE.FogExp2(this.duskFog.getHex(), 0.0044);
    scene.fog = this.sceneFog;
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: this.duskTop.clone() },
        horizonColor: { value: this.duskHorizon.clone() },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          float t = smoothstep(-0.05, 0.45, h);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 16, 10), this.skyMat);
    sky.renderOrder = -10;
    this.group.add(sky);

    // ---------- estrellas ----------
    const starCount = 320;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const angle = rand.next() * Math.PI * 2;
      const height = rand.range(0.16, 0.92);
      const horizontal = Math.sqrt(Math.max(0, 1 - height * height));
      starPositions[i * 3] = Math.cos(angle) * horizontal * 1300;
      starPositions[i * 3 + 1] = height * 1300;
      starPositions[i * 3 + 2] = Math.sin(angle) * horizontal * 1300;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starsMat = new THREE.PointsMaterial({
      color: '#9fb0c4',
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.12,
      fog: false,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeometry, this.starsMat);
    stars.renderOrder = -9;
    this.group.add(stars);

    // ---------- luna ----------
    this.moonMat = new THREE.MeshBasicMaterial({
      color: '#dde6f2',
      fog: false,
      transparent: true,
      opacity: 0.22,
    });
    const moon = new THREE.Mesh(new THREE.CircleGeometry(24, 24), this.moonMat);
    moon.position.set(-620, 430, -400);
    moon.lookAt(0, 0, 0);
    this.group.add(moon);

    // ---------- luces (sol bajo cálido al atardecer) ----------
    this.hemi = new THREE.HemisphereLight('#4a4a58', '#1c1712', 0.75);
    this.sun = new THREE.DirectionalLight(this.duskSun.getHex(), 1.6);
    this.sun.position.copy(this.sunOffset);
    this.sun.castShadow = quality !== 'low';
    const shadowSize = quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    this.sun.shadow.camera.left = -42;
    this.sun.shadow.camera.right = 42;
    this.sun.shadow.camera.top = 42;
    this.sun.shadow.camera.bottom = -42;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 320;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.5;

    scene.add(this.group, this.hemi, this.sun, this.sun.target);
    this.applyTime(this.timeCurrent);
  }

  /** 0 = atardecer, 1 = noche cerrada (transición suave en update) */
  setNight(target: number): void {
    this.timeTarget = clamp(target, 0, 1);
  }

  /** luces largas: la niebla cede un 15% */
  setFogBoost(on: boolean): void {
    this.fogBoost = on;
    this.applyTime(this.timeCurrent);
  }

  /** muro de niebla temporal: multiplica la densidad (1 = normal) */
  setFogDensityScale(scale: number): void {
    this.fogDensityScale = scale;
    this.applyTime(this.timeCurrent);
  }

  /** relámpago: el cielo y las luces ambientales destellan */
  lightning(): void {
    this.flashTime = 0.16;
  }

  private applyTime(t: number): void {
    (this.skyMat.uniforms.topColor.value as THREE.Color).lerpColors(this.duskTop, this.nightTop, t);
    (this.skyMat.uniforms.horizonColor.value as THREE.Color).lerpColors(this.duskHorizon, this.nightHorizon, t);
    this.sceneFog.color.lerpColors(this.duskFog, this.nightFog, t);
    this.sceneFog.density = lerp(0.0044, 0.0052, t) * (this.fogBoost ? 0.85 : 1) * this.fogDensityScale;
    this.sun.intensity = lerp(1.6, 1.05, t);
    this.sun.color.lerpColors(this.duskSun, this.nightSun, t);
    this.hemi.intensity = lerp(0.75, 0.55, t);
    this.starsMat.opacity = lerp(0.12, 0.5, t);
    this.moonMat.opacity = lerp(0.22, 0.9, t);
  }

  /** altura del suelo: terreno plano en el MVP (solo variación de color) */
  heightAt(_x: number, _z: number): number {
    return 0;
  }

  /** proyección sobre la carretera (usa hint de la entidad para buscar en ventana) */
  project(x: number, z: number, hint: number): ProjectionResult {
    return this.curve.project(x, z, hint, 60);
  }

  /** sombra + audio + ciclo día/noche siguen al foco (jugador); villageFactor 0..1 */
  update(dt: number, focus: THREE.Vector3, windIntensity = 0.35, villageFactor = 0): void {
    this.sun.position.set(focus.x + this.sunOffset.x, this.sunOffset.y, focus.z + this.sunOffset.z);
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.sun.target.updateMatrixWorld();
    this.ambientAudio.update(dt, windIntensity, villageFactor);
    if (Math.abs(this.timeTarget - this.timeCurrent) > 0.0005 || this.timeApplied !== this.timeCurrent) {
      this.timeCurrent = damp(this.timeCurrent, this.timeTarget, 6, dt);
      if (Math.abs(this.timeTarget - this.timeCurrent) < 0.0005) this.timeCurrent = this.timeTarget;
      this.applyTime(this.timeCurrent);
      this.timeApplied = this.timeCurrent;
    }
    // relámpago
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      const pulse = Math.max(0, this.flashTime / 0.16) * (0.6 + Math.random() * 0.6);
      this.hemi.intensity = lerp(0.75, 0.55, this.timeCurrent) + pulse * 2.6;
      (this.skyMat.uniforms.horizonColor.value as THREE.Color)
        .lerpColors(this.duskHorizon, this.nightHorizon, this.timeCurrent)
        .lerp(new THREE.Color('#9aa8bd'), pulse * 0.7);
    }
  }
}
