import { useEffect, useRef } from 'react';
import type * as THREE from 'three';

interface Sway {
  phase: number;
  amp: number;
  speed: number;
}

interface Settings {
  seed: number;
  fov: number;
  cameraDistance: number;
  cameraHeight: number;
  lookAtY: number;
  orbitSpeed: number;
  offsetX: number;
  fogDensity: number;
  ambientIntensity: number;
  hemisphereIntensity: number;
  moonIntensity: number;
  warmIntensity: number;
  holeIntensity: number;
  branchCount: number;
  swayAmp: number;
  swaySpeed: number;
}

const SETTINGS: Settings = {
  seed: 1337,
  fov: 57,
  cameraDistance: 7.7,
  cameraHeight: 5.3,
  lookAtY: 3.1,
  orbitSpeed: 0.27,
  offsetX: 0.5,
  fogDensity: 0.062,
  ambientIntensity: 17.8,
  hemisphereIntensity: 0.75,
  moonIntensity: 3.75,
  warmIntensity: 39.5,
  holeIntensity: 16.5,
  branchCount: 8,
  swayAmp: 2,
  swaySpeed: 1.8,
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function BottleTree() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let threeMod: typeof THREE | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let warmLight: THREE.PointLight | null = null;
    let holeLight: THREE.PointLight | null = null;
    let timer: THREE.Timer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animationId = 0;
    let cameraAngle = Math.PI * 0.2;

    const bottles: THREE.Group[] = [];

    void (async () => {
      const THREE = await import('three');
      if (disposed || !container.isConnected) return;
      threeMod = THREE;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070805, SETTINGS.fogDensity);

      camera = new THREE.PerspectiveCamera(SETTINGS.fov, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(
        Math.sin(cameraAngle) * SETTINGS.cameraDistance + SETTINGS.offsetX,
        SETTINGS.cameraHeight,
        Math.cos(cameraAngle) * SETTINGS.cameraDistance,
      );
      camera.lookAt(SETTINGS.offsetX, SETTINGS.lookAtY, 0);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0x5a5442, SETTINGS.ambientIntensity);
      scene.add(ambient);

      const hemisphere = new THREE.HemisphereLight(0x887766, 0x0c0d0a, SETTINGS.hemisphereIntensity);
      scene.add(hemisphere);

      const moon = new THREE.DirectionalLight(0x8899bb, SETTINGS.moonIntensity);
      moon.position.set(4, 7, -3);
      scene.add(moon);

      warmLight = new THREE.PointLight(0xf4c943, SETTINGS.warmIntensity, 15, 2);
      warmLight.position.set(0.6, 2.4, 1.6);
      scene.add(warmLight);

      const root = new THREE.Group();
      root.position.x = SETTINGS.offsetX;
      scene.add(root);

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(20, 48),
        new THREE.MeshStandardMaterial({ color: 0x0b0c09, roughness: 1 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.01;
      root.add(ground);

      const rng = mulberry32(SETTINGS.seed);
      const { group: tree, holeLight: buildHoleLight } = buildTree(THREE, bottles, rng);
      holeLight = buildHoleLight;
      root.add(tree);

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      timer = new THREE.Timer();
      timer.connect(document);

      const animate = (timestamp?: number) => {
        animationId = requestAnimationFrame(animate);
        timer?.update(timestamp);
        if (!reduceMotion) {
          const dt = timer!.getDelta();
          const t = timer!.getElapsed();

          for (const bottle of bottles) {
            const sway = bottle.userData.sway as Sway;
            bottle.rotation.x =
              Math.sin(t * sway.speed * SETTINGS.swaySpeed + sway.phase) * sway.amp * SETTINGS.swayAmp;
            bottle.rotation.z =
              Math.cos(t * sway.speed * 0.85 * SETTINGS.swaySpeed + sway.phase * 1.4) * sway.amp * SETTINGS.swayAmp;
          }

          cameraAngle += dt * SETTINGS.orbitSpeed;
          camera?.position.set(
            Math.sin(cameraAngle) * SETTINGS.cameraDistance + SETTINGS.offsetX,
            SETTINGS.cameraHeight,
            Math.cos(cameraAngle) * SETTINGS.cameraDistance,
          );
          camera?.lookAt(SETTINGS.offsetX, SETTINGS.lookAtY, 0);

          if (warmLight) warmLight.intensity = SETTINGS.warmIntensity + Math.sin(t * 0.5) * 8;
          if (holeLight) holeLight.intensity = SETTINGS.holeIntensity + Math.sin(t * 0.8) * 3;
        }
        if (renderer && scene && camera) renderer.render(scene, camera);
      };
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
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

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none" />;
}

function buildTree(
  THREE: typeof import('three'),
  bottles: THREE.Group[],
  rng: () => number,
): { group: THREE.Group; holeLight: THREE.PointLight } {
  const group = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x2b2015, roughness: 0.95, metalness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 0.9 });

  const trunkSegments = [
    { y: 0.9, r: 0.42, h: 1.9, rx: 0.02, rz: 0.03 },
    { y: 2.12, r: 0.33, h: 0.5, rx: 0.03, rz: -0.02 },
    { y: 3.0, r: 0.27, h: 0.55, rx: -0.02, rz: 0.04 },
    { y: 3.85, r: 0.21, h: 1.25, rx: 0.04, rz: -0.03 },
    { y: 4.75, r: 0.16, h: 1.2, rx: 0.05, rz: -0.04 },
  ];
  for (const seg of trunkSegments) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(seg.r * 0.85, seg.r, seg.h, 10), barkMat);
    mesh.position.y = seg.y;
    mesh.rotation.x = seg.rx;
    mesh.rotation.z = seg.rz;
    group.add(mesh);
  }

  const holeY = 2.62;
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.55, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0a0906, roughness: 1, side: THREE.DoubleSide }),
  );
  tunnel.position.y = holeY;
  group.add(tunnel);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 10, 24), rimMat);
  rim.position.y = holeY;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const holeLight = new THREE.PointLight(0xf4c943, SETTINGS.holeIntensity, 4, 2);
  holeLight.position.set(0.25, holeY, 0.35);
  group.add(holeLight);

  const branchCount = SETTINGS.branchCount;
  for (let i = 0; i < branchCount; i++) {
    const attachY = 1.7 + (i / branchCount) * 2.6;
    const angle = (i / branchCount) * Math.PI * 2 + (i % 2 ? 0.35 : -0.25);
    const tiltUp = 0.3 + rng() * 0.45;
    const len = 1.15 + rng() * 0.9;

    const start = new THREE.Vector3(0, attachY, 0);
    const end = new THREE.Vector3(
      Math.sin(angle) * Math.cos(tiltUp) * len,
      attachY + Math.sin(tiltUp) * len,
      Math.cos(angle) * Math.cos(tiltUp) * len,
    );

    group.add(cylinderBetween(THREE, start, end, 0.055, barkMat));

    if (i % 2 === 0) {
      const subStart = start.clone().lerp(end, 0.7);
      const subEnd = subStart.clone().addScaledVector(new THREE.Vector3(0.3, 1, 0).normalize(), 0.55);
      group.add(cylinderBetween(THREE, subStart, subEnd, 0.032, barkMat));
    }

    const attach = end.clone();
    attach.y += 0.05;
    const bottle = createBottle(THREE, attach, rng);
    bottles.push(bottle);
    group.add(bottle);
  }

  return { group, holeLight };
}

function createBottle(THREE: typeof import('three'), attach: THREE.Vector3, rng: () => number): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(attach);

  const ropeLen = 0.65 + rng() * 0.5;
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, ropeLen, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1c12, roughness: 0.8 }),
  );
  rope.position.y = -ropeLen / 2;
  group.add(rope);

  const palette = [0x2f6b43, 0x8a6a2f, 0x3a5f7a, 0x6b3a3a, 0x4f6b2f, 0x7a5a4a];
  const color = palette[Math.floor(rng() * palette.length)];

  const glassMat = new THREE.MeshPhongMaterial({
    color,
    specular: 0xcbbf9a,
    shininess: 110,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 12), glassMat);
  body.position.y = -(ropeLen + 0.35);
  group.add(body);

  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.15, 0.32, 12), glassMat);
  shoulder.position.y = -(ropeLen + 0.85);
  group.add(shoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 10), glassMat);
  neck.position.y = -(ropeLen + 1.14);
  group.add(neck);

  group.userData.sway = {
    phase: rng() * Math.PI * 2,
    amp: 0.035 + rng() * 0.06,
    speed: 0.7 + rng() * 0.9,
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
