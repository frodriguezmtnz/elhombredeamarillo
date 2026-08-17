import { useEffect, useRef } from 'react';
import type * as THREE from 'three';

interface CrowSettings {
  count: number;
  scaleMin: number;
  scaleMax: number;
  speedMin: number;
  speedMax: number;
  flapSpeed: number;
  flapAmp: number;
  altitudeMin: number;
  altitudeMax: number;
  depthMin: number;
  depthMax: number;
  driftX: number;
  bobAmp: number;
}

interface CameraSettings {
  fov: number;
  posX: number;
  posY: number;
  posZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
}

interface Settings {
  seed: number;
  camera: CameraSettings;
  crows: CrowSettings;
}

const SETTINGS: Settings = {
  seed: 373151527,
  camera: {
    fov: 66,
    posX: 3.4,
    posY: 4.6,
    posZ: -5.5,
    lookX: -2.3,
    lookY: 3,
    lookZ: 10.5,
  },
  crows: {
    count: 31,
    scaleMin: 1.1,
    scaleMax: 1.25,
    speedMin: 1.6,
    speedMax: 2.6,
    flapSpeed: 14,
    flapAmp: 0.5,
    altitudeMin: 6.2,
    altitudeMax: 7.3,
    depthMin: 2,
    depthMax: 9,
    driftX: 33,
    bobAmp: 0.45,
  },
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

function wrap(value: number, range: number): number {
  const span = range * 2;
  return ((((value + range) % span) + span) % span) - range;
}

export default function Crows() {
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

    const crows: THREE.Group[] = [];

    void (async () => {
      const THREE = await import('three');
      if (disposed || !container.isConnected) return;
      threeMod = THREE;

      scene = new THREE.Scene();

      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);

      camera = new THREE.PerspectiveCamera(SETTINGS.camera.fov, w / h, 0.1, 60);
      camera.position.set(SETTINGS.camera.posX, SETTINGS.camera.posY, SETTINGS.camera.posZ);
      camera.lookAt(SETTINGS.camera.lookX, SETTINGS.camera.lookY, SETTINGS.camera.lookZ);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.opacity = '0';
      renderer.domElement.style.transition = 'opacity 1s ease';
      container.appendChild(renderer.domElement);

      const material = new THREE.MeshBasicMaterial({ color: 0x0c0d0a });

      const world = new THREE.Group();
      scene.add(world);

      const rng = mulberry32(SETTINGS.seed);
      for (let i = 0; i < SETTINGS.crows.count; i++) {
        const { group, wingL, wingR } = buildCrow(THREE, material);

        const scale = SETTINGS.crows.scaleMin + rng() * (SETTINGS.crows.scaleMax - SETTINGS.crows.scaleMin);
        const speed = SETTINGS.crows.speedMin + rng() * (SETTINGS.crows.speedMax - SETTINGS.crows.speedMin);
        const altitude = SETTINGS.crows.altitudeMin + rng() * (SETTINGS.crows.altitudeMax - SETTINGS.crows.altitudeMin);
        const depth = SETTINGS.crows.depthMin + rng() * (SETTINGS.crows.depthMax - SETTINGS.crows.depthMin);
        const phase = rng() * Math.PI * 2;
        const xStart = -SETTINGS.crows.driftX + rng() * SETTINGS.crows.driftX * 2;
        const dir = rng() < 0.5 ? -1 : 1;

        group.scale.setScalar(scale);
        group.position.set(xStart, altitude, depth);
        if (dir === -1) group.rotation.y = Math.PI;

        group.userData = { phase, speed, altitude, xStart, dir, wingL, wingR };

        world.add(group);
        crows.push(group);
      }

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
          const t = timer!.getElapsed();

          for (const crow of crows) {
            const { phase, speed, altitude, xStart, dir, wingL, wingR } = crow.userData as {
              phase: number;
              speed: number;
              altitude: number;
              xStart: number;
              dir: number;
              wingL: THREE.Group;
              wingR: THREE.Group;
            };
            crow.position.x = wrap(xStart + t * speed * dir, SETTINGS.crows.driftX);
            crow.position.y = altitude + Math.sin(t * speed * 1.7 + phase) * SETTINGS.crows.bobAmp;

            const flap = Math.sin(t * SETTINGS.crows.flapSpeed + phase) * SETTINGS.crows.flapAmp;
            wingL.rotation.x = flap;
            wingR.rotation.x = flap;
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

function buildCrow(
  THREE: typeof import('three'),
  material: THREE.Material,
): {
  group: THREE.Group;
  wingL: THREE.Group;
  wingR: THREE.Group;
} {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.45, 6), material);
  body.rotation.z = -Math.PI / 2;
  group.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), material);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.32;
  group.add(tail);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 4), material);
  beak.rotation.z = -Math.PI / 2;
  beak.position.x = 0.26;
  group.add(beak);

  const wingGeo = new THREE.BoxGeometry(0.28, 0.02, 0.38);

  const wingL = new THREE.Group();
  const wingLMesh = new THREE.Mesh(wingGeo, material);
  wingLMesh.position.z = -0.19;
  wingL.add(wingLMesh);

  const wingR = new THREE.Group();
  const wingRMesh = new THREE.Mesh(wingGeo, material);
  wingRMesh.position.z = 0.19;
  wingR.add(wingRMesh);

  group.add(wingL);
  group.add(wingR);

  return { group, wingL, wingR };
}
