import * as THREE from 'three';
import { FirstPersonController } from '../player/FirstPersonController';
import { DebugOverlay } from '../ui/DebugOverlay';
import { CollisionSystem } from '../world/CollisionSystem';
import { World } from '../world/World';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { Settings } from './Settings';

type Mode = 'MENU' | 'PLAYING' | 'PAUSED';

function el(tag: string, id?: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (id) node.id = id;
  if (className) node.className = className;
  return node;
}

/**
 * Game — orquestador Fase 1: monta renderer + mundo gris + controlador FPS + bucle único.
 * Menú → clic → pointer lock → caminar. Esc libera el ratón → pausa. F3 → debug.
 * Sin día/noche, sin criaturas y sin interactuables todavía (Fases 3, 6, 8, 9).
 */
export class Game {
  readonly settings = new Settings();
  readonly seed: number;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly collisions = new CollisionSystem();

  private readonly renderer: Renderer;
  private readonly input: InputManager;
  private readonly debug: DebugOverlay;
  private readonly uiRoot: HTMLElement;

  private world: World | null = null;
  private player: FirstPersonController | null = null;

  private startEl!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private captionEl!: HTMLElement;
  private crosshairEl!: HTMLElement;
  private captionTimer = 0;

  private mode: Mode = 'MENU';
  private lastTime = 0;
  private frames = 0;
  private fpsTimer = 0;
  private fps = 0;

  constructor() {
    const requested = Number(new URLSearchParams(window.location.search).get('seed'));
    this.seed =
      Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : Math.floor(Math.random() * 1_000_000);

    const sceneRoot = document.getElementById('scene-root');
    const uiRoot = document.getElementById('ui-root');
    if (!sceneRoot || !uiRoot) throw new Error('Faltan #scene-root / #ui-root en el HTML');
    this.uiRoot = uiRoot;

    this.renderer = new Renderer(sceneRoot, this.settings.get());
    this.input = new InputManager(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.debug = new DebugOverlay(uiRoot);

    this.buildUi();

    window.addEventListener('resize', () => this.onResize());
    this.input.onLockChange = (locked) => {
      if (!locked && this.mode === 'PLAYING') this.pause();
    };
  }

  private buildUi(): void {
    this.crosshairEl = el('div', 'crosshair');
    this.crosshairEl.id = 'crosshair';

    this.captionEl = el('div');
    this.captionEl.id = 'caption';

    this.startEl = el('div');
    this.startEl.id = 'start';
    const tag = el('div', undefined, 'tag');
    tag.textContent = 'prototipo · fase 1';
    const title = el('h1');
    title.textContent = 'FROMVILLE';
    this.startButton = el('button') as HTMLButtonElement;
    this.startButton.textContent = 'Entrar al pueblo';
    this.startButton.addEventListener('click', () => this.start());
    const hint = el('div', undefined, 'hint');
    hint.textContent = 'WASD moverse · Shift correr · Ratón mirar · Esc pausa · F3 debug';
    this.startEl.append(tag, title, this.startButton, hint);
    this.startEl.classList.add('open'); // MENU: visible hasta pulsar "Entrar al pueblo"

    this.uiRoot.append(this.crosshairEl, this.captionEl, this.startEl);
  }

  async init(): Promise<void> {
    this.world = new World(this.scene, this.seed, this.collisions);
    this.player = new FirstPersonController(this.camera, this.input, this.settings, this.collisions, {
      heightAt: (x, z) => (this.world ? this.world.heightAt(x, z) : 0),
    });
    const spawn = this.world.layout.spawn;
    this.player.teleport(spawn.x, spawn.z, spawn.yaw);

    this.renderer.render(this.scene, this.camera);
    this.caption('Marrow Falls no aparece en ningún mapa.', 4.5);
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private start(): void {
    if (this.mode === 'PLAYING') return;
    this.startEl.classList.remove('open');
    this.crosshairEl.classList.add('on');
    this.mode = 'PLAYING';
    this.input.requestLock();
  }

  private pause(): void {
    if (this.mode !== 'PLAYING') return;
    this.mode = 'PAUSED';
    this.startButton.textContent = 'Seguir';
    this.startEl.classList.add('open');
    this.crosshairEl.classList.remove('on');
    this.input.releaseLock();
  }

  caption(text: string, seconds = 4): void {
    this.captionEl.textContent = text;
    this.captionEl.classList.add('on');
    this.captionTimer = seconds;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.resize();
  }

  private loop = (time: number): void => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (this.input.pressed('F3')) this.debug.toggle();

    if (this.mode === 'PLAYING' && this.player) this.player.update(dt);

    if (this.captionTimer > 0) {
      this.captionTimer -= dt;
      if (this.captionTimer <= 0) this.captionEl.classList.remove('on');
    }

    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();

    this.frames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
      this.updateDebug();
    }
    this.debug.update(dt);
  };

  private updateDebug(): void {
    const info = this.renderer.webgl.info;
    const p = this.player?.position;
    const moving = this.player?.sprinting ? 'run' : p ? 'walk/idle' : '—';
    this.debug.setLine(0, `FPS ${this.fps} · ${this.mode} · q ${this.settings.get().quality} · ${moving}`);
    this.debug.setLine(
      1,
      `draw ${info.render.calls} · tris ${info.render.triangles} · geo ${info.memory.geometries} · tex ${info.memory.textures}`,
    );
    if (p) this.debug.setLine(2, `pos ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`);
  }
}
