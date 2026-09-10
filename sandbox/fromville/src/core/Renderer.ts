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
    // Con EffectComposer se hacen varios renderer.render por frame; acumulamos stats y reseteamos a mano.
    this.webgl.info.autoReset = false;
    this.webgl.setClearColor(0x05070a, 1);
    this.applySettings(settings);
    this.resize();
    container.appendChild(this.domElement);
  }

  get domElement(): HTMLCanvasElement {
    return this.webgl.domElement;
  }

  applySettings(settings: SettingsSnapshot): void {
    // pixelRatio cap por calidad (PERFORMANCE.md §1): LOW 1.0 · MED 1.25 · HIGH 2.0
    const maxDpr = settings.quality === 'HIGH' ? 2 : settings.quality === 'MED' ? 1.25 : 1;
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    // El tone mapping ACES lo aplica el OutputPass del composer; el exposure vive aquí.
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.2;
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
