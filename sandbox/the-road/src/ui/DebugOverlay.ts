/** Overlay de depuración (F3). Nunca visible en producción salvo activación manual. */
export class DebugOverlay {
  private element: HTMLElement;
  private lines: string[] = [];
  private accumulator = 0;
  visible = false;

  constructor(root: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'debug';
    root.appendChild(this.element);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.classList.toggle('on', this.visible);
  }

  setLine(index: number, text: string): void {
    this.lines[index] = text;
  }

  update(dt: number): void {
    if (!this.visible) return;
    this.accumulator += dt;
    if (this.accumulator < 0.25) return;
    this.accumulator = 0;
    this.element.textContent = this.lines.filter((line) => line !== undefined).join('\n');
  }
}
