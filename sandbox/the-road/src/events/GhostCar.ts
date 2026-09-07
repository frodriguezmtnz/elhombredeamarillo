import * as THREE from 'three';
import type { RoadCurve } from '../world/RoadCurve';

/**
 * GhostCar — unos faros te adelantan a velocidad imposible
 * y, minutos después, el mismo coche está aparcado en la cuneta.
 */
export class GhostCar {
  readonly group = new THREE.Group();
  private readonly curve: RoadCurve;
  private state: 'idle' | 'drive' | 'parked' = 'idle';
  private s = 0;
  private speed = 0;
  private readonly spot: THREE.SpotLight;
  private passed = false;

  constructor(curve: RoadCurve) {
    this.curve = curve;
    const paint = new THREE.MeshStandardMaterial({ color: '#17191d', roughness: 0.5, metalness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({ color: '#0b0f13', roughness: 0.2, metalness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.52, 4.4), paint);
    body.position.y = 0.62;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.48, 2.2), paint);
    cabin.position.set(0, 1.12, -0.25);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.06), glass);
    windshield.position.set(0, 1.1, 0.92);
    windshield.rotation.x = -0.32;
    const lampMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#f2f7ff',
      emissiveIntensity: 3.5,
      fog: false,
    });
    for (const x of [-0.6, 0.6]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), lampMaterial);
      lamp.position.set(x, 0.68, 2.21);
      this.group.add(lamp);
    }
    this.spot = new THREE.SpotLight('#eaf2ff', 140, 80, 0.42, 0.5, 1.6);
    this.spot.position.set(0, 0.75, 2.1);
    this.spot.target.position.set(0, 0.1, 30);
    this.group.add(body, cabin, windshield, this.spot, this.spot.target);
    this.group.visible = false;
  }

  get visible(): boolean {
    return this.state !== 'idle';
  }

  /** arranca el adelantamiento 90m por detrás del jugador */
  start(playerS: number, playerSpeed: number): void {
    if (this.state !== 'idle') return;
    this.s = playerS - 90;
    this.speed = playerSpeed + 12;
    this.passed = false;
    this.state = 'drive';
    this.group.visible = true;
  }

  /** aparca el coche en la cuneta (tras el adelantamiento) */
  park(s: number, lateral: number): void {
    const pose = this.curve.at(s, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    this.group.position.set(pose.x + pose.nx * lateral, 0, pose.z + pose.nz * lateral);
    this.group.rotation.y = Math.atan2(pose.tx, pose.tz) + 0.35;
    this.spot.intensity = 0;
    this.state = 'parked';
    this.group.visible = true;
  }

  /** dt: avanza siguiendo la curva; devuelve 'passed' una vez al adelantar */
  update(dt: number, playerS: number, playerSpeed: number, playerPos: THREE.Vector3): 'passed' | null {
    if (this.state !== 'drive') return null;
    this.s += this.speed * dt;
    const pose = this.curve.at(this.s, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    this.group.position.set(pose.x + pose.nx * -1.9, 0, pose.z + pose.nz * -1.9);
    this.group.rotation.y = Math.atan2(pose.tx, pose.tz);
    // el haz ilumina hacia delante en coordenadas de mundo
    this.spot.target.position.set(this.group.position.x + pose.tx * 30, 0.1, this.group.position.z + pose.tz * 30);
    this.spot.target.updateMatrixWorld();

    const gap = this.s - playerS;
    if (!this.passed && gap > 3) {
      this.passed = true;
      return 'passed';
    }
    if (gap > 160) {
      this.state = 'idle';
      this.group.visible = false;
    }
    void playerSpeed;
    void playerPos;
    return null;
  }
}
