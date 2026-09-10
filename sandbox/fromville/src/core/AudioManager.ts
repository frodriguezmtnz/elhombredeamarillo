import type { Settings } from './Settings';

export interface BurstOptions {
  duration: number;
  frequency: number;
  q?: number;
  gain?: number;
  type?: BiquadFilterType;
  bus?: AudioNode;
}

/**
 * AudioManager (`TECH_ARCHITECTURE §8`): grafo Web Audio 100 % procedural (sin archivos). Un master
 * + tres buses (ambient / player / horror). `unlock()` debe llamarse desde un gesto del usuario
 * (política de autoplay). Expone primitivas (`noiseLoop`, `burst`, `beep`) que las capas de
 * `src/audio/*` componen en cues. Volúmenes leídos de `Settings` (reaplicados al cambiarlos).
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private whiteBuf: AudioBuffer | null = null;
  private brownBuf: AudioBuffer | null = null;
  private master: GainNode | null = null;
  ambient: GainNode | null = null;
  player: GainNode | null = null;
  horror: GainNode | null = null;
  private muted = false;

  constructor(private readonly settings: Settings) {}

  get ready(): boolean {
    return this.ctx !== null;
  }

  get audioContext(): AudioContext | null {
    return this.ctx;
  }

  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** Debe llamarse en el primer gesto (clic en "Entrar al pueblo"). */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.ambient = ctx.createGain();
    this.player = ctx.createGain();
    this.horror = ctx.createGain();
    this.ambient.connect(this.master);
    this.player.connect(this.master);
    this.horror.connect(this.master);
    this.master.connect(ctx.destination);
    this.whiteBuf = this.buildNoise(ctx, 2, false);
    this.brownBuf = this.buildNoise(ctx, 4, true);
    this.applyVolumes();
    this.settings.onChange(() => this.applyVolumes());
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.master || !this.ambient || !this.player || !this.horror) return;
    const s = this.settings.get();
    const perceptual = s.masterVolume * s.masterVolume;
    this.master.gain.value = this.muted ? 0 : perceptual;
    this.ambient.gain.value = s.ambientVolume;
    this.player.gain.value = s.effectsVolume;
    this.horror.gain.value = s.effectsVolume;
  }

  private buildNoise(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  /** fuente de ruido en loop → filter → gain (sin conectar; el caller enruta). */
  noiseLoop(brown = false): { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null {
    if (!this.ctx) return null;
    const buffer = brown ? this.brownBuf : this.whiteBuf;
    if (!buffer) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.connect(filter);
    filter.connect(gain);
    return { source, filter, gain };
  }

  /** ráfaga de ruido filtrado con caída exponencial (pasos, puertas, impactos). */
  burst(options: BurstOptions): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const loop = this.noiseLoop(false);
    if (!loop) return;
    const { source, filter, gain } = loop;
    filter.type = options.type ?? 'bandpass';
    filter.frequency.value = options.frequency;
    filter.Q.value = options.q ?? 1;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(options.gain ?? 0.3, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.duration);
    gain.connect(options.bus ?? this.player ?? ctx.destination);
    source.start(t0);
    source.stop(t0 + options.duration + 0.05);
  }

  /** oscilador con envolvente simple (tonos, campanas, drones cortos). */
  beep(
    frequency: number,
    duration: number,
    options: { type?: OscillatorType; gain?: number; bus?: AudioNode; detune?: number } = {},
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = options.type ?? 'sine';
    osc.frequency.value = frequency;
    if (options.detune) osc.detune.value = options.detune;
    const gain = ctx.createGain();
    const peak = options.gain ?? 0.18;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(options.bus ?? this.player ?? ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** paso del jugador: ráfaga corta cuyo timbre/volumen varía (tierra/madera). */
  footstep(running: boolean): void {
    this.burst({
      duration: 0.075 + Math.random() * 0.04,
      frequency: 260 + Math.random() * 340,
      q: 0.8,
      gain: running ? 0.14 : 0.08,
    });
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
  }
}
