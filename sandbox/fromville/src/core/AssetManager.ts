import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

/**
 * AssetManager — carga de GLB (los hero assets de Blender, Fase 5) con caché por URL.
 * Deja cableados DRACO (geometría) y KTX2/Basis (texturas) para el pipeline optimizado de
 * `BLENDER_PIPELINE.md §6`; si un asset no los usa, no se invocan. Los materiales se fuerzan a
 * DoubleSide para tolerar el winding de las primitivas generadas en batch.
 */
export class AssetManager {
  private readonly loader: GLTFLoader;
  private readonly cache = new Map<string, Promise<THREE.Group>>();

  constructor(renderer: THREE.WebGLRenderer) {
    this.loader = new GLTFLoader();

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    this.loader.setDRACOLoader(draco);

    try {
      const ktx2 = new KTX2Loader()
        .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/libs/basis/')
        .detectSupport(renderer);
      this.loader.setKTX2Loader(ktx2);
    } catch {
      /* KTX2 opcional: no hay texturas comprimidas aún */
    }
  }

  load(url: string): Promise<THREE.Group> {
    let cached = this.cache.get(url);
    if (!cached) {
      cached = this.fetch(url);
      this.cache.set(url, cached);
    }
    return cached;
  }

  /** clon independiente para colocar varias instancias de un mismo GLB */
  async instantiate(url: string): Promise<THREE.Group> {
    const src = await this.load(url);
    return src.clone(true);
  }

  private fetch(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (mesh.isMesh) {
              const material = mesh.material as THREE.Material;
              material.side = THREE.DoubleSide;
            }
          });
          resolve(gltf.scene);
        },
        undefined,
        reject,
      );
    });
  }
}
