/**
 * AudioManager — Web Audio API.
 * Todos los sonidos son PROCEDURALES (sin archivos descargados):
 * motor, viento, pasos, golpes, chirridos, grillos, zumbidos...
 */
import type { Settings } from './Settings';

export class AudioManager {
  private context: AudioContext | null = null;
  master: GainNode | null = null;
  ambient: GainNode | null = null;
  effects: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /** Debe llamarse desde un gesto del usuario (click en START). */
  unlock(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const context = new AudioContext({ latencyHint: 'interactive' });
    this.context = context;
    this.master = context.createGain();
    this.ambient = context.createGain();
    this.effects = context.createGain();
    this.ambient.connect(this.master);
    this.effects.connect(this.master);
    this.master.connect(context.destination);
    this.noiseBuffer = this.buildWhiteNoise(context, 2);
    this.brownBuffer = this.buildBrownNoise(context, 4);
    this.applyVolumes();
    this.settings.onChange(() => this.applyVolumes());
  }

  get ready(): boolean {
    return this.context !== null;
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  get now(): number {
    return this.context?.currentTime ?? 0;
  }

  /** LFO conectado a un AudioParam (p.ej. el gain del viento). */
  createLfo(frequency: number, depth: number, param: AudioParam): OscillatorNode | null {
    if (!this.context) return null;
    const osc = this.context.createOscillator();
    osc.frequency.value = frequency;
    const gain = this.context.createGain();
    gain.gain.value = depth;
    osc.connect(gain);
    gain.connect(param);
    osc.start();
    return osc;
  }

  private applyVolumes(): void {
    if (!this.master || !this.ambient || !this.effects) return;
    const s = this.settings.get();
    this.master.gain.value = s.masterVolume * s.masterVolume; // perceptual aprox
    this.ambient.gain.value = s.ambientVolume;
    this.effects.gain.value = s.effectsVolume;
  }

  private buildWhiteNoise(context: AudioContext, seconds: number): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private buildBrownNoise(context: AudioContext, seconds: number): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  /** Fuente de ruido en loop (white o brown). */
  noiseLoop(brown = false): { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null {
    if (!this.context) return null;
    const buffer = brown ? this.brownBuffer : this.noiseBuffer;
    if (!buffer) return null;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.connect(filter);
    filter.connect(gain);
    return { source, filter, gain };
  }

  /** Conecta un nodo a master o a la vía de ambiente. */
  routeTo(node: AudioNode, bus: 'ambient' | 'effects'): void {
    const target = bus === 'ambient' ? this.ambient : this.effects;
    if (target) node.connect(target);
  }

  /**
   * Ayuda para efectos one-shot: reanuda el contexto si estaba suspendido
   * y devuelve la hora actual para programar envelopes.
   */
  beginFx(): number | null {
    if (!this.context) return null;
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context.currentTime;
  }

  /** Crea un oscilador con envolvente simple y lo detiene. */
  beep(
    frequency: number,
    duration: number,
    options: { type?: OscillatorType; gain?: number; destination?: AudioNode; detune?: number } = {},
  ): void {
    if (!this.context || !this.master) return;
    const context = this.context;
    const osc = context.createOscillator();
    osc.type = options.type ?? 'sine';
    osc.frequency.value = frequency;
    if (options.detune) osc.detune.value = options.detune;
    const gain = context.createGain();
    const peak = options.gain ?? 0.2;
    const t0 = context.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(options.destination ?? this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Ruido filtrado corto (pasos, ramas, puertas, cuerpo a tierra). */
  burst(options: {
    duration: number;
    frequency: number;
    q?: number;
    gain?: number;
    type?: BiquadFilterType;
    destination?: AudioNode;
  }): void {
    const loop = this.noiseLoop(false);
    if (!loop || !this.context) return;
    const { source, filter, gain } = loop;
    filter.type = options.type ?? 'bandpass';
    filter.frequency.value = options.frequency;
    filter.Q.value = options.q ?? 1;
    const peak = options.gain ?? 0.3;
    const t0 = this.context.currentTime;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.duration);
    const destination = options.destination ?? this.effects;
    if (!destination) return;
    gain.connect(destination);
    source.start(t0);
    source.stop(t0 + options.duration + 0.05);
  }

  /** Paso del jugador (procedural: ruido corto filtrado). */
  footstep(running: boolean): void {
    this.burst({
      duration: 0.085 + Math.random() * 0.04,
      frequency: 280 + Math.random() * 320,
      q: 0.85,
      gain: running ? 0.15 : 0.09,
    });
  }

  /** golpe grave de tensión narrativa (sin jumpscare) */
  lowStinger(): void {
    this.burst({ duration: 1.7, frequency: 58, q: 0.5, gain: 0.42, type: 'lowpass' });
    this.beep(44, 2.4, { type: 'sine', gain: 0.12 });
  }

  /** trueno: retumbo brown + sub-sine, con retardo programable (segundos) */
  thunder(delay = 0): void {
    const context = this.context;
    if (!context || !this.brownBuffer) return;
    const t0 = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = this.brownBuffer;
    source.loop = true;
    source.playbackRate.value = 0.55 + Math.random() * 0.25;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t0);
    filter.frequency.exponentialRampToValueAtTime(48, t0 + 2.6);
    const gain = context.createGain();
    const peak = 0.32 + Math.random() * 0.22;
    const duration = 1.9 + Math.random() * 1.6;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.14);
    gain.gain.exponentialRampToValueAtTime(peak * 0.4, t0 + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    filter.connect(gain);
    const destination = this.ambient;
    if (!destination) return;
    gain.connect(destination);
    source.start(t0);
    source.stop(t0 + duration + 0.1);
  }

  /** susurro panoramizado (izq -1 / der 1) */
  whisper(pan: number): void {
    const loop = this.noiseLoop(false);
    const context = this.context;
    if (!loop || !context || !this.effects) return;
    loop.filter.type = 'bandpass';
    loop.filter.frequency.value = 1500 + Math.random() * 900;
    loop.filter.Q.value = 6;
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    const t0 = context.currentTime;
    const gain = loop.gain;
    // tres "sílabas" encadenadas
    gain.gain.setValueAtTime(0.0001, t0);
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * 0.22;
      gain.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.04, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.008, t + 0.2);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    loop.gain.connect(panner);
    panner.connect(this.effects);
    loop.source.start(t0);
    loop.source.stop(t0 + 1.1);
  }

  /** portazo lejano */
  doorSlam(): void {
    this.burst({ duration: 0.28, frequency: 95, q: 0.9, gain: 0.5, type: 'lowpass' });
    this.beep(72, 0.4, { type: 'triangle', gain: 0.1 });
  }

  /** teléfono antiguo: tres dobles campanadas */
  phone(): void {
    const context = this.context;
    if (!context || !this.effects) return;
    const start = context.currentTime + 0.05;
    for (let ring = 0; ring < 3; ring++) {
      for (const [freq, offset] of [
        [620, 0],
        [830, 0.07],
      ] as const) {
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = ring * 5;
        const gain = context.createGain();
        const t0 = start + ring * 1.6 + offset;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
        osc.connect(gain);
        gain.connect(this.effects);
        osc.start(t0);
        osc.stop(t0 + 1);
      }
    }
  }

  /** aleteo de cuervos (ráfagas rápidas) */
  wingFlaps(count = 6): void {
    for (let i = 0; i < count; i++) {
      const delay = this.context ? i * (0.05 + Math.random() * 0.05) : 0;
      window.setTimeout(() => {
        this.burst({ duration: 0.07, frequency: 900 + Math.random() * 900, q: 1.4, gain: 0.07 });
      }, delay * 1000);
    }
  }

  /** bramido del coche fantasma al adelantar (sweep con pseudo-doppler) */
  ghostPass(): void {
    const context = this.context;
    if (!context || !this.effects) return;
    const t0 = context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(820, t0 + 1.9);
    osc.frequency.exponentialRampToValueAtTime(240, t0 + 3.4);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t0);
    filter.frequency.exponentialRampToValueAtTime(2400, t0 + 1.9);
    filter.frequency.exponentialRampToValueAtTime(500, t0 + 3.4);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effects);
    osc.start(t0);
    osc.stop(t0 + 3.6);
  }

  /** radio: cama de estática (devuelve el gain para modularla) */
  radioStaticBed(): GainNode | null {
    const context = this.context;
    if (!context || !this.effects) return null;
    const loop = this.noiseLoop(false);
    if (!loop) return null;
    loop.filter.type = 'bandpass';
    loop.filter.frequency.value = 1100;
    loop.filter.Q.value = 0.4;
    loop.gain.gain.value = 0.0001;
    loop.gain.connect(this.effects);
    loop.source.start();
    return loop.gain;
  }

  /** radio: pitido de morse */
  radioBeep(duration: number): void {
    const context = this.context;
    if (!context || !this.effects) return;
    const t0 = context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 780;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.015);
    gain.gain.setValueAtTime(0.07, t0 + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration + 0.05);
    osc.connect(gain);
    gain.connect(this.effects);
    osc.start(t0);
    osc.stop(t0 + duration + 0.1);
  }

  /** radio: nota de la nana (doble oscilador detunado, apagada) */
  radioNote(frequency: number): void {
    const context = this.context;
    if (!context || !this.effects) return;
    const t0 = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.035, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    for (const detune of [-7, 7]) {
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t0);
      osc.stop(t0 + 1.2);
    }
    filter.connect(gain);
    gain.connect(this.effects);
  }

  /** goteo dentro del túnel / surtidor */
  drip(): void {
    this.burst({ duration: 0.06, frequency: 2600 + Math.random() * 1200, q: 9, gain: 0.3 });
  }

  // ---- araña: drone de sub-bass mientras está en la carretera ----
  private droneNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

  startSpiderDrone(): void {
    const context = this.context;
    if (!context || this.droneNodes) return;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.5);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 130;
    const osc1 = context.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 36;
    const osc2 = context.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 37.7; // batimiento lento
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    const destination = this.ambient;
    if (!destination) return;
    gain.connect(destination);
    osc1.start();
    osc2.start();
    this.droneNodes = { osc1, osc2, gain };
  }

  stopSpiderDrone(): void {
    const nodes = this.droneNodes;
    const context = this.context;
    if (!nodes || !context) return;
    this.droneNodes = null;
    nodes.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
    window.setTimeout(() => {
      try {
        nodes.osc1.stop();
        nodes.osc2.stop();
      } catch {
        /* ya parados */
      }
    }, 700);
  }

  /** grito lejano distorsionado: wail con vibrato creciente + formante */
  scream(pan = 0, distant = true): void {
    const context = this.context;
    if (!context || !this.effects) return;
    const t0 = context.currentTime + 0.03;
    const duration = distant ? 1.15 : 0.85;
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    const output = context.createGain();
    output.gain.value = distant ? 0.55 : 1;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = distant ? 2300 : 4200;
    const formant = context.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 1050;
    formant.Q.value = 1.6;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.15, t0 + 0.07);
    master.gain.setValueAtTime(0.15, t0 + duration * 0.45);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    // vibrato creciente
    const lfo = context.createOscillator();
    lfo.frequency.value = 6.3;
    const lfoDepth = context.createGain();
    lfoDepth.gain.setValueAtTime(14, t0);
    lfoDepth.gain.linearRampToValueAtTime(85, t0 + duration);
    lfo.connect(lfoDepth);
    for (const det of [0, -38]) {
      const osc = context.createOscillator();
      osc.type = 'sawtooth';
      osc.detune.value = det;
      osc.frequency.setValueAtTime(740 + Math.random() * 70, t0);
      osc.frequency.exponentialRampToValueAtTime(430 + Math.random() * 40, t0 + duration * 0.9);
      lfoDepth.connect(osc.detune);
      osc.connect(formant);
      osc.start(t0);
      osc.stop(t0 + duration + 0.1);
    }
    // capa de aire
    const loop = this.noiseLoop(false);
    if (loop) {
      loop.filter.type = 'bandpass';
      loop.filter.frequency.value = 1300;
      loop.filter.Q.value = 1.2;
      loop.gain.gain.setValueAtTime(0.0001, t0);
      loop.gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.1);
      loop.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      loop.gain.connect(lowpass);
      loop.source.start(t0);
      loop.source.stop(t0 + duration);
    }
    formant.connect(master);
    master.connect(lowpass);
    lowpass.connect(panner);
    panner.connect(this.effects);
    lfo.start(t0);
    lfo.stop(t0 + duration + 0.1);
  }

  /** nota de caja de música: pluck de celesta con armónicos */
  musicPluck(frequency: number, gainValue: number): void {
    const context = this.context;
    if (!context || !this.ambient) return;
    const t0 = context.currentTime + 0.02;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.15);
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3400;
    const partials: [number, number][] = [
      [1, 1],
      [2.01, 0.32],
      [2.98, 0.12],
    ];
    for (const [mult, level] of partials) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequency * mult;
      osc.detune.value = (Math.random() - 0.5) * 16; // caja desafinada
      const partialGain = context.createGain();
      partialGain.gain.value = level;
      osc.connect(partialGain);
      partialGain.connect(lowpass);
      osc.start(t0);
      osc.stop(t0 + 1.2);
    }
    lowpass.connect(master);
    master.connect(this.ambient);
  }

  /** cama de lluvia: ruido blanco filtrado, gain por factor */
  private rainGain: GainNode | null = null;
  setRainLevel(level: number): void {
    const context = this.context;
    if (!context) return;
    if (!this.rainGain) {
      const loop = this.noiseLoop(false);
      if (!loop) return;
      loop.filter.type = 'highpass';
      loop.filter.frequency.value = 2400;
      this.rainGain = loop.gain;
      this.rainGain.gain.value = 0.0001;
      this.routeTo(this.rainGain, 'ambient');
      loop.source.start();
    }
    const target = Math.max(0.0001, level * 0.16);
    this.rainGain.gain.value += (target - this.rainGain.gain.value) * 0.02;
  }

  suspend(): void {
    void this.context?.suspend();
  }

  resume(): void {
    void this.context?.resume();
  }
}
