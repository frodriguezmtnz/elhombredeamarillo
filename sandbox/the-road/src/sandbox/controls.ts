import * as THREE from 'three';
import { controls } from '../core/ControlsConfig';
import type { ActionKey } from '../core/ControlsConfig';
import { clamp, damp } from '../utils/MathUtils';
import { buildCar } from '../vehicle/Car';
import '../style.css';

/**
 * Controls Sandbox — pistón de pruebas para controles, cámara y coche.
 * Todo lo que toques aquí se guarda y el juego real lo lee en caliente.
 * El JSON del panel es la fuente de verdad: cópialo y pégaselo al agente.
 */

/* ------------------------------------------------------------------ */
/* escena mínima                                                       */
/* ------------------------------------------------------------------ */

const sceneRoot = document.getElementById('scene-root') as HTMLElement;
const uiRoot = document.getElementById('ui-root') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
sceneRoot.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0f14');
scene.fog = new THREE.Fog('#0b0f14', 60, 160);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);

scene.add(new THREE.HemisphereLight('#8fa3b8', '#20241f', 0.9));
const sun = new THREE.DirectionalLight('#dfe6ee', 1.2);
sun.position.set(30, 60, 20);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: '#20261e', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(200, 100, 0x3a4a3a, 0x26302a);
grid.position.y = 0.02;
scene.add(grid);

// asfalto de prueba
const strip = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 200),
  new THREE.MeshStandardMaterial({ color: '#23262a', roughness: 0.5 }),
);
strip.rotation.x = -Math.PI / 2;
strip.position.y = 0.03;
scene.add(strip);

// conos y cajas como referencia de movimiento
const coneGeometry = new THREE.ConeGeometry(0.3, 0.7, 8);
const coneMaterial = new THREE.MeshStandardMaterial({ color: '#b3542a', roughness: 0.8 });
for (let i = 0; i < 14; i++) {
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  const side = i % 2 === 0 ? 1 : -1;
  cone.position.set(side * 5.5, 0.35, -60 + i * 9);
  scene.add(cone);
}
const boxMaterial = new THREE.MeshStandardMaterial({ color: '#4a4440', roughness: 0.9 });
for (const [x, z] of [
  [20, 10],
  [-20, -30],
  [24, -70],
  [-18, 50],
] as const) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 3), boxMaterial);
  box.position.set(x, 1.2, z);
  scene.add(box);
}

const car = buildCar();
car.setHeadlights(true);
scene.add(car.group);

/* ------------------------------------------------------------------ */
/* estado del conductor                                                */
/* ------------------------------------------------------------------ */

interface DriveState {
  position: THREE.Vector3;
  heading: number;
  speed: number;
  steer: number;
  camOrbit: number;
  camPitch: number;
  mode: 'chase' | 'cockpit';
}

const state: DriveState = {
  position: new THREE.Vector3(0, 0, 40),
  heading: Math.PI, // mirando hacia -Z (hacia los conos)
  speed: 0,
  steer: 0,
  camOrbit: 0,
  camPitch: 0,
  mode: controls.camera.mode === 'cockpit' ? 'cockpit' : 'chase',
};

const keys = new Set<string>();
let rebinding: ActionKey | null = null;

window.addEventListener('keydown', (event) => {
  if (rebinding) {
    event.preventDefault();
    controls.bindings[rebinding] = event.code;
    controls.save();
    rebinding = null;
    renderBindings();
    renderJson();
    return;
  }
  if (event.code === controls.code('camera')) {
    state.mode = state.mode === 'chase' ? 'cockpit' : 'chase';
    controls.camera.mode = state.mode;
    controls.save();
    car.setCabinVisible(state.mode !== 'cockpit');
    renderJson();
    return;
  }
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  state.camOrbit -= event.movementX * 0.0022 * controls.camera.sensitivity;
  state.camPitch = clamp(state.camPitch - event.movementY * 0.0016, -0.55, 0.62);
});
renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());

/* ------------------------------------------------------------------ */
/* física idéntica al juego (misma fuente de valores)                  */
/* ------------------------------------------------------------------ */

