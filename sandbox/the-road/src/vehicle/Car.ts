import * as THREE from 'three';

/**
 * Car — vehículo low-poly procedural (familiar desgastado, genérico y original).
 * El grupo mira hacia +Z local (forward mundial = (sin θ, 0, cos θ)).
 */
export interface CarVisual {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheels: THREE.Object3D[];
  headlights: THREE.SpotLight[];
  brakeLights: THREE.MeshStandardMaterial;
  setHeadlights(on: boolean): void;
  /** luces largas: más intensidad, alcance y cono estrecho */
  setHighBeams(on: boolean): void;
  /** oculta techo/cristales para la vista cockpit */
  setCabinVisible(visible: boolean): void;
}

const BODY_COLOR = '#8e9aa4';
const BODY_ROUGH = 0.5;

export function buildCar(): CarVisual {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: BODY_COLOR, roughness: BODY_ROUGH, metalness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#14161a', roughness: 0.6, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({
    color: '#0d1218',
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  // carrocería
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.52, 4.35), paint);
  body.position.y = 0.62;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.5, 2.25), paint);
  cabin.position.set(0, 1.12, -0.25);
  cabin.castShadow = true;
  // parabrisas y lunas
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.44, 0.06), glass);
  windshield.position.set(0, 1.1, 0.92);
  windshield.rotation.x = -0.32;
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.06), glass);
  rearWindow.position.set(0, 1.08, -1.4);
  rearWindow.rotation.x = 0.42;
  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.34, 1.9), glass);
  sideGlass.position.set(0, 1.16, -0.28);

  // paragolpes + parrilla
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 0.22), dark);
  bumperF.position.set(0, 0.42, 2.2);
  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 0.22), dark);
  bumperR.position.set(0, 0.42, -2.2);

  // faros (emisivos) + luces de freno
  const lampOn = new THREE.MeshStandardMaterial({ color: '#d9e4f2', emissive: '#cfdcee', emissiveIntensity: 1.6 });
  const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), lampOn);
  lampL.position.set(-0.6, 0.68, 2.18);
  const lampR = lampL.clone();
  lampR.position.x = 0.6;
  const brakeLights = new THREE.MeshStandardMaterial({
    color: '#4a0d0d',
    emissive: '#ff2a1a',
    emissiveIntensity: 0.35,
  });
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.13, 0.06), brakeLights);
  tailL.position.set(-0.62, 0.68, -2.18);
  const tailR = tailL.clone();
  tailR.position.x = 0.62;

  // ruedas
  const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#101012', roughness: 0.95 });
  const wheels: THREE.Mesh[] = [];
  const frontWheels: THREE.Object3D[] = [];
  for (const [x, z, front] of [
    [-0.82, 1.42, 1],
    [0.82, 1.42, 1],
    [-0.82, -1.45, 0],
    [0.82, -1.45, 0],
  ] as const) {
    const holder = new THREE.Group();
    holder.position.set(x, 0.34, z);
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.castShadow = true;
    holder.add(wheel);
    group.add(holder);
    wheels.push(wheel);
    if (front) frontWheels.push(holder);
  }

  // focos reales (2 spotlights sin sombra: baratos)
  const headlights: THREE.SpotLight[] = [];
  for (const x of [-0.6, 0.6]) {
    const spot = new THREE.SpotLight('#e8f0fa', 90, 60, 0.46, 0.55, 1.6);
    spot.position.set(x, 0.7, 2.1);
    spot.target.position.set(x * 2.2, 0.1, 24);
    group.add(spot, spot.target);
    headlights.push(spot);
  }

  let highBeams = false;
  let lightsOn = true;

  group.add(body, cabin, windshield, rearWindow, sideGlass, bumperF, bumperR, lampL, lampR, tailL, tailR);

  // en vista cockpit se ocultan techo y cristales (cámara elevada sobre el capó)
  const cabinParts: THREE.Mesh[] = [cabin, sideGlass, windshield, rearWindow];

  return {
    group,
    wheels,
    frontWheels,
    headlights,
    brakeLights,
    setHeadlights(on: boolean): void {
      lightsOn = on;
      for (const spot of headlights) spot.intensity = on ? (highBeams ? 170 : 90) : 0;
      lampOn.emissiveIntensity = on ? (highBeams ? 2.4 : 1.6) : 0.12;
    },
    setHighBeams(on: boolean): void {
      highBeams = on;
      for (const spot of headlights) {
        spot.angle = on ? 0.3 : 0.46;
        spot.distance = on ? 95 : 60;
        spot.penumbra = on ? 0.42 : 0.55;
        spot.intensity = lightsOn ? (on ? 170 : 90) : 0;
      }
      lampOn.emissiveIntensity = lightsOn ? (on ? 2.4 : 1.6) : 0.12;
    },
    setCabinVisible(visible: boolean): void {
      for (const part of cabinParts) part.visible = visible;
    },
  };
}
