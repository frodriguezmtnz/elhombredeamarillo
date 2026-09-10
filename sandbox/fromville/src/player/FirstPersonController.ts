import * as THREE from 'three';
import { DEBUG_CODE, type InputManager } from '../core/InputManager';
import type { Settings } from '../core/Settings';
import { clamp, damp } from '../utils/MathUtils';
import type { CollisionSystem } from '../world/CollisionSystem';

export interface GroundProvider {
  heightAt(x: number, z: number): number;
}

/**
 * FirstPersonController — mouse look (Pointer Lock) + WASD + sprint + gravedad simple +
 * colisión circular contra el mundo. Mueve la cámara directamente (rig implícito) con head-bob.
 * El sprint existe ya, pero su CASTIGO (ruido que atrae criaturas) llega con la IA (Fase 8).
 */
export class FirstPersonController {
  readonly position = new THREE.Vector3();
  private velocityY = 0;
  private yaw = 0;
  private pitch = 0;
  private bobPhase = 0;
  private grounded = true;

  readonly eyeHeight = 1.68;
  readonly radius = 0.38;
  walkSpeed = 5.6;
  runSpeed = 9.2;
  sprinting = false;

  onFootstep: ((running: boolean) => void) | null = null;

  private readonly camera: THREE.PerspectiveCamera;
  private readonly input: InputManager;
  private readonly settings: Settings;
  private readonly collisions: CollisionSystem;
  private readonly ground: GroundProvider;
  private readonly forward = new THREE.Vector3();

  constructor(
    camera: THREE.PerspectiveCamera,
    input: InputManager,
    settings: Settings,
    collisions: CollisionSystem,
    ground: GroundProvider,
  ) {
    this.camera = camera;
    this.input = input;
    this.settings = settings;
    this.collisions = collisions;
    this.ground = ground;
    this.camera.rotation.order = 'YXZ';
  }

  get debugCode(): string {
    return DEBUG_CODE;
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
    this.syncCamera(0);
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

    // ---- head bob + pasos ----
    const planarSpeed = Math.hypot(targetVX, targetVZ);
    let bobOffset = 0;
    if (this.grounded && planarSpeed > 0.1) {
      const previous = this.bobPhase;
      this.bobPhase += dt * (this.sprinting ? 11.5 : 7.6);
      bobOffset = Math.sin(this.bobPhase) * (this.sprinting ? 0.045 : 0.028);
      if (Math.floor(previous / Math.PI) !== Math.floor(this.bobPhase / Math.PI)) {
        this.onFootstep?.(this.sprinting);
      }
    } else {
      this.bobPhase = damp(this.bobPhase, Math.round(this.bobPhase / Math.PI) * Math.PI, 0.08, dt);
    }

    this.syncCamera(bobOffset);
  }

  private syncCamera(bob: number): void {
    this.camera.position.set(this.position.x, this.position.y + bob, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
