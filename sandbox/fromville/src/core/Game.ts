import * as THREE from 'three';
import { AmbientAudio } from '../audio/AmbientAudio';
import { HorrorAudio } from '../audio/HorrorAudio';
import { PlayerAudio } from '../audio/PlayerAudio';
import { SpatialAudio } from '../audio/SpatialAudio';
import { FirstPersonCamera } from '../camera/FirstPersonCamera';
import { DayNight, type Phase } from '../environment/DayNight';
import { Door } from '../interaction/Door';
import { InteractionManager } from '../interaction/InteractionManager';
import { Note } from '../interaction/Note';
import { RefugeSystem } from '../interaction/RefugeSystem';
import { FirstPersonController } from '../player/FirstPersonController';
import { PostFX } from '../rendering/PostFX';
import { DebugOverlay } from '../ui/DebugOverlay';
import { CollisionSystem } from '../world/CollisionSystem';
import { placeHeroProps } from '../world/HeroProps';
import { type InteractionBundle, buildInteractions } from '../world/Interactions';
import { World } from '../world/World';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import type { Quality } from './Settings';
import { Settings } from './Settings';

type Mode = 'MENU' | 'PLAYING' | 'PAUSED';

function el(tag: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

const REFUGIO_NAMES: Record<string, string> = {
  diner: 'El diner',
  sheriff: 'La comisaría',
  church: 'La iglesia',
  gas: 'La gasolinera',
};

function refugioLabel(id: string): string {
  if (REFUGIO_NAMES[id]) return REFUGIO_NAMES[id];
  if (id.startsWith('house')) return 'Una casa';
  return 'El refugio';
}

/**
 * Game — orquestador Fase 7: renderer + composer (PostFX) + cámara FPS + día/noche + mundo gris +
 * hero assets GLB (Blender → AssetManager) + interacción/refugios + audio procedural Web Audio.
 * Menú → clic → pointer lock → caminar. Esc libera el ratón → pausa. F3 → debug.
 * Aún sin día/noche, criaturas ni interactuables (Fases 3, 6, 8, 9).
 */
export class Game {
  readonly settings = new Settings();
  readonly seed: number;
  readonly scene = new THREE.Scene();
  readonly collisions = new CollisionSystem();
  readonly view: FirstPersonCamera;

  private readonly renderer: Renderer;
  private readonly input: InputManager;
  private readonly debug: DebugOverlay;
  private readonly uiRoot: HTMLElement;
  private readonly reducedMotion: boolean;

  private world: World | null = null;
  private player: FirstPersonController | null = null;
  private postfx: PostFX | null = null;
  private dayNight: DayNight | null = null;
  private assets: AssetManager | null = null;
  private heroCount = 0;
  private interactions: InteractionManager | null = null;
  private bundle: InteractionBundle | null = null;
  private refuges: RefugeSystem | null = null;
  private audio: AudioManager | null = null;
  private ambientAudio: AmbientAudio | null = null;
  private spatialAudio: SpatialAudio | null = null;
  private playerAudio: PlayerAudio | null = null;
  private horrorAudio: HorrorAudio | null = null;
  private audioStarted = false;
  private muted = false;
  private fastTime = false;

  private startEl!: HTMLElement;
  private startButton!: HTMLButtonElement;
  private captionEl!: HTMLElement;
  private promptEl!: HTMLElement;
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
    this.view = new FirstPersonCamera(window.innerWidth / window.innerHeight);
    this.debug = new DebugOverlay(uiRoot);

    this.reducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.view.reducedMotion = this.reducedMotion;

    this.buildUi();

    window.addEventListener('resize', () => this.onResize());
    this.input.onLockChange = (locked) => {
      if (!locked && this.mode === 'PLAYING') this.pause();
    };
  }

  private buildUi(): void {
    this.crosshairEl = el('div');
    this.crosshairEl.id = 'crosshair';

    this.captionEl = el('div');
    this.captionEl.id = 'caption';

    this.promptEl = el('div');
    this.promptEl.id = 'prompt';

    this.startEl = el('div');
    this.startEl.id = 'start';
    const tag = el('div', 'tag');
    tag.textContent = 'prototipo · fase 7';
    const title = el('h1');
    title.textContent = 'FROMVILLE';
    this.startButton = el('button') as HTMLButtonElement;
    this.startButton.textContent = 'Entrar al pueblo';
    this.startButton.addEventListener('click', () => this.start());
    const hint = el('div', 'hint');
    hint.textContent =
      'WASD moverse · Shift correr · E interactuar · Shift+E sellar puerta · Esc pausa · M silencio · F3 debug · F4 calidad · F5 fase · F6 tiempo ×8';
    this.startEl.append(tag, title, this.startButton, hint);
    this.startEl.classList.add('open'); // MENU: visible hasta pulsar "Entrar al pueblo"

    this.uiRoot.append(this.crosshairEl, this.captionEl, this.promptEl, this.startEl);
  }

  async init(): Promise<void> {
    this.world = new World(this.scene, this.seed, this.collisions);
    this.player = new FirstPersonController(this.view, this.input, this.settings, this.collisions, {
      heightAt: (x, z) => (this.world ? this.world.heightAt(x, z) : 0),
    });
    this.player.onFootstep = (running) => this.playerAudio?.footstep(running);
    this.postfx = new PostFX(this.renderer.webgl, this.scene, this.view.camera, this.settings.get().quality);
    this.postfx.reducedMotion = this.reducedMotion;
    this.postfx.setQuality(this.settings.get().quality);

    this.dayNight = new DayNight(
      { scene: this.scene, sun: this.world.sun, hemi: this.world.hemi, fog: this.world.fog },
      this.settings.get().quality,
    );
    this.dayNight.onPhaseChange = (phase) => this.onPhaseChange(phase);

    // Fase 5: hero assets de Blender (GLB) cargados de public/assets (no bloquean el menú).
    this.assets = new AssetManager(this.renderer.webgl);
    void placeHeroProps(this.assets, this.world).then((n) => {
      this.heroCount = n;
    });

    // Fase 6: interacción genérica (puertas/sellos/notas) + regla de sellos de los refugios.
    this.bundle = buildInteractions(this.world);
    this.world.group.add(this.bundle.group);
    this.interactions = new InteractionManager(this.player, this.input);
    for (const door of this.bundle.doors) this.interactions.add(door);
    for (const note of this.bundle.notes) this.interactions.add(note);
    this.interactions.onPrompt = (text) => this.setPrompt(text);
    this.interactions.onInteract = (item, mode) => this.onInteractSound(item, mode);
    this.refuges = new RefugeSystem();
    for (const refuge of this.bundle.refuges) this.refuges.add(refuge);
    this.refuges.onSafeChange = (safe, refuge) => {
      if (safe && refuge) this.caption(`${refugioLabel(refuge.id)} sellado: estás a salvo.`, 3);
      else if (!safe && refuge) this.caption('Has roto el sello. Ya no estás a salvo.', 3);
    };

    // Fase 7: audio procedural. El AudioContext se crea en el primer gesto (start → unlockAudio).
    this.audio = new AudioManager(this.settings);
    this.spatialAudio = new SpatialAudio(this.audio);
    this.ambientAudio = new AmbientAudio(this.audio);
    this.playerAudio = new PlayerAudio(this.audio);
    this.horrorAudio = new HorrorAudio(this.audio, this.spatialAudio, () => this.player!.position);

    const spawn = this.world.layout.spawn;
    this.player.teleport(spawn.x, spawn.z, spawn.yaw);

    this.renderFrame(0);
    this.caption('Marrow Falls no aparece en ningún mapa.', 4.5);
    await new Promise((resolve) => window.setTimeout(resolve, 100));

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private start(): void {
    if (this.mode === 'PLAYING') return;
    this.unlockAudio();
    this.startEl.classList.remove('open');
    this.crosshairEl.classList.add('on');
    this.mode = 'PLAYING';
    this.input.requestLock();
  }

  /** primer gesto: crea/reanuda el AudioContext y arranca las capas (una sola vez). */
  private unlockAudio(): void {
    this.audio?.unlock();
    if (this.audioStarted) return;
    this.audioStarted = true;
    this.ambientAudio?.start();
    this.playerAudio?.start();
  }

  private onInteractSound(item: { id: string }, mode: 'primary' | 'secondary'): void {
    if (!this.audio) return;
    if (item instanceof Note) {
      this.caption(item.body, 8);
      this.audio.burst({ duration: 0.12, frequency: 1700, q: 2, gain: 0.1 }); // papel
    } else if (item instanceof Door) {
      if (mode === 'secondary') {
        this.audio.burst({ duration: 0.16, frequency: 240, q: 1.4, gain: 0.24 }); // cerrojo
      } else {
        this.audio.burst({ duration: 0.32, frequency: 150, q: 0.9, gain: 0.28, type: 'lowpass' }); // madero
        this.spatialAudio?.playAt(item.position, { frequency: 320, duration: 0.4, gain: 0.28, q: 6, bus: 'player' });
      }
    }
  }

  private pause(): void {
    if (this.mode !== 'PLAYING') return;
    this.mode = 'PAUSED';
    this.startButton.textContent = 'Seguir';
    this.startEl.classList.add('open');
    this.crosshairEl.classList.remove('on');
    this.setPrompt(null);
    this.audio?.suspend();
    this.input.releaseLock();
  }

  caption(text: string, seconds = 4): void {
    this.captionEl.textContent = text;
    this.captionEl.classList.add('on');
    this.captionTimer = seconds;
  }

  /** prompt de interacción bajo la retícula (null → oculto). */
  private setPrompt(text: string | null): void {
    if (!text) {
      this.promptEl.classList.remove('on');
      return;
    }
    this.promptEl.textContent = `E · ${text}`;
    this.promptEl.classList.add('on');
  }

  /** hook del DayNight: por ahora un rótulo de señal; el Horror Director lo consumirá (Fase 9). */
  private onPhaseChange(phase: Phase): void {
    const msg: Record<Phase, string> = {
      DAY: 'Amanece. El pueblo respira.',
      SUNSET: 'El sol cae. Deberías buscar un refugio.',
      DUSK: 'Cae la penumbra. Algo te observa.',
      NIGHT: 'Es de noche. No corras: haces ruido.',
      DANGER: 'Madrugada. Es lo más letal.',
      DAWN: 'Amanece. Algo se retira al bosque.',
    };
    this.caption(msg[phase], 4);
  }

  /** F4: alterna LOW→MED→HIGH en caliente (pixelRatio + passes del composer). */
  private cycleQuality(): void {
    const order: Quality[] = ['LOW', 'MED', 'HIGH'];
    const current = this.settings.get().quality;
    const next = order[(order.indexOf(current) + 1) % order.length] as Quality;
    this.settings.set('quality', next);
    this.renderer.applySettings(this.settings.get());
    this.renderer.resize();
    this.postfx?.setQuality(next);
    this.postfx?.setSize(window.innerWidth, window.innerHeight);
    this.dayNight?.setQuality(next);
    this.caption(`Calidad: ${next}`, 2);
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.view.resize(aspect);
    this.renderer.resize();
    this.postfx?.setSize(window.innerWidth, window.innerHeight);
  }

  private renderFrame(dt: number): void {
    this.renderer.webgl.info.reset();
    if (this.postfx) this.postfx.render(dt);
    else this.renderer.render(this.scene, this.view.camera);
  }

  private loop = (time: number): void => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (this.input.pressed('F3')) this.debug.toggle();
    if (this.input.pressed('F4')) this.cycleQuality();
    if (this.input.pressed('F5')) {
      this.dayNight?.skipToNext();
      this.caption(`Fase: ${this.dayNight?.currentPhase ?? '—'}`, 1.5);
    }
    if (this.input.pressed('F6')) {
      this.fastTime = !this.fastTime;
      this.dayNight?.setTimeScale(this.fastTime ? 8 : 1);
      this.caption(this.fastTime ? 'Tiempo ×8' : 'Tiempo ×1', 1.5);
    }
    if (this.input.pressed('KeyM')) {
      this.muted = !this.muted;
      this.audio?.setMuted(this.muted);
      this.caption(this.muted ? 'Audio silenciado' : 'Audio activo', 1.5);
    }

    if (this.mode === 'PLAYING' && this.player) this.player.update(dt);

    this.dayNight?.update(dt);
    if (this.dayNight && this.postfx) this.postfx.setMood(this.dayNight.moodTint, this.dayNight.moodSaturation);

    if (this.mode === 'PLAYING' && this.player && this.interactions && this.dayNight) {
      this.interactions.update({ dayFactor: this.dayNight.dayFactor, phase: this.dayNight.currentPhase });
      this.refuges?.update(this.player);
    }
    this.bundle?.update(dt);

    if (this.audio?.ready && this.dayNight) {
      this.spatialAudio?.updateListener(this.view.camera);
      this.ambientAudio?.update(this.dayNight.dayFactor);
      if (this.mode === 'PLAYING') {
        this.horrorAudio?.update(this.dayNight.dayFactor, this.dayNight.currentPhase);
        this.playerAudio?.setExertion(this.player?.sprinting ? 1 : 0);
      }
    }

    if (this.captionTimer > 0) {
      this.captionTimer -= dt;
      if (this.captionTimer <= 0) this.captionEl.classList.remove('on');
    }

    this.renderFrame(dt);
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
    const fx = this.postfx ? `postfx ${this.postfx.quality}${this.postfx.bloomOn ? '+bloom' : ''}` : 'postfx off';
    const phase = this.dayNight
      ? `${this.dayNight.currentPhase} day ${(this.dayNight.dayFactor * 100).toFixed(0)}%`
      : '—';
    this.debug.setLine(0, `FPS ${this.fps} · ${this.mode} · q ${this.settings.get().quality} · ${moving}`);
    this.debug.setLine(1, `${phase} · ${fx} · grain ${this.reducedMotion ? 'off(RM)' : 'on'}`);
    this.debug.setLine(
      2,
      `draw ${info.render.calls} · tris ${info.render.triangles} · geo ${info.memory.geometries} · tex ${info.memory.textures}`,
    );
    if (p) this.debug.setLine(3, `pos ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`);
    this.debug.setLine(4, `assets GLB ${this.heroCount} · seed ${this.seed}`);
    const cur = this.refuges?.current;
    const safeState = cur
      ? `${refugioLabel(cur.id)} ${this.refuges?.safe ? 'SEGURO' : 'sin sellar'}`
      : 'a la intemperie';
    this.debug.setLine(
      5,
      `refugio: ${safeState} · selladas ${this.bundle?.doors.filter((d) => d.sealed).length ?? 0}/${this.bundle?.doors.length ?? 0}`,
    );
    const audioState = !this.audio?.ready ? 'bloqueado (clic)' : this.muted ? 'muted' : 'on';
    this.debug.setLine(6, `audio: ${audioState} · hovered ${this.interactions?.hovered?.id ?? '—'}`);
  }
}