function update(dt: number): void {
  const tuning = controls.car;
  const throttle = keys.has(controls.code('forward')) ? 1 : 0;
  const braking = keys.has(controls.code('back')) ? 1 : 0;
  const steerInput = (keys.has(controls.code('left')) ? 1 : 0) - (keys.has(controls.code('right')) ? 1 : 0);

  const speedRatio = Math.min(1, Math.abs(state.speed) / Math.max(1, tuning.maxSpeed));
  if (throttle > 0) state.speed += tuning.accel * dt * (1 - speedRatio * 0.55);
  if (braking > 0) {
    if (state.speed > 0.4) state.speed -= tuning.brake * dt;
    else state.speed = Math.max(-tuning.maxReverse, state.speed - 5.2 * dt);
  }
  if (throttle === 0 && braking === 0) {
    state.speed -= Math.sign(state.speed) * Math.min(Math.abs(state.speed), tuning.coast * dt);
  }

  state.steer = damp(state.steer, steerInput, tuning.steerLag, dt);
  const speedFactor = 1 - Math.min(0.62, Math.abs(state.speed) / 34);
  state.heading += state.steer * speedFactor * tuning.turnRate * (state.speed / 2.6) * dt;

  const fx = Math.sin(state.heading);
  const fz = Math.cos(state.heading);
  state.position.x += fx * state.speed * dt;
  state.position.z += fz * state.speed * dt;

  car.group.position.copy(state.position);
  car.group.rotation.y = state.heading;
  car.brakeLights.emissiveIntensity = braking > 0 ? 2.4 : 0.35;

  // cámara
  if (state.mode === 'cockpit') {
    const lx = controls.camera.cockpitX;
    const ly = controls.camera.cockpitY;
    const lz = controls.camera.cockpitZ;
    const cos = Math.cos(state.heading);
    const sin = Math.sin(state.heading);
    camera.position.set(
      state.position.x + cos * lx + sin * lz,
      ly + Math.abs(state.speed) * 0.0006,
      state.position.z - sin * lx + cos * lz,
    );
    const lookYaw = state.heading + clamp(state.camOrbit, -1.9, 1.9);
    const cosPitch = Math.cos(state.camPitch);
    camera.lookAt(
      camera.position.x + Math.sin(lookYaw) * cosPitch * 10,
      camera.position.y + Math.sin(state.camPitch) * 10,
      camera.position.z + Math.cos(lookYaw) * cosPitch * 10,
    );
  } else {
    state.camOrbit = damp(state.camOrbit, 0, 0.35 + speedRatio * 1.6, dt);
    const camYaw = state.heading + state.camOrbit;
    const distance = controls.camera.chaseDistance + speedRatio * 1.4;
    const lag = controls.camera.chaseLag;
    camera.position.x = damp(camera.position.x, state.position.x - Math.sin(camYaw) * distance, lag, dt);
    camera.position.y = damp(camera.position.y, controls.camera.chaseHeight + speedRatio * 0.35, lag, dt);
    camera.position.z = damp(camera.position.z, state.position.z - Math.cos(camYaw) * distance, lag, dt);
    camera.lookAt(state.position.x + fx * 5, 1.15, state.position.z + fz * 5);
  }

  for (const wheel of car.wheels) wheel.rotation.x += (state.speed / 0.34) * dt;
  for (const holder of car.frontWheels) holder.rotation.y = state.steer * 0.42;
}

/* ------------------------------------------------------------------ */
/* panel de control                                                    */
/* ------------------------------------------------------------------ */

const panel = document.createElement('div');
panel.style.cssText = `
  position: fixed; top: 12px; right: 12px; width: 340px; max-height: calc(100vh - 24px);
  overflow-y: auto; background: rgba(8,10,13,0.94); border: 1px solid rgba(255,255,255,0.12);
  padding: 14px; z-index: 30; font-size: 12px; color: #cfd4d8;
`;
panel.innerHTML = `
  <h2 style="font-family:Georgia,serif;font-weight:normal;letter-spacing:0.25em;font-size:14px;margin-bottom:10px">CONTROLS SANDBOX</h2>
  <div style="color:#7d858c;font-size:11px;margin-bottom:10px">Conduce con tus teclas. Click en el canvas para el ratón. Los cambios se guardan y el juego los lee (recarga la pestaña del juego).</div>
  <div class="sandbox-bindings"></div>
  <div class="sandbox-sliders"></div>
  <div style="display:flex;gap:6px;margin:10px 0">
    <button data-act="export" style="flex:1">Copy JSON</button>
    <button data-act="import" style="flex:1">Apply JSON</button>
  </div>
  <textarea class="sandbox-json" spellcheck="false" style="width:100%;height:170px;background:#0a0f14;color:#8fe8ad;border:1px solid #1d2630;font-family:Consolas,monospace;font-size:10.5px;padding:8px;resize:vertical"></textarea>
  <div style="display:flex;gap:6px;margin-top:8px">
    <button data-act="reset" style="flex:1">Reset defaults</button>
    <a href="./" style="flex:1;text-align:center;border:1px solid rgba(255,255,255,0.12);color:#cfd4d8;padding:6px;text-decoration:none">← Back to game</a>
  </div>
  <div class="sandbox-status" style="margin-top:8px;color:#b8a26b;font-size:11px;min-height:14px"></div>
`;
uiRoot.appendChild(panel);
uiRoot.style.pointerEvents = 'none';
(panel as HTMLElement).style.pointerEvents = 'auto';

