/**
 * AssetManager — caché centralizada.
 * El MVP usa assets PROCEDURALES (geometría/texturas generadas por código),
 * pero la API queda preparada para GLB/audios externos en el futuro.
 */
import * as THREE from 'three';

export class AssetManager {
  private textures = new Map<string, THREE.Texture>();
  private models = new Map<string, THREE.Group>();
  loadedCount = 0;

  /** Textura de canvas generada una sola vez y cacheada. */
  canvasTexture(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): THREE.Texture {
    const cached = this.textures.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`AssetManager: no se pudo crear contexto 2D para ${key}`);
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.set(key, texture);
    this.loadedCount++;
    return texture;
  }

  registerModel(key: string, model: THREE.Group): void {
    this.models.set(key, model);
    this.loadedCount++;
  }

  getModel(key: string): THREE.Group | undefined {
    return this.models.get(key);
  }

  dispose(): void {
    for (const texture of this.textures.values()) texture.dispose();
    this.textures.clear();
    this.models.clear();
  }
}
