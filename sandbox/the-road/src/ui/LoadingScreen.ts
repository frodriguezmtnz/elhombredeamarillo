/** Pantalla de carga con progreso real. */
export class LoadingScreen {
  private element: HTMLElement;
  private bar: HTMLElement;
  private status: HTMLElement;

  constructor(root: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'loading';
    this.element.innerHTML = `
      <div class="title">THE ROAD</div>
      <div class="bar"><div></div></div>
      <div class="status">Loading...</div>
    `;
    root.appendChild(this.element);
    this.bar = this.element.querySelector('.bar > div') as HTMLElement;
    this.status = this.element.querySelector('.status') as HTMLElement;
  }

  progress(value: number, label?: string): void {
    this.bar.style.width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
    if (label) this.status.textContent = label;
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  show(label?: string): void {
    this.element.style.display = 'flex';
    this.progress(0, label ?? 'Loading...');
  }
}
