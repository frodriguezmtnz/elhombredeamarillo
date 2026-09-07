import * as THREE from 'three';
import type { RoadSettings } from './Settings';

export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) return true;
    return canvas.getContext('experimental-webgl2') !== null;
  } catch {
    return false;
  }
}

/**
 * Envoltorio del renderer: calidad, resize, pixel ratio limitado a hardware modesto.
 */
export class Renderer {
  readonly webgl: THREE.WebGLRenderer;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(container: HTMLElement, settings: Readonly<RoadSettings>) {
    this.webgl = new THREE.WebGLRenderer({
      antialias: settings.quality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.05;
    container.appendChild(this.webgl.domElement);
    this.applySettings(settings);
  }

  get domElement(): HTMLCanvasElement {
    return this.webgl.domElement;
  }

  applySettings(settings: Readonly<RoadSettings>): void {
    const shadows = settings.quality !== 'low';
    this.webgl.shadowMap.enabled = shadows;
    this.webgl.shadowMap.type = settings.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    const maxRatio = settings.quality === 'low' ? 1 : settings.quality === 'medium' ? 1.25 : 2;
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
    this.resize();
  }

  resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === this.lastWidth && height === this.lastHeight) return;
    this.lastWidth = width;
    this.lastHeight = height;
    this.webgl.setSize(width, height);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.webgl.render(scene, camera);
  }
}
