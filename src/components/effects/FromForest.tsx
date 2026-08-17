import { useEffect, useRef } from 'react';
import type * as THREE from 'three';

interface Sway {
  phase: number;
  amp: number;
  speed: number;
}

interface Swayable {
  obj: THREE.Object3D;
  sway: Sway;
  ampScale: number;
}

interface CameraSettings {
  fov: number;
  startZ: number;
  dollyRange: number;
  dollySpeed: number;
  height: number;
  swayAmp: number;
  swaySpeed: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  mouseParallax: number;
}

interface FogSettings {
  density: number;
  color: string;
}

interface LightsSettings {
  ambientIntensity: number;
  hemisphereIntensity: number;
  moonIntensity: number;
}

interface ForestSettings {
  layers: number;
  treesPerLayer: number;
  treeScaleMin: number;
  treeScaleMax: number;
  swayAmp: number;
  swaySpeed: number;
}

interface RoadSettings {
  width: number;
  color: string;
}

interface FallenTreeSettings {
  posZ: number;
  rotY: number;
  scale: number;
  swayAmp: number;
}

interface PeopleSettings {
  count: number;
  scaleMin: number;
  scaleMax: number;
}

interface WindSettings {
  speed: number;
  amp: number;
}

interface Settings {
  seed: number;
  camera: CameraSettings;
  fog: FogSettings;
  lights: LightsSettings;
  forest: ForestSettings;
  road: RoadSettings;
  fallenTree: FallenTreeSettings;
  people: PeopleSettings;
  wind: WindSettings;
}

const SETTINGS: Settings = {
  seed: 1739,
  camera: {
    fov: 55,
    startZ: -8,
    dollyRange: 3,
    dollySpeed: 0.19,
    height: 3.4,
    swayAmp: 0.44,
    swaySpeed: 0.78,
    lookAtX: -0.15,
    lookAtY: 0.8,
    lookAtZ: 2.4,
    mouseParallax: 0.5,
  },
  fog: { density: 0.044, color: '#070805' },
  lights: {
    ambientIntensity: 11.6,
    hemisphereIntensity: 0.88,
    moonIntensity: 3.75,
  },
  forest: {
    layers: 3,
    treesPerLayer: 9,
    treeScaleMin: 0.7,
    treeScaleMax: 1.6,
    swayAmp: 0.03,
    swaySpeed: 1.2,
  },
  road: { width: 2.6, color: '#15150f' },
  fallenTree: { posZ: 0.2, rotY: -0.17, scale: 1.42, swayAmp: 0.015 },
  people: { count: 2, scaleMin: 1.12, scaleMax: 1.2 },
  wind: { speed: 1.15, amp: 1.2 },
};

const FOREST_BANDS = [
  [-13, -8],
  [-8, -3],
  [-3, 0.5],
];