const speedHud = document.createElement('div');
speedHud.style.cssText = `
  position: fixed; bottom: 14px; left: 14px; z-index: 30; font-family: Consolas, monospace;
  font-size: 13px; color: #8fe8ad; background: rgba(0,0,0,0.55); padding: 6px 10px; border: 1px solid rgba(120,255,160,0.2);
`;
uiRoot.appendChild(speedHud);

const ACTION_LABELS: Record<ActionKey, string> = {
  forward: 'Forward (W)',
  back: 'Back (S)',
  left: 'Left (A)',
  right: 'Right (D)',
  run: 'Run',
  interact: 'Interact',
  camera: 'Camera toggle',
  debug: 'Debug overlay',
};

function renderBindings(): void {
  const container = panel.querySelector('.sandbox-bindings') as HTMLElement;
  container.innerHTML =
    '<div style="color:#7d858c;font-size:10px;letter-spacing:0.2em;margin:6px 0">KEY BINDINGS</div>';
  for (const action of Object.keys(controls.bindings) as ActionKey[]) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:3px 0;gap:8px';
    const label = document.createElement('span');
    label.textContent = ACTION_LABELS[action];
    const button = document.createElement('button');
    button.textContent = controls.bindings[action];
    button.style.cssText =
      'background:#141a20;border:1px solid rgba(255,255,255,0.2);color:#dfe6dc;padding:3px 10px;cursor:pointer;font-family:Consolas,monospace;font-size:11px;min-width:90px';
    button.addEventListener('click', () => {
      rebinding = action;
      button.textContent = 'press...';
    });
    row.append(label, button);
    container.appendChild(row);
  }
}

