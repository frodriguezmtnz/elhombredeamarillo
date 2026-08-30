import * as THREE from 'three';
import { CarAudio } from '../audio/CarAudio';
import { SpatialAudio } from '../audio/SpatialAudio';
import { EventManager } from '../events/EventManager';
import type { EventApi, EventContext } from '../events/GameEvent';
import { LANDMARK_S, roadEvents } from '../events/RoadEvents';
import { ScareDirector } from '../events/ScareDirector';
import { villageEvents } from '../events/VillageEvents';
import type { Interactable } from '../interaction/Interactable';
import { InteractionManager } from '../interaction/InteractionManager';
import { DialogueSystem } from '../npc/DialogueSystem';
import { NPCController } from '../npc/NPCController';
import { FirstPersonController } from '../player/FirstPersonController';
import { DebugOverlay } from '../ui/DebugOverlay';
import { DialogueUI } from '../ui/DialogueUI';
import { HUD } from '../ui/HUD';
import { LoadingScreen } from '../ui/LoadingScreen';
import { MainMenu } from '../ui/MainMenu';
import { PhotoOverlay } from '../ui/PhotoOverlay';
import { clamp, damp, ringDelta } from '../utils/MathUtils';
import { CarController } from '../vehicle/CarController';
import { CollisionSystem } from '../world/CollisionSystem';
import { buildFallenTree } from '../world/FallenTree';
import {
  buildBarrier,
  buildLake,
  buildLandmarks,
  buildLighthouse,
  buildSignTexture,
  buildTunnel,
} from '../world/Props';
import type { BarrierResult, LandmarksResult } from '../world/Props';
import { buildVillage } from '../world/Village';
import type { VillageResult } from '../world/Village';
import { World } from '../world/World';
import { WORLD } from '../world/World';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { controls } from './ControlsConfig';
import { GameState } from './GameState';
import type { CoreState, StoryPhase } from './GameState';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { Settings } from './Settings';

/**
 * Game — orquestador principal.
 * Un único animation loop: update(dt) + render().
 * Los sistemas (world, player, car, events...) se montan sobre este núcleo.
 */
export class Game {
  readonly settings = new Settings();
  readonly state = new GameState();
  readonly input: InputManager;
  readonly renderer: Renderer;
  readonly audio: AudioManager;
  /** semilla de la partida: aleatoria salvo ?seed=... (reproducible) */
  readonly seed: number;

  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly assets = new AssetManager();
  readonly collisions = new CollisionSystem();
  readonly interactions = new InteractionManager();

  private readonly loading: LoadingScreen;
  private readonly debug: DebugOverlay;
  private readonly menu: MainMenu;
  private readonly hud: HUD;
  private world: World | null = null;
  private player: FirstPersonController | null = null;
  private car: CarController | null = null;
  private carAudio: CarAudio | null = null;
  private carInteraction: Interactable | null = null;
  private camOrbit = 0;
  private camPitch = 0;
  private driveCam: 'chase' | 'cockpit' = 'chase';
  private playerRoadHint = 0;
  private playerLateral = 0;
  private menuS = 0;
  private examinedCount = 0;
  private treeTurnBackTimer = -1;
  private village: VillageResult | null = null;
  private landmarks: LandmarksResult | null = null;
  private barrier: BarrierResult | null = null;
  private barrierGone = false;
  private lighthouse: { group: THREE.Group; beam: THREE.Group } | null = null;
  private nightFell = false;
  private treeGone = false;
  private fallenTree: { group: THREE.Group; colliderRefs?: { x: number; z: number; r: number }[] } | null = null;
  private tunnelRange: [number, number] = [0, -1];
  private tunnelInside = false;
  private highBeams = false;
  private stallState: 'none' | 'off' | 'flicker' = 'none';
  private stallTimer = 0;
  private crows: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
  private eyes: THREE.Group | null = null;
  private eyesTimer = 0;
  private dripTimer = 3;
  private doorSlamCaptionDone = false;
  private phoneCaptionDone = false;
  private readonly scares: ScareDirector;
  private readonly events = new EventManager();
  private readonly npcController = new NPCController();
  private readonly dialogue = new DialogueSystem();
  private readonly dialogueUI: DialogueUI;
  private readonly photo: PhotoOverlay;
  private readonly spatial: SpatialAudio;
  private photoInteractable: Interactable | null = null;
  private photoViews = 0;
  private loops = 0;
  private attempts = 0;
  private approachNarrationDone = false;
  private figure: THREE.Mesh | null = null;
  private figureTimer = 0;
  private readonly villageCenter = new THREE.Vector3();
  private readonly scratchA = new THREE.Vector3();
  private readonly scratchB = new THREE.Vector3();
  private readonly scratchC = new THREE.Vector3();
  private crowGeometry: THREE.ConeGeometry | null = null;
  private crowMaterial: THREE.MeshStandardMaterial | null = null;
  private lastTime = 0;
  private frames = 0;
  private fpsTimer = 0;
  private fps = 0;
  private clockT = 0;