const LAYER_STYLE = [
  { trunk: 0x0b0c09, canopy: 0x080907, scale: 0.75, swayScale: 0.2 },
  { trunk: 0x12140e, canopy: 0x0e110b, scale: 1.0, swayScale: 0.5 },
  { trunk: 0x1c1f15, canopy: 0x161a10, scale: 1.35, swayScale: 1 },
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function FromForest() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let threeMod: typeof THREE | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let timer: THREE.Timer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animationId = 0;
    let hasFadedIn = false;

    const swayables: Swayable[] = [];
    const mouseTarget = { x: 0, y: 0 };
    const mouseSmooth = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    void (async () => {
      const THREE = await import('three');
      if (disposed || !container.isConnected) return;
      threeMod = THREE;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(new THREE.Color(SETTINGS.fog.color), SETTINGS.fog.density);

      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);

      camera = new THREE.PerspectiveCamera(SETTINGS.camera.fov, w / h, 0.1, 60);
      camera.position.set(0, SETTINGS.camera.height, SETTINGS.camera.startZ);
      camera.lookAt(SETTINGS.camera.lookAtX, SETTINGS.camera.lookAtY, SETTINGS.camera.lookAtZ);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.appendChild(renderer.domElement);
      renderer.domElement.style.opacity = '0';
      renderer.domElement.style.transition = 'opacity 1s ease';

      const ambient = new THREE.AmbientLight(0x5a5442, SETTINGS.lights.ambientIntensity);
      scene.add(ambient);

      const hemisphere = new THREE.HemisphereLight(0x22333f, 0x0c0d0a, SETTINGS.lights.hemisphereIntensity);
      scene.add(hemisphere);

      const moon = new THREE.DirectionalLight(0x8899bb, SETTINGS.lights.moonIntensity);
      moon.position.set(6, 9, -4);
      scene.add(moon);

      const { world, swayableList } = buildScene(THREE, mulberry32(SETTINGS.seed));
      scene.add(world);
      swayables.push(...swayableList);

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) window.addEventListener('mousemove', onMouseMove);

      timer = new THREE.Timer();
      timer.connect(document);

      const animate = (timestamp?: number) => {
        animationId = requestAnimationFrame(animate);
        timer?.update(timestamp);

        if (!hasFadedIn) {
          hasFadedIn = true;
          renderer!.domElement.style.opacity = '1';
        }

        if (!reduceMotion) {
          const dt = timer!.getDelta();
          const t = timer!.getElapsed();
          const { camera: cam, forest, wind } = SETTINGS;

          mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * Math.min(1, dt * 2.5);
          mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * Math.min(1, dt * 2.5);

          const dolly = 0.5 + 0.5 * Math.sin(t * cam.dollySpeed);
          const camX = mouseSmooth.x * cam.mouseParallax + Math.sin(t * cam.swaySpeed * 0.8) * cam.swayAmp;
          const camY =
            cam.height +
            Math.cos(t * cam.swaySpeed * 0.6) * cam.swayAmp * 0.4 -
            mouseSmooth.y * cam.mouseParallax * 0.35;
          camera?.position.set(camX, camY, cam.startZ + cam.dollyRange * dolly);
          camera?.lookAt(cam.lookAtX, cam.lookAtY, cam.lookAtZ);

          for (const { obj, sway, ampScale } of swayables) {
            obj.rotation.x =
              Math.sin(t * sway.speed * forest.swaySpeed * wind.speed + sway.phase) * sway.amp * ampScale * wind.amp;
            obj.rotation.z =
              Math.cos(t * sway.speed * 0.85 * forest.swaySpeed * wind.speed + sway.phase * 1.3) *
              sway.amp *
              ampScale *
              wind.amp *
              0.7;
          }
        }

        if (renderer && scene && camera) renderer.render(scene, camera);
      };
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !camera) return;
        const cw = Math.max(container.clientWidth, 1);
        const ch = Math.max(container.clientHeight, 1);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        renderer.setSize(cw, ch);
      });
      resizeObserver.observe(container);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      resizeObserver?.disconnect();
      if (threeMod && scene) {
        scene.traverse((obj) => {
          if (obj instanceof threeMod!.Mesh) {
            obj.geometry.dispose();
            const material = obj.material;
            if (Array.isArray(material)) {
              for (const m of material) m.dispose();
            } else {
              material.dispose();
            }
          }
        });
      }
      timer?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none bg-bg"
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, rgba(136,153,187,0.14) 0%, rgba(7,8,5,0) 60%)',
      }}
    />
  );
}

function buildScene(
  THREE: typeof import('three'),
  rng: () => number,
): {
  world: THREE.Group;
  swayableList: Swayable[];
} {
  const world = new THREE.Group();
  const outSwayables: Swayable[] = [];

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 48),
    new THREE.MeshStandardMaterial({ color: 0x0b0c09, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  world.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(SETTINGS.road.width, 44),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(SETTINGS.road.color), roughness: 1 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.0;
  world.add(road);

  for (let layer = 0; layer < SETTINGS.forest.layers; layer++) {
    const style = LAYER_STYLE[layer % LAYER_STYLE.length];
    const [bandMin, bandMax] = FOREST_BANDS[layer % FOREST_BANDS.length];
    const trunkMat = new THREE.MeshStandardMaterial({ color: style.trunk, roughness: 1 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: style.canopy, roughness: 1 });

    for (const side of [-1, 1]) {
      for (let i = 0; i < SETTINGS.forest.treesPerLayer; i++) {
        const z = bandMin + (bandMax - bandMin) * rng();
        const x = side * (SETTINGS.road.width / 2 + 0.45 + rng() * 3.1);
        const scale =
          (SETTINGS.forest.treeScaleMin + rng() * (SETTINGS.forest.treeScaleMax - SETTINGS.forest.treeScaleMin)) *
          style.scale;

        const pine = buildPine(THREE, x, z, scale, trunkMat, canopyMat, {
          phase: rng() * Math.PI * 2,
          amp: SETTINGS.forest.swayAmp,
          speed: 0.7 + rng() * 0.9,
        });
        outSwayables.push({ obj: pine, sway: pine.userData.sway as Sway, ampScale: style.swayScale });
        world.add(pine);

        if (rng() < 0.35) {
          const shrub = buildShrub(
            THREE,
            x + (rng() - 0.5) * 1.6,
            z + (rng() - 0.5) * 1.4,
            0.4 + rng() * 0.4,
            canopyMat,
            {
              phase: rng() * Math.PI * 2,
              amp: SETTINGS.forest.swayAmp,
              speed: 0.8 + rng() * 0.8,
            },
          );
          outSwayables.push({ obj: shrub, sway: shrub.userData.sway as Sway, ampScale: style.swayScale });
          world.add(shrub);
        }
      }
    }
  }

  const fallenTree = buildFallenTree(THREE, rng);
  outSwayables.push({ obj: fallenTree, sway: fallenTree.userData.sway as Sway, ampScale: 0.5 });
  world.add(fallenTree);

  const poses: Array<'stand' | 'crouch'> = ['stand', 'crouch'];
  for (let i = 0; i < SETTINGS.people.count; i++) {
    const figure = buildFigure(THREE, rng, i, poses[i % poses.length]);
    outSwayables.push({ obj: figure, sway: figure.userData.sway as Sway, ampScale: 1 });
    world.add(figure);
  }

  return { world, swayableList: outSwayables };
}

function buildPine(
  THREE: typeof import('three'),
  x: number,
  z: number,
  s: number,
  trunkMat: THREE.Material,
  canopyMat: THREE.Material,
  sway: Sway,
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const trunkH = 0.9 * s;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.1 * s, trunkH, 5), trunkMat);
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const tiers = [
    { y: trunkH + 0.12 * s, r: 0.55 * s, h: 0.95 * s },
    { y: trunkH + 0.62 * s, r: 0.42 * s, h: 0.85 * s },
    { y: trunkH + 1.08 * s, r: 0.28 * s, h: 0.8 * s },
  ];
  for (const tier of tiers) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 6), canopyMat);
    cone.position.y = tier.y + tier.h / 2;
    group.add(cone);
  }

  group.userData.sway = sway;
  return group;
}

