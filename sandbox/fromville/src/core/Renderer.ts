import * as THREE from 'three';
import type { SettingsSnapshot } from './Settings';

export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/**
 * Envoltorio mínimo del WebGLRenderer. Expone `webgl` para leer `info` (draw calls/tris)
 * desde el DebugOverlay. El tone mapping ACES adelanta el look de `VISUAL_DIRECTION.md`.
 */
export class Renderer {
  readonly webgl: THREE.WebGLRenderer;

  constructor(container: HTMLElement, settings: SettingsSnapshot) {
    this.webgl = new THREE.WebGLRenderer({
      antialias: settings.quality !== 'LOW',
      powerPreference: 'high-performance',
    });
    this.webgl.setClearColor(0x05070a, 1);
    this.applySettings(settings);
    this.resize();
    container.appendChild(this.domElement);
  }

  get domElement(): HTMLCanvasElement {
    return this.webgl.domElement;
  }

  applySettings(settings: SettingsSnapshot): void {
    const maxDpr = settings.quality === 'HIGH' ? 2 : settings.quality === 'MED' ? 1.5 : 1;
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.25;
  }

  resize(): void {
    this.webgl.setSize(window.innerWidth, window.innerHeight, false);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.webgl.render(scene, camera);
  }

  dispose(): void {
    this.webgl.dispose();
  }
}
