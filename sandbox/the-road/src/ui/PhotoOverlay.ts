/**
 * PhotoOverlay — la fotografía dibujada por código (sin assets):
 * una carretera forestal, un coche aparcado... y en la segunda vista,
 * una figura que antes no estaba.
 */
import { controls } from '../core/ControlsConfig';

export class PhotoOverlay {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly captionEl: HTMLElement;
  private onClose: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'photo-overlay';
    this.root.innerHTML = `
      <div>
        <div class="frame"><canvas width="640" height="420"></canvas></div>
        <div class="caption"></div>
      </div>
    `;
    root.appendChild(this.root);
    this.canvas = this.root.querySelector('canvas') as HTMLCanvasElement;
    this.captionEl = this.root.querySelector('.caption') as HTMLElement;
    this.root.addEventListener('click', () => this.close());
    window.addEventListener('keydown', this.handleKey);
  }

  private handleKey = (event: KeyboardEvent): void => {
    if (!this.root.classList.contains('open')) return;
    if (event.code === controls.code('interact') || event.code === 'Escape' || event.code === 'Enter') this.close();
  };

  setCloseHandler(handler: () => void): void {
    this.onClose = handler;
  }

  open(variant: 1 | 2, caption: string): void {
    this.draw(variant);
    this.captionEl.textContent = caption;
    this.root.classList.add('open');
  }

  close(): void {
    if (!this.root.classList.contains('open')) return;
    this.root.classList.remove('open');
    this.onClose?.();
  }

  get isOpen(): boolean {
    return this.root.classList.contains('open');
  }

  private draw(variant: 1 | 2): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // base sepia
    ctx.fillStyle = '#c3b394';
    ctx.fillRect(0, 0, w, h);

    // cielo degradado
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, '#9a8f74');
    sky.addColorStop(1, '#c3b394');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.55);

    // bosque: triángulos oscuros a ambos lados
    ctx.fillStyle = '#4c4434';
    for (let i = 0; i < 26; i++) {
      const t = i / 26;
      const x = t < 0.5 ? t * 2 * w * 0.42 : w - (1 - t) * 2 * w * 0.42;
      const treeH = 60 + Math.random() * 90;
      const baseY = h * 0.55;
      ctx.beginPath();
      ctx.moveTo(x - 14 - Math.random() * 10, baseY);
      ctx.lineTo(x, baseY - treeH);
      ctx.lineTo(x + 14 + Math.random() * 10, baseY);
      ctx.closePath();
      ctx.fill();
    }

    // carretera en fuga
    ctx.fillStyle = '#7a7057';
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 26, h * 0.55);
    ctx.lineTo(w * 0.5 + 26, h * 0.55);
    ctx.lineTo(w * 0.86, h);
    ctx.lineTo(w * 0.14, h);
    ctx.closePath();
    ctx.fill();

    // línea discontinua central
    ctx.fillStyle = '#b5a887';
    let y = h * 0.57;
    let width = 2.5;
    while (y < h) {
      ctx.fillRect(w / 2 - width / 2, y, width, 10 + width * 2);
      y += 26 + width * 4;
      width *= 1.28;
    }

    // coche aparcado al borde (pálido, visto desde atrás)
    const carX = w * 0.6;
    const carY = h * 0.62;
    ctx.fillStyle = '#8f8778';
    ctx.fillRect(carX - 30, carY - 22, 60, 40);
    ctx.fillStyle = '#57503f';
    ctx.fillRect(carX - 22, carY - 34, 44, 18);
    ctx.fillStyle = '#2e2a22';
    ctx.fillRect(carX - 18, carY - 31, 36, 12);
    ctx.fillStyle = '#3a352a';
    ctx.fillRect(carX - 34, carY + 8, 10, 14);
    ctx.fillRect(carX + 24, carY + 8, 10, 14);
    if (variant === 2) {
      // luz de puerta abierta
      ctx.fillStyle = 'rgba(220, 210, 180, 0.5)';
      ctx.fillRect(carX - 44, carY - 18, 12, 30);
      // figura borrosa junto al coche
      ctx.fillStyle = 'rgba(40, 36, 30, 0.82)';
      ctx.beginPath();
      ctx.ellipse(carX - 52, carY - 12, 11, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(carX - 52, carY - 46, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // grano
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(40, 34, 24, ${Math.random() * 0.14})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
    }

    // viñeta + borde quemado
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(28,22,14,0.72)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60, 48, 32, 0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }
}