function buildShrub(
  THREE: typeof import('three'),
  x: number,
  z: number,
  s: number,
  material: THREE.Material,
  sway: Sway,
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * s, 0), material);
  shrub.scale.set(1, 0.7, 1);
  shrub.position.y = 0.18 * s;
  group.add(shrub);
  group.userData.sway = sway;
  return group;
}

function buildFallenTree(THREE: typeof import('three'), rng: () => number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 0, SETTINGS.fallenTree.posZ);
  group.rotation.y = SETTINGS.fallenTree.rotY;
  group.scale.setScalar(SETTINGS.fallenTree.scale);

  const mat = new THREE.MeshStandardMaterial({ color: 0x15130e, roughness: 1 });

  const start = new THREE.Vector3(-1.8, 0.17, 0);
  const end = new THREE.Vector3(1.8, 0.12, 0);
  group.add(cylinderBetween(THREE, start, end, 0.17, mat));

  const root = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat);
  root.position.set(-2.05, 0.18, 0);
  root.scale.set(1, 0.65, 1);
  group.add(root);

  const branchDefs = [
    { from: 0.25, to: [0.35, 0.95, -0.25], r: 0.05 },
    { from: 0.55, to: [-0.3, 0.75, 0.2], r: 0.045 },
    { from: 0.8, to: [0.25, 0.6, 0.3], r: 0.04 },
  ];
  for (const b of branchDefs) {
    const base = start.clone().lerp(end, b.from);
    const tip = base.clone().add(new THREE.Vector3(b.to[0], b.to[1], b.to[2]));
    group.add(cylinderBetween(THREE, base, tip, b.r, mat));
  }

  group.userData.sway = {
    phase: rng() * Math.PI * 2,
    amp: SETTINGS.fallenTree.swayAmp,
    speed: 0.6 + rng() * 0.4,
  } satisfies Sway;

  return group;
}

function buildFigure(
  THREE: typeof import('three'),
  rng: () => number,
  index: number,
  pose: 'stand' | 'crouch',
): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0c0d0a, roughness: 1 });

  if (pose === 'crouch') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 4, 8), mat);
    body.position.y = 0.52;
    body.rotation.x = -0.35;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
    head.position.y = 0.98;
    group.add(head);
  } else {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 4, 8), mat);
    body.position.y = 0.92;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
    head.position.y = 1.47;
    group.add(head);
  }

  const scale = SETTINGS.people.scaleMin + rng() * (SETTINGS.people.scaleMax - SETTINGS.people.scaleMin);
  group.scale.setScalar(scale);

  const spots = [
    { x: -1.5, z: 0.9 },
    { x: 1.4, z: -0.5 },
  ];
  const spot = spots[index % spots.length];
  group.position.set(spot.x + (rng() - 0.5) * 0.3, 0, SETTINGS.fallenTree.posZ + spot.z + (rng() - 0.5) * 0.3);
  group.rotation.y = Math.atan2(spot.x, spot.z) + (rng() - 0.5) * 0.4;

  group.userData.sway = {
    phase: rng() * Math.PI * 2,
    amp: 0.008,
    speed: 0.5 + rng() * 0.4,
  } satisfies Sway;

  return group;
}

function cylinderBetween(
  THREE: typeof import('three'),
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}
