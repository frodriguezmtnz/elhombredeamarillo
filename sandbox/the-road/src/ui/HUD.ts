/** HUD mínimo: prompt de interacción, subtítulos, narración y click-hint. */
export class HUD {
  private readonly root: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly captionEl: HTMLElement;
  private readonly narrationEl: HTMLElement;
  private readonly clickHint: HTMLElement;
  private captionTimer = 0;
  private narrationTimer = 0;

  constructor(root: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div id="interact-prompt"><span class="key">E</span><span class="label"></span></div>
      <div id="caption"></div>
      <div id="narration"></div>
      <div id="click-hint">Click to look around</div>
    `;
    root.appendChild(this.root);
    this.prompt = this.root.querySelector('#interact-prompt') as HTMLElement;
    this.captionEl = this.root.querySelector('#caption') as HTMLElement;
    this.narrationEl = this.root.querySelector('#narration') as HTMLElement;
    this.clickHint = this.root.querySelector('#click-hint') as HTMLElement;
  }

  showPrompt(label: string): void {
    const labelEl = this.prompt.querySelector('.label') as HTMLElement;
    if (labelEl.textContent !== label) labelEl.textContent = label;
    this.prompt.classList.add('show');
  }

  hidePrompt(): void {
    this.prompt.classList.remove('show');
  }

  caption(text: string, seconds = 3.6): void {
    this.captionEl.textContent = text;
    this.captionEl.classList.add('show');
    this.captionTimer = seconds;
  }

  narration(text: string, seconds = 4.2): void {
    this.narrationEl.textContent = text;
    this.narrationEl.classList.add('show');
    this.narrationTimer = seconds;
  }

  setClickHint(visible: boolean): void {
    this.clickHint.classList.toggle('show', visible);
  }

  update(dt: number): void {
    if (this.captionTimer > 0) {
      this.captionTimer -= dt;
      if (this.captionTimer <= 0) this.captionEl.classList.remove('show');
    }
    if (this.narrationTimer > 0) {
      this.narrationTimer -= dt;
      if (this.narrationTimer <= 0) this.narrationEl.classList.remove('show');
    }
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? 'block' : 'none';
  }
}