interface SliderSpec {
  label: string;
  get: () => number;
  set: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderSpec[] = [
  {
    label: 'Max speed',
    min: 8,
    max: 45,
    step: 0.5,
    get: () => controls.car.maxSpeed,
    set: (v) => {
      controls.car.maxSpeed = v;
    },
  },
  {
    label: 'Max reverse',
    min: 3,
    max: 15,
    step: 0.5,
    get: () => controls.car.maxReverse,
    set: (v) => {
      controls.car.maxReverse = v;
    },
  },
  {
    label: 'Acceleration',
    min: 3,
    max: 18,
    step: 0.2,
    get: () => controls.car.accel,
    set: (v) => {
      controls.car.accel = v;
    },
  },
  {
    label: 'Brake power',
    min: 5,
    max: 30,
    step: 0.5,
    get: () => controls.car.brake,
    set: (v) => {
      controls.car.brake = v;
    },
  },
  {
    label: 'Coast drag',
    min: 0.5,
    max: 8,
    step: 0.1,
    get: () => controls.car.coast,
    set: (v) => {
      controls.car.coast = v;
    },
  },
  {
    label: 'Turn rate',
    min: 0.8,
    max: 4.5,
    step: 0.05,
    get: () => controls.car.turnRate,
    set: (v) => {
      controls.car.turnRate = v;
    },
  },
  {
    label: 'Steer smoothing',
    min: 0.03,
    max: 0.4,
    step: 0.01,
    get: () => controls.car.steerLag,
    set: (v) => {
      controls.car.steerLag = v;
    },
  },
  {
    label: 'Chase height',
    min: 1,
    max: 4.5,
    step: 0.05,
    get: () => controls.camera.chaseHeight,
    set: (v) => {
      controls.camera.chaseHeight = v;
    },
  },
  {
    label: 'Chase distance',
    min: 3,
    max: 12,
    step: 0.1,
    get: () => controls.camera.chaseDistance,
    set: (v) => {
      controls.camera.chaseDistance = v;
    },
  },
  {
    label: 'Chase lag',
    min: 0.02,
    max: 0.35,
    step: 0.01,
    get: () => controls.camera.chaseLag,
    set: (v) => {
      controls.camera.chaseLag = v;
    },
  },
  {
    label: 'Cockpit X (left+)',
    min: -0.7,
    max: 0.7,
    step: 0.01,
    get: () => controls.camera.cockpitX,
    set: (v) => {
      controls.camera.cockpitX = v;
    },
  },
  {
    label: 'Cockpit Y',
    min: 0.8,
    max: 1.7,
    step: 0.01,
    get: () => controls.camera.cockpitY,
    set: (v) => {
      controls.camera.cockpitY = v;
    },
  },
  {
    label: 'Cockpit Z (fwd+)',
    min: -1.5,
    max: 1.5,
    step: 0.01,
    get: () => controls.camera.cockpitZ,
    set: (v) => {
      controls.camera.cockpitZ = v;
    },
  },
  {
    label: 'Mouse sensitivity',
    min: 0.2,
    max: 3,
    step: 0.05,
    get: () => controls.camera.sensitivity,
    set: (v) => {
      controls.camera.sensitivity = v;
    },
  },
];

function renderSliders(): void {
  const container = panel.querySelector('.sandbox-sliders') as HTMLElement;
  container.innerHTML =
    '<div style="color:#7d858c;font-size:10px;letter-spacing:0.2em;margin:10px 0 4px">TUNING (live)</div>';
  for (const spec of SLIDERS) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:2px 0';
    const label = document.createElement('span');
    label.style.cssText = 'flex:0 0 118px;color:#9aa2a9;font-size:10.5px';
    label.textContent = spec.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.value = String(spec.get());
    input.style.cssText = 'flex:1;accent-color:#b8a26b';
    const value = document.createElement('span');
    value.style.cssText = 'flex:0 0 34px;text-align:right;font-family:Consolas,monospace;font-size:10px';
    value.textContent = Number(spec.get()).toFixed(2);
    input.addEventListener('input', () => {
      spec.set(Number(input.value));
      value.textContent = Number(input.value).toFixed(2);
      controls.save();
      renderJson();
    });
    row.append(label, input, value);
    container.appendChild(row);
  }
}

const jsonArea = panel.querySelector('.sandbox-json') as HTMLTextAreaElement;
const status = panel.querySelector('.sandbox-status') as HTMLElement;

function renderJson(): void {
  jsonArea.value = JSON.stringify(controls.all, null, 2);
}

function flash(message: string): void {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = '';
  }, 2500);
}

for (const node of panel.querySelectorAll('button[data-act]')) {
  node.addEventListener('click', () => {
    const action = (node as HTMLElement).dataset.act;
    if (action === 'export') {
      renderJson();
      void navigator.clipboard?.writeText(jsonArea.value).then(
        () => flash('JSON copiado al portapapeles'),
        () => flash('Cópialo manualmente del cuadro'),
      );
    } else if (action === 'import') {
      try {
        const parsed = JSON.parse(jsonArea.value);
        controls.replace(parsed);
        state.mode = controls.camera.mode === 'cockpit' ? 'cockpit' : 'chase';
        car.setCabinVisible(state.mode !== 'cockpit');
        renderBindings();
        renderSliders();
        renderJson();
        flash('Config aplicada y guardada');
      } catch {
        flash('JSON inválido — revisa el formato');
      }
    } else if (action === 'reset') {
      controls.reset();
      state.mode = 'chase';
      car.setCabinVisible(true);
      renderBindings();
      renderSliders();
      renderJson();
      flash('Valores por defecto restaurados');
    }
  });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderBindings();
renderSliders();
renderJson();
car.setCabinVisible(state.mode !== 'cockpit');

let last = performance.now();
function loop(time: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (time - last) / 1000);
  last = time;
  update(dt);
  renderer.render(scene, camera);
  speedHud.textContent = `speed ${Math.abs(state.speed * 3.6)
    .toFixed(0)
    .padStart(3)} km/h · cam ${state.mode} · heading ${(((state.heading * 180) / Math.PI) % 360).toFixed(0)}°`;
}
requestAnimationFrame(loop);
