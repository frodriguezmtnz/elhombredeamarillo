import * as THREE from 'three';
import { controls } from '../core/ControlsConfig';
import type { InputManager } from '../core/InputManager';
import { clamp, damp, lerp, shortestAngle } from '../utils/MathUtils';
import type { CollisionSystem } from '../world/CollisionSystem';
import type { RoadCurve } from '../world/RoadCurve';
import type { CurvePose } from '../world/RoadCurve';
import { buildCar } from './Car';
import type { CarVisual } from './Car';

export interface CarInput {
  throttle: number; // 0..1 (W)
  brake: number; // 0..1 (S)
  steer: number; // -1..1 (A/D)
}

/**
 * CarController — conducción arcade (sin motor de física):
 * velocidad + dirección suavizadas, colisión circular triple, marcha atrás.
 */
export class CarController {
  readonly visual: CarVisual;
  readonly group: THREE.Group;
  readonly position = new THREE.Vector3();
  heading = 0;
  speed = 0;

  private steerSmooth = 0;
  private wheelSpin = 0;
  private impactCooldown = 0;
  /** proyección sobre la carretera (hint persistente) */
  roadHint = 0;
  lateral = 0;
  s = 0;
  offroad = 0;

  onImpact: ((strength: number) => void) | null = null;

  private readonly collisions: CollisionSystem;
  private readonly curve: RoadCurve;
  private readonly pose: CurvePose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  constructor(curve: RoadCurve, collisions: CollisionSystem, startS: number) {
    this.curve = curve;
    this.collisions = collisions;
    this.visual = buildCar();
    this.group = this.visual.group;
    curve.at(startS, this.pose);
    this.position.set(this.pose.x, 0, this.pose.z);
    this.heading = Math.atan2(this.pose.tx, this.pose.tz);
    this.roadHint = curve.sampleIndex(startS);
    this.syncGroup();
  }

  get forward(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  /** rellena un vector ajeno (sin allocaciones en el frame) */
  forwardInto(target: THREE.Vector3): THREE.Vector3 {
    return target.set(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  get speedRatio(): number {
    return Math.min(1, Math.abs(this.speed) / Math.max(1, controls.car.maxSpeed));
  }

  readInput(input: InputManager): CarInput {
    const throttle = input.actionDown('forward') ? 1 : 0;
    const braking = input.actionDown('back') ? 1 : 0;
    let steer = 0;
    if (input.actionDown('left')) steer += 1;
    if (input.actionDown('right')) steer -= 1;
    return { throttle, brake: braking, steer };
  }

  update(dt: number, carInput: CarInput): void {
    const tuning = controls.car;
    const maxSpeed = tuning.maxSpeed;
    const maxReverse = tuning.maxReverse;
    const { throttle, brake, steer } = carInput;

    // ---- longitudinal ----
    if (throttle > 0) {
      this.speed += tuning.accel * throttle * dt * (1 - this.speedRatio * 0.55);
    }
    if (brake > 0) {
      if (this.speed > 0.4) this.speed -= tuning.brake * dt;
      else this.speed = Math.max(-maxReverse, this.speed - 5.2 * dt); // marcha atrás
    }
    if (throttle === 0 && brake === 0) {
      this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), tuning.coast * dt);
    }
    // fuera de asfalto: tope de velocidad + arrastre proporcional al motor
    // (el motor SIEMPRE gana al terreno: atascarse es imposible, correr por el bosque también)
    const offroadCap = maxSpeed * lerp(1, 0.28, this.offroad);
    if (Math.abs(this.speed) > offroadCap) {
      const excess = Math.abs(this.speed) - offroadCap;
      this.speed -= Math.sign(this.speed) * Math.min(excess, (5 + this.offroad * 7) * dt);
    }
    this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), this.offroad * tuning.accel * 0.4 * dt);
    this.speed = clamp(this.speed, -maxReverse, maxSpeed);

    // ---- dirección ----
    this.steerSmooth = damp(this.steerSmooth, steer, tuning.steerLag, dt);
    const speedFactor = 1 - Math.min(0.62, Math.abs(this.speed) / 34);
    const turn = this.steerSmooth * speedFactor * tuning.turnRate;
    this.heading += turn * (this.speed / 2.6) * dt;

    // ---- integrar movimiento (forward = (sin h, cos h)) ----
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    this.position.x += fx * this.speed * dt;
    this.position.z += fz * this.speed * dt;

    // ---- colisiones: traslación de cuerpo entero (sin punto muerto) ----
    let hit = false;
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      const cfx = Math.sin(this.heading);
      const cfz = Math.cos(this.heading);
      for (const off of [1.5, 0, -1.5]) {
        const push = this.collisions.resolveVector(this.position.x + cfx * off, this.position.z + cfz * off, 0.95);
        if (push) {
          this.position.x += push.x;
          this.position.z += push.z;
          moved = true;
        }
      }
      if (!moved) break;
      hit = true;
    }
    if (hit) {
      if (this.impactCooldown <= 0) {
        this.impactCooldown = 0.5;
        const strength = Math.min(1, Math.abs(this.speed) / 12);
        this.speed *= 0.3;
        this.onImpact?.(strength);
      } else {
        this.speed *= 0.97;
      }
    }
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);

    // ---- proyección en carretera ----
    const projection = this.curve.project(this.position.x, this.position.z, this.roadHint);
    this.roadHint = projection.index;
    this.s = projection.s;
    this.lateral = projection.lateral;
    const absLat = Math.abs(projection.lateral);
    this.offroad = clamp((absLat - 3.4) / 2.6, 0, 1);

    // ---- visual ----
    this.syncGroup();
    this.wheelSpin += (this.speed / 0.34) * dt;
    for (const wheel of this.visual.wheels) wheel.rotation.x = this.wheelSpin;
    for (const holder of this.visual.frontWheels) holder.rotation.y = this.steerSmooth * 0.42;
    this.visual.brakeLights.emissiveIntensity = brake > 0 ? 2.4 : 0.35;
  }

  private syncGroup(): void {
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
  }

  /** apariencia de freno al soltar todo también frena un poco — no-op visual */
  applyIdleBrakeLight(on: boolean): void {
    this.visual.brakeLights.emissiveIntensity = on ? 2.4 : 0.35;
  }

  /** coloca el coche y lo detiene (spawn / reanudar partida) */
  placeAt(s: number, lateral: number): void {
    this.curve.at(s, this.pose);
    this.position.set(this.pose.x + this.pose.nx * lateral, 0, this.pose.z + this.pose.nz * lateral);
    this.heading = Math.atan2(this.pose.tx, this.pose.tz);
    this.speed = 0;
    this.roadHint = this.curve.sampleIndex(s);
    this.syncGroup();
  }

  /** ángulo mundial hacia el que mira (para cámaras) */
  get yaw(): number {
    return this.heading;
  }

  /** difiere del heading en π si miramos hacia atrás */
  angleTo(targetX: number, targetZ: number): number {
    return shortestAngle(this.heading, Math.atan2(targetX - this.position.x, targetZ - this.position.z));
  }
}
