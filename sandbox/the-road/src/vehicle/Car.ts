import * as THREE from 'three';

/**
 * Car — ambulancia low-poly procedural (genérica, sin símbolos protegidos).
 * El grupo mira hacia +Z local (forward mundial = (sin θ, 0, cos θ)).
 * Chasis van: cabina frontal + módulo trasero alto, franja roja, góndola de
 * luces de emergencia rojo/azul con PointLights reales.
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
  /** luces de emergencia: strobes rojo/azul alternantes */
  setEmergencyLights(on: boolean): void;
  /** anima las strobes (llamar cada frame) */
  updateEmergency(dt: number): void;
  /** oculta cristales para la vista cockpit */
  setCabinVisible(visible: boolean): void;
}

const PAINT_COLOR = '#e8e6e0';

export function buildCar(): CarVisual {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: PAINT_COLOR, roughness: 0.5, metalness: 0.15 });
  const dark = new THREE.MeshStandardMaterial({ color: '#14161a', roughness: 0.6, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({
    color: '#0d1218',
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const redStripe = new THREE.MeshStandardMaterial({ color: '#a02622', roughness: 0.55 });

  // ---- chasis van: cabina frontal + módulo trasero alto ----
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 1.1), paint);
  cab.position.set(0, 0.87, 1.5);
  cab.castShadow = true;
  const module = new THREE.Mesh(new THREE.BoxGeometry(1.92, 1.5, 4.2), paint);
  module.position.set(0, 1.15, -1.15);
  module.castShadow = true;
  const moduleRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.08, 4.2),
    new THREE.MeshStandardMaterial({ color: '#c9c7c0', roughness: 0.7 }),
  );
  moduleRoof.position.set(0, 1.93, -1.15);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.3, 5.2), dark);
  skirt.position.set(0, 0.28, -0.2);

  // ---- nariz motor + parrilla ----
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.5, 1.0), paint);
  hood.position.set(0, 0.78, 2.35);
  hood.castShadow = true;
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 0.08), dark);
  grille.position.set(0, 0.74, 2.82);
  const noseStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 1.0), redStripe);
  noseStripe.position.set(0, 0.98, 2.35);

  // franja roja lateral (genérica, sin símbolos)
  for (const side of [-1, 1]) {
    const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 5.2), redStripe);
    sideStripe.position.set(side * 0.965, 1.02, -0.2);
    group.add(sideStripe);
  }

  // ---- guardabarros sobre las ruedas ----
  const fenderMaterial = new THREE.MeshStandardMaterial({ color: '#d9d7d0', roughness: 0.65 });
  for (const [fx, fz] of [
    [-0.9, 1.5],
    [0.9, 1.5],
    [-0.9, -1.75],
    [0.9, -1.75],
  ] as const) {
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 1.08), fenderMaterial);
    fender.position.set(fx, 0.95, fz);
    group.add(fender);
  }

  // ---- paneles embutidos laterales (cofres de equipo) ----
  for (const side of [-1, 1]) {
    const locker = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 1.2), fenderMaterial);
    locker.position.set(side * 0.97, 1.05, -2.2);
    group.add(locker);
  }

  // ---- cristales ----
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.5, 0.06), glass);
  windshield.position.set(0, 1.32, 2.06);
  windshield.rotation.x = -0.24;
  const cabRearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.05), glass);
  cabRearGlass.position.set(0, 1.3, 0.98);
  for (const side of [-1, 1]) {
    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.7), glass);
    doorGlass.position.set(side * 0.9, 1.3, 1.6);
    group.add(doorGlass);
    const moduleWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.55), glass);
    moduleWindow.position.set(side * 0.97, 1.55, -0.3);
    group.add(moduleWindow);
  }

  // ---- trasera con dos puertas y ventanillas ----
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.25, 0.06),
      new THREE.MeshStandardMaterial({ color: '#d9d7d0', roughness: 0.55 }),
    );
    door.position.set(side * 0.48, 1.15, -3.19);
    group.add(door);
    const doorWindow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.04), glass);
    doorWindow.position.set(side * 0.48, 1.66, -3.19);
    group.add(doorWindow);
  }

  // ---- detalles de techo: antena + extractor ----
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 1.3, 5),
    new THREE.MeshStandardMaterial({ color: '#1a1c20', roughness: 0.6 }),
  );
  antenna.position.set(0.85, 2.55, -2.9);
  antenna.rotation.z = -0.14;
  const extractor = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.24, 0.9),
    new THREE.MeshStandardMaterial({ color: '#b5b3ac', roughness: 0.7 }),
  );
  extractor.position.set(0, 2.08, -1.9);
  group.add(antenna, extractor);

  // ---- paragolpes ----
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.2, 0.24), dark);
  bumperF.position.set(0, 0.42, 2.82);
  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.2, 0.24), dark);
  bumperR.position.set(0, 0.42, -3.25);

  // ---- faros ----
  const lampOn = new THREE.MeshStandardMaterial({ color: '#d9e4f2', emissive: '#cfdcee', emissiveIntensity: 1.6 });
  for (const x of [-0.62, 0.62]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.06), lampOn);
    lamp.position.set(x, 0.7, 2.8);
    group.add(lamp);
  }
  const brakeLights = new THREE.MeshStandardMaterial({
    color: '#4a0d0d',
    emissive: '#ff2a1a',
    emissiveIntensity: 0.35,
  });
  for (const x of [-0.66, 0.66]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.06), brakeLights);
    tail.position.set(x, 0.62, -3.22);
    group.add(tail);
  }

  // ---- góndola de luces de emergencia (techo del módulo: el punto más alto) ----
  const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 0.34), dark);
  barBase.position.set(0, 2.02, -0.6);
  const redPodMat = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: '#ff2a2a', emissiveIntensity: 0.1 });
  const bluePodMat = new THREE.MeshStandardMaterial({ color: '#0d1e5a', emissive: '#2a52ff', emissiveIntensity: 0.1 });
  const redPod = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.3), redPodMat);
  redPod.position.set(0.42, 2.16, -0.6);
  const bluePod = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.3), bluePodMat);
  bluePod.position.set(-0.42, 2.16, -0.6);
  const redLight = new THREE.PointLight('#ff2626', 0, 30, 2);
  redLight.position.set(0.55, 2.35, -0.6);
  const blueLight = new THREE.PointLight('#2a52ff', 0, 30, 2);
  blueLight.position.set(-0.55, 2.35, -0.6);
  group.add(barBase, redPod, bluePod, redLight, blueLight);

  // ---- ruedas ----
  const wheelGeometry = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 10);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#101012', roughness: 0.95 });
  const wheels: THREE.Mesh[] = [];
  const frontWheels: THREE.Object3D[] = [];
  for (const [x, z, front] of [
    [-0.86, 1.5, 1],
    [0.86, 1.5, 1],
    [-0.86, -1.75, 0],
    [0.86, -1.75, 0],
  ] as const) {
    const holder = new THREE.Group();
    holder.position.set(x, 0.37, z);
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.castShadow = true;
    holder.add(wheel);
    group.add(holder);
    wheels.push(wheel);
    if (front) frontWheels.push(holder);
  }

  // ---- focos reales ----
  const headlights: THREE.SpotLight[] = [];
  for (const x of [-0.62, 0.62]) {
    const spot = new THREE.SpotLight('#e8f0fa', 90, 60, 0.46, 0.55, 1.6);
    spot.position.set(x, 0.7, 2.75);
    spot.target.position.set(x * 2.2, 0.1, 24);
    group.add(spot, spot.target);
    headlights.push(spot);
  }

  let highBeams = false;
  let lightsOn = true;
  let emergencyOn = false;
  let strobePhase = 0;

  group.add(cab, module, moduleRoof, skirt, hood, grille, noseStripe, windshield, cabRearGlass, bumperF, bumperR);

  const cabinParts: THREE.Mesh[] = [windshield, cabRearGlass];

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
    setEmergencyLights(on: boolean): void {
      emergencyOn = on;
      if (!on) {
        redPodMat.emissiveIntensity = 0.1;
        bluePodMat.emissiveIntensity = 0.1;
        redLight.intensity = 0;
        blueLight.intensity = 0;
      }
    },
    updateEmergency(dt: number): void {
      if (!emergencyOn) return;
      strobePhase += dt * 5;
      const redOn = Math.sin(strobePhase) > 0;
      // doble destello estilo strobe real
      const redBurst = redOn && Math.sin(strobePhase * 2.6) > -0.3;
      const blueBurst = !redOn && Math.sin(strobePhase * 2.6) > -0.3;
      redPodMat.emissiveIntensity = redBurst ? 3.2 : 0.1;
      bluePodMat.emissiveIntensity = blueBurst ? 3.2 : 0.1;
      redLight.intensity = redBurst ? 55 : 0;
      blueLight.intensity = blueBurst ? 55 : 0;
    },
    setCabinVisible(visible: boolean): void {
      for (const part of cabinParts) part.visible = visible;
    },
  };
}