  constructor() {
    const requestedSeed = Number(new URLSearchParams(window.location.search).get('seed'));
    this.seed =
      Number.isFinite(requestedSeed) && requestedSeed > 0
        ? Math.floor(requestedSeed)
        : Math.floor(Math.random() * 1_000_000);
    this.scares = new ScareDirector(
      {
        crows: (at) => this.spawnCrows(at),
        eyes: (at) => this.spawnEyes(at),
        whisper: () => this.audio.whisper(Math.random() < 0.5 ? -1 : 1),
        stall: () => this.beginStall(),
        thunder: () => {
          this.world?.lightning();
          this.audio.thunder(0.5 + Math.random() * 1.5);
        },
        doorSlam: () => {
          this.audio.doorSlam();
          if (!this.doorSlamCaptionDone) {
            this.doorSlamCaptionDone = true;
            this.hud.caption('A door. Somewhere behind the houses. It did not close — it slammed.', 5.5);
          }
        },
        phone: () => {
          this.audio.phone();
          if (!this.phoneCaptionDone) {
            this.phoneCaptionDone = true;
            this.hud.caption('A telephone is ringing inside the diner. Nobody moves to answer it.', 6);
          }
        },
      },
      this.seed,
    );
    const sceneRoot = document.getElementById('scene-root');
    const uiRoot = document.getElementById('ui-root');
    if (!sceneRoot || !uiRoot) throw new Error('Faltan #scene-root / #ui-root en el HTML');

    this.renderer = new Renderer(sceneRoot, this.settings.get());
    this.input = new InputManager(this.renderer.domElement);
    this.audio = new AudioManager(this.settings);
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);

