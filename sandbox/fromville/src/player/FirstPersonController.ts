import * as THREE from 'three';
import type { FirstPersonCamera } from '../camera/FirstPersonCamera';
import type { InputManager } from '../core/InputManager';
import type { Settings } from '../core/Settings';
import { clamp, damp } from '../utils/MathUtils';
import type { CollisionSystem } from '../world/CollisionSystem';

export interface GroundProvider {
  heightAt(x: number, z: number): number;
}

/**
 * FirstPersonController — lógica de cuerpo: mouse look (Pointer Lock) + WASD + sprint + gravedad +
 * colisión circular. La representación visual (FOV, head-bob, roll) vive en FirstPersonCamera.
 * El sprint ya existe; su castigo (ruido que atrae criaturas) llega con la IA (Fase 8).
 */
export class FirstPersonController {
  readonly position = new THREE.Vector3();
  private velocityY = 0;
  private yaw = 0;
  private pitch = 0;
  private stepPhase = 0;
  private grounded = true;

  readonly eyeHeight = 1.68;
  readonly radius = 0.38;
  walkSpeed = 5.6;
  runSpeed = 9.2;
  sprinting = false;

  onFootstep: ((running: boolean) => void) | null = null;

  private readonly view: FirstPersonCamera;
  private readonly input: InputManager;
  private readonly settings: Settings;
  private readonly collisions: CollisionSystem;
  private readonly ground: GroundProvider;
  private readonly forward = new THREE.Vector3();

  constructor(
    view: FirstPersonCamera,
    input: InputManager,
    settings: Settings,
    collisions: CollisionSystem,
    ground: GroundProvider,
  ) {
    this.view = view;
    this.input = input;
    this.settings = settings;
    this.collisions = collisions;
    this.ground = ground;
  }

  get lookDirection(): THREE.Vector3 {
    return this.forward.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
  }

  teleport(x: number, z: number, yaw: number): void {
    this.position.set(x, this.ground.heightAt(x, z) + this.eyeHeight, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.velocityY = 0;
    this.view.resetBob();
    this.view.applyTo(this.position, this.yaw, this.pitch);
  }

  update(dt: number): void {
    // ---- mirar ----
    const sensitivity = this.settings.get().sensitivity * 0.0021;
    const { dx, dy } = this.input.consumeMouseDelta();
    if (this.input.locked && (dx !== 0 || dy !== 0)) {
      this.yaw -= dx * sensitivity;
      this.pitch = clamp(this.pitch - dy * sensitivity, -1.45, 1.45);
    }

    // ---- mover ----
    let moveX = 0;
    let moveZ = 0;
    if (this.input.actionDown('forward')) moveZ -= 1;
    if (this.input.actionDown('back')) moveZ += 1;
    if (this.input.actionDown('left')) moveX -= 1;
    if (this.input.actionDown('right')) moveX += 1;
    this.sprinting = this.input.actionDown('run') && (moveX !== 0 || moveZ !== 0);
    const speed = this.sprinting ? this.runSpeed : this.walkSpeed;

    let targetVX = 0;
    let targetVZ = 0;
    if (moveX !== 0 || moveZ !== 0) {
      const invLen = 1 / Math.hypot(moveX, moveZ);
      moveX *= invLen;
      moveZ *= invLen;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      targetVX = (moveX * cos + moveZ * sin) * speed;
      targetVZ = (moveZ * cos - moveX * sin) * speed;
    }

    const pos2D = { x: this.position.x, z: this.position.z };
    const smoothing = this.sprinting ? 0.09 : 0.13;
    pos2D.x = damp(pos2D.x, pos2D.x + targetVX * dt, smoothing, dt);
    pos2D.z = damp(pos2D.z, pos2D.z + targetVZ * dt, smoothing, dt);

    this.collisions.resolve(pos2D, this.radius);
    this.position.x = pos2D.x;
    this.position.z = pos2D.z;

    // ---- gravedad / suelo ----
    const groundY = this.ground.heightAt(this.position.x, this.position.z) + this.eyeHeight;
    this.velocityY -= 22 * dt;
    this.position.y += this.velocityY * dt;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // ---- pasos + modificadores de cámara ----
    const planarSpeed = Math.hypot(targetVX, targetVZ);
    const speed01 = clamp(planarSpeed / this.runSpeed, 0, 1);
    if (this.grounded && planarSpeed > 0.1) {
      const previous = this.stepPhase;
      this.stepPhase += dt * (this.sprinting ? 11.5 : 7.6);
      if (Math.floor(previous / Math.PI) !== Math.floor(this.stepPhase / Math.PI)) {
        this.onFootstep?.(this.sprinting);
      }
    }

    this.view.update(dt, { speed01, sprinting: this.sprinting });
    this.view.applyTo(this.position, this.yaw, this.pitch);
  }
}
