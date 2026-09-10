export type ActionKey = 'forward' | 'back' | 'left' | 'right' | 'run' | 'interact';

/** Mapa de acciones → códigos físicos (rebinding completo llega en una fase posterior). */
const ACTION_CODES: Record<ActionKey, string[]> = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  interact: ['KeyE'],
};

export const DEBUG_CODE = 'F3';

/**
 * Teclado + ratón con Pointer Lock. Consultas por ACCIÓN (actionDown/actionPressed) o por
 * código físico (down/pressed, p.ej. 'Escape'). consumeMouseDelta acumula el movimiento del ratón.
 */
export class InputManager {
  private downKeys = new Set<string>();
  private pressedKeys = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;

  locked = false;
  onLockChange: ((locked: boolean) => void) | null = null;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    this.downKeys.add(event.code);
    this.pressedKeys.add(event.code);
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

  private handlePointerLockChange = (): void => {
    this.locked = document.pointerLockElement === this.canvas;
    this.onLockChange?.(this.locked);
  };

  requestLock(): void {
    this.canvas.requestPointerLock({ unadjustedMovement: false }).catch(() => {
      window.setTimeout(() => {
        this.canvas.requestPointerLock({ unadjustedMovement: false }).catch(() => {
          /* el jugador puede volver a hacer clic en la escena */
        });
      }, 1500);
    });
  }

  releaseLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  down(code: string): boolean {
    return this.downKeys.has(code);
  }

  pressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  actionDown(action: ActionKey): boolean {
    return ACTION_CODES[action].some((code) => this.downKeys.has(code));
  }

  actionPressed(action: ActionKey): boolean {
    return ACTION_CODES[action].some((code) => this.pressedKeys.has(code));
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const result = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return result;
  }

  /** al FINAL de cada frame: limpia los bordes de pulsación */
  endFrame(): void {
    this.pressedKeys.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
