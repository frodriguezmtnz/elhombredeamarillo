/**
 * teclado + ratón (Pointer Lock API).
 * - actionDown()/actionPressed(): consultas por ACCIÓN (rebinding via ControlsConfig)
 * - down()/pressed(): consultas por código físico (casos especiales)
 * - consumeMouseDelta(): delta de ratón acumulado (mira)
 */
import { controls } from './ControlsConfig';
import type { ActionKey } from './ControlsConfig';

export class InputManager {
  private downKeys = new Set<string>();
  private pressedKeys = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private wheelDelta = 0;

  locked = false;
  onLockChange: ((locked: boolean) => void) | null = null;
  /** mientras es true, las teclas de juego no capturan (p.ej. menús con foco) */
  uiFocus = false;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    canvas.addEventListener('wheel', this.handleWheel, { passive: true });
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (!this.uiFocus || event.code === 'Escape' || event.code === controls.code('debug')) {
      this.downKeys.add(event.code);
      this.pressedKeys.add(event.code);
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.downKeys.delete(event.code);
  };

  private handleBlur = (): void => {
    this.downKeys.clear();
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.locked) return;
    this.mouseDX += event.movementX;
    this.mouseDY += event.movementY;
  };

  private handleWheel = (event: WheelEvent): void => {
    this.wheelDelta = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : this.wheelDelta;
  };

  private handlePointerLockChange = (): void => {
    this.locked = document.pointerLockElement === this.canvas;
    this.onLockChange?.(this.locked);
  };

  requestLock(): void {
    this.canvas.requestPointerLock({ unadjustedMovement: false }).catch(() => {
      // cooldown del navegador (~1.25s tras soltar con ESC): reintentar una vez
      window.setTimeout(() => {
        this.canvas.requestPointerLock({ unadjustedMovement: false }).catch(() => {
          /* el jugador puede hacer click en el canvas (hint visible) */
        });
      }, 1500);
    });
  }

  releaseLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  down(code: string): boolean {
    return !this.uiFocus && this.downKeys.has(code);
  }

  pressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  /** tecla asignada a una acción está pulsada */
  actionDown(action: ActionKey): boolean {
    return this.down(controls.code(action));
  }

  /** tecla asignada a una acción se ha pulsado este frame */
  actionPressed(action: ActionKey): boolean {
    return this.pressed(controls.code(action));
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const result = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return result;
  }

  consumeWheel(): number {
    const wheel = this.wheelDelta;
    this.wheelDelta = 0;
    return wheel;
  }

  /** se llama al FINAL de cada frame: limpia los bordes de pulsación */
  endFrame(): void {
    this.pressedKeys.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }
}