    this.loading = new LoadingScreen(uiRoot);
    this.debug = new DebugOverlay(uiRoot);
    this.hud = new HUD(uiRoot);
    this.hud.setVisible(false);
    this.dialogueUI = new DialogueUI(uiRoot, this.dialogue);
    this.photo = new PhotoOverlay(uiRoot);
    this.photo.setCloseHandler(() => this.onPhotoClosed());
    this.spatial = new SpatialAudio(this.audio);
    this.dialogue.onClose = () => {
      this.input.uiFocus = false;
      this.dialogueUI.close();
    };
    this.menu = new MainMenu(
      uiRoot,
      {
        onStart: () => this.startGame(),
        onExit: () => this.exitGame(),
        onResume: () => this.resume(),
        onExitToMenu: () => this.exitToMenu(),
        onFullscreenToggle: () => this.toggleFullscreen(),
        onChange: () => this.onSettingsChanged(),
      },
      () => this.settings.get(),
      (key, value) => this.settings.set(key, value),
      (quality) => {
        this.settings.set('quality', quality);
        this.onSettingsChanged();
      },
    );

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.current !== 'MENU') this.pause();
    });
    window.addEventListener('resize', () => this.onResize());
    this.input.onLockChange = (locked) => this.onPointerLockChange(locked);
    this.renderer.domElement.addEventListener('click', () => this.onCanvasClick());
  }

  async init(): Promise<void> {
    this.loading.show('Generating road...');
    await this.yieldFrame();
    this.world = new World(this.scene, this.assets, this.audio, this.seed, this.settings.get().quality);
    this.loading.progress(0.45, 'Growing forest...');
    await this.yieldFrame();
    this.addStartSign();
    this.addFallenTree();
    this.addVillageAndLandmarks();
    this.addRoadFeatures();
    this.loading.progress(0.8, 'Tuning atmosphere...');
    this.renderer.render(this.scene, this.camera);
    await this.yieldFrame();
    this.loading.progress(1, 'Ready');
    await this.delay(350);
    this.loading.hide();
    this.state.setState('MENU');
    this.menu.showMenu();
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  /** árbol caído que bloquea la carretera (Fase 4) */
  private addFallenTree(): void {
    const world = this.world;
    if (!world) return;
    const fallen = buildFallenTree(world.curve, WORLD.treeS, this.seed);
    world.group.add(fallen.group);
    const colliderRefs = fallen.colliders.map((c) => this.collisions.add(c.x, c.z, c.r, 'tree'));
    for (const point of fallen.points) {
      this.interactions.add({
        id: point.id,
        position: point.position,
        radius: 3.2,
        label: point.label,
        active: true,
        use: () => {
          this.hud.caption(point.caption, 7);
          this.examinedCount++;
          // crujido espacial procedente del punto examinado
          this.spatial.playAt(point.position, {
            frequency: 130 + Math.random() * 160,
            duration: 0.55 + Math.random() * 0.4,
            gain: 0.4,
            q: 2.2,
          });
          if (this.examinedCount === 3) {
            setTimeout(() => {
              if (this.state.phase === 'TREE') {
                this.hud.narration('The only way back is the way you came.', 5);
              }
            }, 7500);
          }
        },
      });
    }
    this.fallenTree = { group: fallen.group, colliderRefs };
  }

  /** pueblo + landmarks + registro de eventos (Fases 5-6) */
  private addVillageAndLandmarks(): void {
    const world = this.world;
    if (!world) return;
    this.village = buildVillage(world.curve, this.collisions, this.assets, this.seed);
    this.village.setLights(false); // el pueblo "despierta" cuando llegas de noche
    world.group.add(this.village.group);
    this.landmarks = buildLandmarks(world.curve, this.assets, this.seed);
    world.group.add(this.landmarks.group);

    const origin = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
    const centerPose = world.curve.at(WORLD.villageS, origin);
    this.villageCenter.set(centerPose.x, 0, centerPose.z);

    this.events.register(...roadEvents());
    this.events.register(...villageEvents({ x: this.villageCenter.x, z: this.villageCenter.z }));

    // silueta de la anomalía (aparece solo en fugas)
    const figurePose = world.curve.at(LANDMARK_S.figure, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    this.figure = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 1.15, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#0a0c0e', roughness: 1 }),
    );
    this.figure.position.set(figurePose.x - figurePose.nx * 3.4, 0.95, figurePose.z - figurePose.nz * 3.4);
    this.figure.visible = false;
    world.group.add(this.figure);

    this.addNPCs(world);
    this.addPhoto(world);
  }

  /** la fotografía del tablón (Fase 9) — solo tras la segunda vuelta */
  private addPhoto(world: NonNullable<World>): void {
    const village = this.village;
    if (!village) return;
    const position = village.noticeBoardPos.clone().setY(1.5);
    this.photoInteractable = this.interactions.add({
      id: 'photo',
      position,
      radius: 2.8,
      label: 'Look at photograph',
      active: false,
      use: () => this.viewPhoto(),
    });
    void world;
  }

  private viewPhoto(): void {
    this.photoViews++;
    if (this.photoViews === 1) {
      this.photo.open(
        1,
        'A photograph, clipped to the board with four rusty pins. A forest road. A parked car — pale, familiar. The camera stood exactly where you are standing now.',
      );
    } else {
      this.photo.open(
        2,
        'The same photograph. The car door is open now. Someone is standing beside it, out of focus. It was not there the first time you looked.',
      );
    }
  }

  private onPhotoClosed(): void {
    if (this.photoViews >= 2) this.startEnding();
  }

  /** ENDING del MVP: corte a negro + tarjeta final */
  private startEnding(): void {
    if (this.state.current === 'ENDING') return;
    this.setState('ENDING');
    this.input.releaseLock();
    this.hud.setVisible(false);
    this.carAudio?.stop();
    this.world?.ambientAudio.stop();
    const fade = document.getElementById('fade');
    fade?.classList.add('on');
    setTimeout(() => {
      fade?.classList.remove('on');
      const ending = document.createElement('div');
      ending.id = 'ending';
      ending.className = 'open';
      ending.innerHTML = `
        <div class="title">THE ROAD</div>
        <div class="lines">
          You never learned who developed the film.<br/>
          The tally under the sign has twelve marks now.<br/><br/>
          TO BE CONTINUED
        </div>
        <button id="ending-menu">Return to Title</button>
      `;
      document.getElementById('ui-root')?.appendChild(ending);
      ending.querySelector('button')?.addEventListener('click', () => window.location.reload());
    }, 2100);
  }

  /** 5 habitantes de Marrow Falls (Fase 7) */
  private addNPCs(world: NonNullable<World>): void {
    const spots = this.village?.npcSpots;
    if (!spots) return;
    const jitter = (v: THREE.Vector3, jx: number, jz: number): THREE.Vector3 =>
      new THREE.Vector3(v.x + jx, 0, v.z + jz);
    const spawns = [
      {
        key: 'edith',
        name: 'Edith Vane',
        coatColor: '#5a4a52',
        hat: true,
        position: jitter(spots.diner, -2.2, 0.6),
        seed: 11,
      },
      {
        key: 'jonah',
        name: 'Jonah Beck',
        coatColor: '#3d4a56',
        hat: false,
        position: jitter(spots.gas, 1.4, -0.8),
        altPosition: { position: jitter(spots.motel, 1.6, 0.4), loops: 1 },
        seed: 23,
      },
      {
        key: 'walt',
        name: 'Walt Henner',
        coatColor: '#4d4638',
        hat: true,
        position: jitter(spots.diner, 2.4, -1.2),
        seed: 37,
      },
      {
        key: 'june',
        name: 'June Aldous',
        coatColor: '#6b5347',
        hat: false,
        position: jitter(spots.diner, 0, -2.4),
        seed: 41,
      },
      {
        key: 'osei',
        name: 'Mr. Osei',
        coatColor: '#2f3338',
        hat: true,
        position: spots.bench,
        seed: 59,
      },
    ];
    for (const spawn of spawns) {
      this.npcController.spawn(spawn);
      const npc = this.npcController.npcs[this.npcController.npcs.length - 1];
      world.group.add(npc.visual.group);
      const collider = this.collisions.add(spawn.position.x, spawn.position.z, 0.45, `npc-${spawn.key}`);
      npc.collider = collider;
      this.interactions.add({
        id: `npc-${spawn.key}`,
        position: npc.interactablePosition,
        radius: 3,
        label: `Talk to ${spawn.name}`,
        active: true,
        use: () => this.startDialogue(spawn.key),
      });
    }
  }

  private startDialogue(key: string): void {
    if (this.dialogue.start(key)) {
      this.dialogue.setLoops(this.loops);
      this.input.uiFocus = true;
      this.dialogueUI.render();
    }
  }

  /** barricada + lago + túnel + faro (contenido de atmósfera) */
  private addRoadFeatures(): void {
    const world = this.world;
    if (!world) return;

    // barricada detrás del inicio: desaparece tras pasar por el árbol
    const barrier = buildBarrier(world.curve, WORLD.barrierS);
    world.group.add(barrier.group);
    barrier.colliderRefs = barrier.colliders.map((c) => this.collisions.add(c.x, c.z, c.r, 'barrier'));
    this.barrier = barrier;

    // lago al lateral (cerca de la carretera, reflejo de luna garantizado)
    world.group.add(buildLake(world.curve, WORLD.lakeS, -26));

    // túnel bajo la montaña (tramo de fuga)
    const tunnel = buildTunnel(world.curve, WORLD.tunnelS, WORLD.tunnelLength);
    world.group.add(tunnel.group);
    for (const c of tunnel.colliders) this.collisions.add(c.x, c.z, c.r, 'tunnel');
    this.tunnelRange = tunnel.range;

    // faro lejano (visible desde la 1ª fuga, nunca alcanzable)
    const pose = world.curve.at(1900, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    this.lighthouse = buildLighthouse(new THREE.Vector3(pose.x + pose.nx * 520, 0, pose.z + pose.nz * 520));
    this.lighthouse.group.visible = false;
    world.group.add(this.lighthouse.group);
  }

  /** cuervos que estallan desde el arcén */
  private spawnCrows(at: THREE.Vector3): void {
    this.audio.wingFlaps(7);
    this.crowGeometry ??= new THREE.ConeGeometry(0.13, 0.42, 4);
    this.crowMaterial ??= new THREE.MeshStandardMaterial({ color: '#0a0c0e', roughness: 1 });
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(this.crowGeometry, this.crowMaterial);
      mesh.position.set(
        at.x + (Math.random() - 0.5) * 2.4,
        0.7 + Math.random() * 1.6,
        at.z + (Math.random() - 0.5) * 2.4,
      );
      this.scene.add(mesh);
      this.crows.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 5, 4.5 + Math.random() * 3.5, (Math.random() - 0.5) * 5),
        life: 1.9,
      });
    }
  }

  /** ojos amarillos al borde de la carretera */
  private spawnEyes(at: THREE.Vector3): void {
    if (!this.eyes) {
      this.eyes = new THREE.Group();
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#e8e06a', fog: false });
      const eyeGeometry = new THREE.SphereGeometry(0.055, 8, 6);
      const left = new THREE.Mesh(eyeGeometry, eyeMaterial);
      left.position.set(-0.14, 0, 0);
      const right = new THREE.Mesh(eyeGeometry, eyeMaterial);
      right.position.set(0.14, 0, 0);
      this.eyes.add(left, right);
      this.scene.add(this.eyes);
    }
    this.eyes.position.set(at.x, 0.92, at.z);
    this.eyes.visible = true;
    this.eyesTimer = 7;
  }

  /** cala el motor y apaga las luces (secuencia completa en updateDriving) */
  private beginStall(): void {
    if (this.stallState !== 'none' || !this.car) return;
    this.stallState = 'off';
    this.stallTimer = 0;
    this.car.visual.setHeadlights(false);
    this.carAudio?.stall(1.9);
    this.hud.caption('The engine dies.', 1.6);
  }

  private eventApi(): EventApi {
    return {
      narration: (text, seconds) => this.hud.narration(text, seconds),
      caption: (text, seconds) => this.hud.caption(text, seconds),
      lowStinger: () => this.audio.lowStinger(),
      swapTownSign: () => this.swapTownSign(),
      showFigure: () => {
        if (this.figure && this.attempts >= 1) {
          this.figure.visible = true;
          this.figureTimer = 16;
        }
      },
    };
  }

  private swapTownSign(): void {
    if (!this.world || !this.landmarks) return;
    const alt = buildSignTexture(
      this.assets,
      'sign-town-alt',
      ['MARROW FALLS', 'POP. 115'],
      '#184a2b',
      '#dfe6dc',
      '#dfe6dc',
    );
    this.landmarks.townSignBoardMaterial.map = alt;
    this.landmarks.townSignBoardMaterial.needsUpdate = true;
  }

  /** señal interactiva cerca del inicio (contenido temporal hasta FASE 4) */
  private addStartSign(): void {
    const world = this.world;
    if (!world) return;
    const pose = world.curve.at(WORLD.startS + 10, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    const x = pose.x + pose.nx * 4.4;
    const z = pose.z + pose.nz * 4.4;
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: '#3d4247', roughness: 0.7, metalness: 0.4 }),
    );
    pole.position.y = 1.1;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.6, 0.06),
      new THREE.MeshStandardMaterial({ color: '#1f3a2c', roughness: 0.6 }),
    );
    board.position.y = 2.0;
    group.add(pole, board);
    const angle = Math.atan2(pose.tx, pose.tz);
    group.rotation.y = angle + Math.PI / 2;
    group.position.set(x, 0, z);
    world.group.add(group);
    this.collisions.add(x, z, 0.3);
    this.interactions.add({
      id: 'start-sign',
      position: new THREE.Vector3(x, 1.9, z),
      radius: 3.4,
      label: 'Examine sign',
      active: true,
      use: () =>
        this.hud.caption(
          'A county road sign, spotted with moss. "MARROW FALLS 2". Someone has scratched a tally under it. Eleven marks.',
          6.5,
        ),
    });
  }

  /* ------------------------------------------------------------------ */
  /* estados                                                             */
  /* ------------------------------------------------------------------ */

  private startGame(): void {
    this.audio.unlock();
    const world = this.world;
    if (!world) return;
    this.menu.hideAll();
    if (!this.player) {
      this.player = new FirstPersonController(this.camera, this.input, this.settings, this.collisions, {
        heightAt: (x, z) => world.heightAt(x, z),
      });
      this.player.onFootstep = (running) => this.onPlayerFootstep(running);
    }
    if (!this.car) {
      this.car = new CarController(world.curve, this.collisions, WORLD.startS);
      world.group.add(this.car.group);
      this.carAudio = new CarAudio(this.audio);
      this.car.onImpact = (strength) => this.onCarImpact(strength);
      // interactuable entrar/salir del coche (posición dinámica)
      this.carInteraction = this.interactions.add({
        id: 'car-door',
        position: new THREE.Vector3(),
        radius: 3.2,
        label: 'Enter car',
        active: false,
        use: () => this.toggleCar(),
      });
    }
    this.car.placeAt(WORLD.startS, -1.1);
    this.driveCam = controls.camera.mode === 'cockpit' ? 'cockpit' : 'chase';
    this.player.teleport(this.car.position.x, this.car.position.z, this.car.heading);
    this.playerRoadHint = this.car.roadHint;
    world.ambientAudio.start();
    this.carAudio?.start();
    this.enterCar();
    this.setPhase('INTRO');
    this.hud.setVisible(true);
    this.hud.narration('County Road 9 — Marrow Falls is somewhere behind you', 5.5);
    this.input.requestLock();
  }

  private enterCar(): void {
    if (this.state.current === 'DRIVING') return;
    this.camOrbit = 0;
    this.camPitch = 0;
    this.car?.visual.setCabinVisible(this.driveCam !== 'cockpit');
    this.setState('DRIVING');
    if (this.carInteraction) this.carInteraction.active = false;
    this.hud.hidePrompt();
    this.carAudio?.start();
  }

  /** C: alterna cámara de persecución / cockpit (persiste en la config) */
  private toggleDriveCam(): void {
    this.driveCam = this.driveCam === 'chase' ? 'cockpit' : 'chase';
    controls.camera.mode = this.driveCam;
    controls.save();
    this.camOrbit = 0;
    this.camPitch = 0;
    this.car?.visual.setCabinVisible(this.driveCam !== 'cockpit');
    this.hud.caption(this.driveCam === 'cockpit' ? 'Camera: cockpit' : 'Camera: chase', 1.6);
  }

  private exitCar(): void {
    if (this.state.current !== 'DRIVING' || !this.car || !this.player || !this.world) return;
    if (Math.abs(this.car.speed) > 3) {
      this.hud.caption('Too fast to get out.', 2);
      return;
    }
    this.car.speed = 0;
    // salir por la puerta izquierda
    const side = new THREE.Vector3(-Math.cos(this.car.heading), 0, Math.sin(this.car.heading));
    const doorX = this.car.position.x + side.x * 1.9;
    const doorZ = this.car.position.z + side.z * 1.9;
    this.car.visual.setCabinVisible(true);
    this.player.teleport(doorX, doorZ, this.car.heading + Math.PI / 2);
    this.playerRoadHint = this.car.roadHint;
    this.setState('ON_FOOT');
    if (this.carInteraction) {
      this.carInteraction.active = true;
      this.carInteraction.label = 'Enter car';
    }
    this.carAudio?.update(0.016, 0, 0, 0);
  }

  private toggleCar(): void {
    if (this.state.current === 'DRIVING') this.exitCar();
    else if (this.state.current === 'ON_FOOT' && this.car) {
      const distance = this.player?.position.distanceTo(this.car.position) ?? Number.POSITIVE_INFINITY;
      if (distance < 3.4) this.enterCar();
    }
  }

  private onCarImpact(strength: number): void {
    this.audio.burst({ duration: 0.22, frequency: 120, q: 0.7, gain: 0.25 + strength * 0.3, type: 'lowpass' });
    this.hud.caption('Something hard in the dark.', 1.6);
  }

  /** pasos distintos según superficie (asfalto / hojas) */
  private onPlayerFootstep(running: boolean): void {
    const offroad = Math.abs(this.playerLateral) > 3.5;
    if (offroad) {
      this.audio.burst({
        duration: 0.12 + Math.random() * 0.05,
        frequency: 900 + Math.random() * 700,
        q: 1.6,
        gain: running ? 0.1 : 0.06,
      });
    } else {
      this.audio.footstep(running);
    }
  }

  private pause(): void {
    if (this.state.current === 'PAUSED' || this.state.current === 'MENU') return;
    this.state.setState('PAUSED');
    this.input.releaseLock();
    this.menu.showPause();
    this.hud.setClickHint(false);
    this.audio.suspend();
  }

  private resume(): void {
    if (this.state.current !== 'PAUSED') return;
    this.menu.hideAll();
    this.audio.resume();
    this.input.requestLock();
  }

  private exitToMenu(): void {
    this.state.setState('MENU');
    this.menu.showMenu();
    this.hud.setVisible(false);
    this.hud.setClickHint(false);
    this.carAudio?.stop();
    this.input.releaseLock();
  }

  private exitGame(): void {
    const el = document.getElementById('exit');
    if (el) el.classList.add('open');
    const menus = document.getElementById('ui-root')?.querySelectorAll('.menu');
    if (menus) {
      for (const menu of menus) {
        (menu as HTMLElement).style.display = 'none';
      }
    }
    setTimeout(() => window.close(), 2500);
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  }

  private onSettingsChanged(): void {
    this.renderer.applySettings(this.settings.get());
  }

  private setState(next: CoreState): void {
    this.state.setState(next);
  }

  private setPhase(next: StoryPhase): void {
    this.state.setPhase(next);
  }

  private onPointerLockChange(locked: boolean): void {
    if (locked) return;
    if (this.dialogue.open) this.dialogue.close();
    if (this.state.current === 'ON_FOOT' || this.state.current === 'DRIVING') {
      this.pause();
    }
  }

  private onCanvasClick(): void {
    if (this.state.current === 'ON_FOOT' || this.state.current === 'DRIVING') {
      if (!this.input.locked) this.input.requestLock();
    }
  }

  /* ------------------------------------------------------------------ */
  /* loop                                                                */
  /* ------------------------------------------------------------------ */

  private loop = (time: number): void => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (time - this.lastTime) / 1000); // clamp: sin saltos al volver de pestaña
    this.lastTime = time;

    this.update(dt);
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
  };

  private update(dt: number): void {
    this.clockT += dt;
    if (this.input.actionPressed('debug')) this.debug.toggle();

    const info = this.renderer.webgl.info;
    this.debug.setLine(
      0,
      `FPS ${this.fps} · state ${this.state.current} · phase ${this.state.phase} · q ${this.settings.get().quality}`,
    );
    this.debug.setLine(
      1,
      `draw ${info.render.calls} · tris ${info.render.triangles} · geo ${info.memory.geometries} · tex ${info.memory.textures}`,
    );
    this.debug.update(dt);

    switch (this.state.current) {
      case 'BOOT':
      case 'MENU':
        this.updateMenuCamera(dt);
        break;
      case 'PAUSED':
        // mundo congelado; la cámara no se mueve
        break;
      default:
        this.updatePlaying(dt);
        break;
    }
  }

  /** ON_FOOT / DRIVING / ENDING: sistemas de juego activos */
  private updatePlaying(dt: number): void {
    this.hud.update(dt);
    const world = this.world;
    const player = this.player;
    if (!world || !player) return;

    // ESC pausa por teclado aunque el pointer lock no esté activo
    if (this.input.pressed('Escape') && !this.dialogue.open && !this.photo.isOpen) {
      this.pause();
      return;
    }

    // diálogo o fotografía activos: el mundo sigue, el jugador no
    if (this.dialogue.open || this.photo.isOpen) {
      if (this.input.pressed('Escape')) this.dialogue.close();
      this.hud.hidePrompt();
      world.update(dt, player.position, 0.3);
      this.village?.update(dt);
      this.npcController.update(dt, player.position);
      return;
    }

    if (this.state.current === 'ENDING') return;
    if (this.state.current === 'DRIVING') {
      this.updateDriving(dt, world);
      return;
    }

    if (this.state.current === 'ON_FOOT') player.update(dt);
    this.hud.setClickHint(this.state.current === 'ON_FOOT' && !this.input.locked);

    // ---- cuervos en vuelo ----
    for (let i = this.crows.length - 1; i >= 0; i--) {
      const crow = this.crows[i];
      crow.life -= dt;
      crow.mesh.position.addScaledVector(crow.velocity, dt);
      crow.mesh.rotation.z += dt * 9;
      if (crow.life <= 0) {
        this.scene.remove(crow.mesh);
        this.crows.splice(i, 1);
      }
    }

    // ---- ojos en la oscuridad ----
    if (this.eyes?.visible) {
      this.eyesTimer -= dt;
      const eyeDist = Math.hypot(this.eyes.position.x - player.position.x, this.eyes.position.z - player.position.z);
      if (eyeDist < 12 || this.eyesTimer <= 0) {
        this.eyes.visible = false;
        this.audio.burst({ duration: 0.3, frequency: 1400, q: 1.5, gain: 0.12 });
      }
    }

    // ---- director de sustos a pie (el pueblo tiene los suyos) ----
    if (this.state.current === 'ON_FOOT' && !this.dialogue.open && !this.photo.isOpen) {
      const footProjection = world.project(player.position.x, player.position.z, this.playerRoadHint);
      this.scares.update(dt, {
        driving: false,
        inVillage: ringDelta(footProjection.s, WORLD.villageS, world.curve.length) < 170,
        inTunnel: false,
        speed: 0,
        playerPos: player.position,
        forward: player.lookDirection,
        night: this.nightFell,
      });
    }

    // posición del interactuable del coche (puerta izquierda)
    if (this.car && this.carInteraction) {
      const sideX = -Math.cos(this.car.heading);
      const sideZ = Math.sin(this.car.heading);
      this.carInteraction.position.set(this.car.position.x + sideX * 1.7, 1.0, this.car.position.z + sideZ * 1.7);
    }

    const projection = world.project(player.position.x, player.position.z, this.playerRoadHint);
    this.playerRoadHint = projection.index;
    this.playerLateral = projection.lateral;
    const villageFactor = Math.max(
      0,
      1 - Math.hypot(player.position.x - this.villageCenter.x, player.position.z - this.villageCenter.z) / 190,
    );
    world.update(dt, player.position, 0.32, villageFactor);
    this.village?.update(dt);
    this.npcController.update(dt, player.position);
    this.spatial.updateListener(this.camera);

    const eventContext: EventContext = {
      phase: this.state.phase,
      s: projection.s,
      ringLength: world.curve.length,
      speed: 0,
      loops: this.loops,
      attempts: this.attempts,
      ringDeltaToTree: ringDelta(projection.s, WORLD.treeS, world.curve.length),
      ringDeltaToVillage: ringDelta(projection.s, WORLD.villageS, world.curve.length),
      playerPos: player.position,
    };
    this.events.update(eventContext, this.eventApi(), this.clockT);

    const best = this.interactions.findBest(player.position, player.lookDirection);
    if (best) {
      this.hud.showPrompt(best.item.label);
      if (this.input.actionPressed('interact')) best.item.use();
    } else {
      this.hud.hidePrompt();
    }
  }

  private updateDriving(dt: number, world: World): void {
    const car = this.car;
    if (!car) return;
    this.hud.setClickHint(!this.input.locked);

    // ---- luces largas: SHIFT al conducir ----
    if (this.input.actionPressed('run')) {
      this.highBeams = !this.highBeams;
      car.visual.setHighBeams(this.highBeams);
      world.setFogBoost(this.highBeams);
      this.hud.caption(this.highBeams ? 'High beams on' : 'High beams off', 1.4);
    }

    const carInput = car.readInput(this.input);
    car.update(dt, carInput);
    this.playerRoadHint = car.roadHint;

    // ---- túnel: dentro/fuera, eco y goteos ----
    const [tunnelStart, tunnelEnd] = this.tunnelRange;
    const inside = tunnelEnd > tunnelStart && car.s > tunnelStart && car.s < tunnelEnd;
    if (inside !== this.tunnelInside) {
      this.tunnelInside = inside;
      this.carAudio?.setTunnel(inside);
    }
    if (inside) {
      this.dripTimer -= dt;
      if (this.dripTimer <= 0) {
        this.dripTimer = 2 + Math.random() * 3;
        this.spatial.playAt(
          new THREE.Vector3(
            car.position.x + (Math.random() - 0.5) * 6,
            3.5,
            car.position.z + (Math.random() - 0.5) * 6,
          ),
          { frequency: 2200 + Math.random() * 1400, duration: 0.09, gain: 0.35, q: 9 },
        );
      }
      this.scares.forceStallOnce();
    }

    // ---- secuencia de cala del motor ----
    if (this.stallState === 'off') {
      this.stallTimer += dt;
      if (this.stallTimer > 1.1) {
        this.stallState = 'flicker';
        this.stallTimer = 0;
        car.visual.setHeadlights(true);
      }
    } else if (this.stallState === 'flicker') {
      this.stallTimer += dt;
      car.visual.setHeadlights(Math.sin(this.stallTimer * 42) > -0.2);
      if (this.stallTimer > 0.7) {
        this.stallState = 'none';
        car.visual.setHeadlights(true);
        this.audio.burst({ duration: 0.45, frequency: 130, q: 0.8, gain: 0.3, type: 'lowpass' });
        this.hud.caption('The engine turns over. It starts.', 1.8);
      }
    }

    // ---- director de sustos ----
    this.scares.update(dt, {
      driving: true,
      inVillage: false,
      inTunnel: inside,
      speed: Math.abs(car.speed),
      playerPos: car.position,
      forward: car.forwardInto(this.scratchC),
      night: this.nightFell,
    });

    // ---- narrativa: descubrimiento del árbol / vuelta atrás ----
    const gapToTree = ringDelta(car.s, WORLD.treeS, world.curve.length);
    if (gapToTree < 200) this.nightFell = true;
    world.setNight(this.nightFell ? 1 : 0);

    // el árbol caído DESAPARECE: el anillo queda abierto y el bucle es real
    if (!this.treeGone && this.fallenTree && (this.state.phase === 'TURN_BACK' || this.state.phase === 'ESCAPE')) {
      if (gapToTree < 26) {
        this.fallenTree.group.visible = false;
        if (this.fallenTree.colliderRefs) this.collisions.removeAll(this.fallenTree.colliderRefs);
        this.treeGone = true;
        this.audio.lowStinger();
        this.hud.caption('The tree is gone. The road is open. The break marks are still on the asphalt.', 6.5);
      }
    }

    // la barricada desaparece al volver del árbol (nadie la ha quitado)
    if (!this.barrierGone && this.barrier && this.state.phase === 'TURN_BACK') {
      if (ringDelta(car.s, WORLD.barrierS, world.curve.length) < 34) {
        this.barrier.group.visible = false;
        if (this.barrier.colliderRefs) this.collisions.removeAll(this.barrier.colliderRefs);
        this.barrierGone = true;
        this.audio.lowStinger();
        this.hud.caption('The barricade is gone. No bolts, no nails. The grass beneath it is unbroken.', 6);
      }
    }
    if (this.state.phase === 'INTRO' && gapToTree < 26) {
      this.setPhase('TREE');
      this.audio.lowStinger();
      this.hud.narration('The road is blocked.', 4.5);
    }
    if (this.state.phase === 'TREE') {
      if (Math.abs(car.speed) < 1) {
        this.treeTurnBackTimer += dt;
        if (this.treeTurnBackTimer > 9) {
          this.hud.narration('Nothing moves forward from here.', 4);
          this.treeTurnBackTimer = -4;
        }
      } else if (gapToTree > 60) {
        this.setPhase('TURN_BACK');
        this.hud.caption('Back the way you came.', 4);
      }
    }

    // ---- narrativa: descubrimiento del pueblo, fugas y vueltas ----
    const gapVillage = ringDelta(car.s, WORLD.villageS, world.curve.length);
    if (this.state.phase === 'TURN_BACK' && gapVillage < WORLD.villageHalf + 320 && !this.approachNarrationDone) {
      this.approachNarrationDone = true;
      this.setPhase('APPROACH_VILLAGE');
      this.hud.narration('Lights, far ahead.', 4);
    }
    if (
      (this.state.phase === 'TURN_BACK' || this.state.phase === 'APPROACH_VILLAGE') &&
      gapVillage < WORLD.villageHalf + 25
    ) {
      this.setPhase('VILLAGE');
      this.village?.setLights(true);
      this.hud.narration('MARROW FALLS', 4.5);
      this.audio.beep(52, 1.6, { type: 'sine', gain: 0.08 });
    }
    if (this.state.phase === 'VILLAGE' && gapVillage > WORLD.villageHalf + 110) {
      this.attempts++;
      this.events.beginAttempt();
      if (this.lighthouse) this.lighthouse.group.visible = true;
      this.setPhase('ESCAPE');
      this.hud.narration(this.attempts === 1 ? 'The road out.' : 'Out again.', 3.5);
    }
    if (this.state.phase === 'ESCAPE' && gapVillage < WORLD.villageHalf + 25) {
      this.loops++;
      this.village?.applyLoopState(this.loops);
      this.npcController.applyLoops(this.loops);
      this.dialogue.setLoops(this.loops);
      if (this.photoInteractable) this.photoInteractable.active = this.loops >= 2;
      this.setPhase('VILLAGE');
      this.hud.narration(this.loops === 1 ? 'Marrow Falls. Again.' : 'Marrow Falls.', 5);
      this.audio.lowStinger();
    }

    // ---- silueta: desaparece al acercarte ----
    if (this.figure?.visible) {
      this.figureTimer -= dt;
      const figureDist = Math.hypot(this.figure.position.x - car.position.x, this.figure.position.z - car.position.z);
      if (figureDist < 9 || this.figureTimer <= 0) {
        this.figure.visible = false;
        this.audio.burst({ duration: 0.5, frequency: 950, q: 1.1, gain: 0.15 });
      }
    }

    // ---- faro: haz giratorio ----
    if (this.lighthouse?.group.visible) {
      this.lighthouse.beam.rotation.y += dt * 0.45;
    }

    // ---- eventos ----
    const eventContext: EventContext = {
      phase: this.state.phase,
      s: car.s,
      ringLength: world.curve.length,
      speed: Math.abs(car.speed),
      loops: this.loops,
      attempts: this.attempts,
      ringDeltaToTree: gapToTree,
      ringDeltaToVillage: gapVillage,
      playerPos: this.player ? this.player.position : car.position,
    };
    this.events.update(eventContext, this.eventApi(), this.clockT);

    // ---- cámara de conducción: C alterna persecución / cockpit ----
    if (this.input.actionPressed('camera')) this.toggleDriveCam();
    const { dx, dy } = this.input.consumeMouseDelta();
    const sens = this.settings.get().sensitivity * controls.camera.sensitivity;
    if (this.input.locked) {
      this.camOrbit -= dx * sens * 0.0022;
      this.camPitch = clamp(this.camPitch - dy * sens * 0.0016, -0.55, 0.62);
    }
    this.camOrbit = damp(this.camOrbit, 0, 0.35 + car.speedRatio * 1.6, dt);

    if (this.driveCam === 'cockpit') {
      // asiento del conductor: offset local (+X = izquierda, +Z = adelante)
      const lx = controls.camera.cockpitX;
      const ly = controls.camera.cockpitY;
      const lz = controls.camera.cockpitZ;
      const cos = Math.cos(car.heading);
      const sin = Math.sin(car.heading);
      const vibration = car.offroad > 0.3 ? (Math.random() - 0.5) * 0.02 * car.speedRatio : 0;
      this.camera.position.set(
        car.position.x + cos * lx + sin * lz,
        ly + Math.abs(car.speed) * 0.0006 + vibration,
        car.position.z - sin * lx + cos * lz,
      );
      const lookYaw = car.heading + clamp(this.camOrbit, -1.9, 1.9);
      const cosPitch = Math.cos(this.camPitch);
      this.scratchB.set(
        this.camera.position.x + Math.sin(lookYaw) * cosPitch * 10,
        this.camera.position.y + Math.sin(this.camPitch) * 10,
        this.camera.position.z + Math.cos(lookYaw) * cosPitch * 10,
      );
      this.camera.lookAt(this.scratchB);
    } else {
      // persecución: cámara DETRÁS del coche (car - forward * distancia)
      const camYaw = car.heading + this.camOrbit;
      const distance = controls.camera.chaseDistance + car.speedRatio * 1.4;
      const targetX = car.position.x - Math.sin(camYaw) * distance;
      const targetZ = car.position.z - Math.cos(camYaw) * distance;
      this.scratchA.set(targetX, controls.camera.chaseHeight + car.speedRatio * 0.35, targetZ);
      const lag = controls.camera.chaseLag;
      this.camera.position.x = damp(this.camera.position.x, this.scratchA.x, lag, dt);
      this.camera.position.y = damp(this.camera.position.y, this.scratchA.y, lag, dt);
      this.camera.position.z = damp(this.camera.position.z, this.scratchA.z, lag, dt);
      const shake = car.offroad * car.speedRatio * 0.06;
      if (shake > 0.001) {
        this.camera.position.y += (Math.random() - 0.5) * shake;
        this.camera.position.x += (Math.random() - 0.5) * shake;
      }
      this.scratchB.set(car.position.x + Math.sin(car.heading) * 5, 1.15, car.position.z + Math.cos(car.heading) * 5);
      this.camera.lookAt(this.scratchB);
    }

    this.carAudio?.update(dt, car.speedRatio, carInput.throttle, car.offroad);
    const villageFactorDrive = Math.max(
      0,
      1 - Math.hypot(car.position.x - this.villageCenter.x, car.position.z - this.villageCenter.z) / 190,
    );
    world.update(dt, car.position, 0.28 + car.speedRatio * 0.75, villageFactorDrive);
    this.npcController.update(dt, car.position);
    this.spatial.updateListener(this.camera);

    if (Math.abs(car.speed) < 3) {
      this.hud.showPrompt('Exit car');
      if (this.input.actionPressed('interact')) this.exitCar();
    } else {
      this.hud.hidePrompt();
    }
  }

  private updateDebug(): void {
    const player = this.player?.position;
    const pos = player ? `pos ${player.x.toFixed(1)} ${player.y.toFixed(1)} ${player.z.toFixed(1)} · ` : '';
    let roadInfo = '';
    if (this.world && player) {
      const projection = this.world.project(player.x, player.z, this.playerRoadHint);
      roadInfo = `· s ${projection.s.toFixed(0)} lat ${projection.lateral.toFixed(1)}`;
    }
    this.debug.setLine(
      2,
      `${pos}colliders ${this.collisions.circles.length} · interact ${this.interactions.size}${roadInfo}`,
    );
    this.debug.setLine(
      3,
      `loops ${this.loops} · attempts ${this.attempts} · examined ${this.examinedCount} · seed ${this.seed}`,
    );
  }

  private updateMenuCamera(dt: number): void {
    const world = this.world;
    if (!world) return;
    this.menuS += dt * 6.5;
    const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
    const s = this.menuS + WORLD.startS - 60;
    world.curve.at(s, pose);
    this.camera.position.set(pose.x - pose.nx * 2.2, 2.6 + Math.sin(this.menuS * 0.5) * 0.12, pose.z - pose.nz * 2.2);
    const ahead = world.curve.at(s + 30, { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 });
    this.camera.lookAt(ahead.x, 1.6, ahead.z);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.resize();
  }

  /* helpers de carga */

  private yieldFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
