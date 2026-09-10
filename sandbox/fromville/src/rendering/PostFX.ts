import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { Quality } from '../core/Settings';

/**
 * Pase de atmósfera (1 draw fullscreen): desaturación + viñeta + grano de película + tinte frío.
 * Sella el look "recuerdo/maqueta" de VISUAL_DIRECTION.md §2/§5. El ACES + sRGB los hace OutputPass.
 */
const AtmosphereShader = {
  name: 'AtmosphereShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.95 },
    uGrain: { value: 0.05 },
    uSaturation: { value: 0.8 },
    uTint: { value: new THREE.Color(0.97, 0.99, 1.03) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uSaturation;
    uniform vec3 uTint;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 color = tex.rgb;

      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, uSaturation);

      vec2 d = vUv - 0.5;
      float vig = smoothstep(0.8, 0.34, length(d) * 1.15);
      color *= mix(1.0, vig, uVignette);

      color *= uTint;

      float g = hash(vUv * uResolution + mod(uTime, 100.0) * 43.0) - 0.5;
      color += g * uGrain;

      gl_FragColor = vec4(color, tex.a);
    }
  `,
};

/**
 * PostFX — EffectComposer con RenderPass → Bloom (MED/HIGH) → Atmósfera → OutputPass(ACES).
 * La calidad activa/desactiva passes (PERFORMANCE.md §1). LOW = solo tone map + viñeta.
 */
export class PostFX {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly atmosphere: ShaderPass;
  private readonly renderer: THREE.WebGLRenderer;
  private time = 0;
  reducedMotion = false;
  quality: Quality = 'MED';

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, quality: Quality) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.6, 0.72);
    this.composer.addPass(this.bloom);

    this.atmosphere = new ShaderPass(AtmosphereShader);
    this.composer.addPass(this.atmosphere);

    this.composer.addPass(new OutputPass());

    this.setQuality(quality);
    this.setSize(window.innerWidth, window.innerHeight);
  }

  get bloomOn(): boolean {
    return this.bloom.enabled;
  }

  /** El DayNight empuja cada fase su tinte/saturación de LUT (VISUAL_DIRECTION.md §5). */
  setMood(tint: THREE.Color, saturation: number): void {
    (this.atmosphere.uniforms.uTint.value as THREE.Color).copy(tint);
    this.atmosphere.uniforms.uSaturation.value = saturation;
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
    this.bloom.enabled = quality !== 'LOW';
    this.bloom.strength = quality === 'HIGH' ? 0.34 : 0.2;
    this.bloom.radius = 0.6;
    this.bloom.threshold = 0.72;

    const u = this.atmosphere.uniforms;
    u.uVignette.value = 0.95;
    u.uSaturation.value = quality === 'LOW' ? 0.86 : 0.8;
    u.uGrain.value = this.reducedMotion ? 0 : quality === 'HIGH' ? 0.07 : quality === 'MED' ? 0.05 : 0;
  }

  setSize(width: number, height: number): void {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(width, height);
    const pr = this.renderer.getPixelRatio();
    this.atmosphere.uniforms.uResolution.value.set(width * pr, height * pr);
  }

  render(dt: number): void {
    this.time += dt;
    this.atmosphere.uniforms.uTime.value = this.time;
    this.composer.render(dt);
  }

  dispose(): void {
    this.composer.dispose();
  }
}
