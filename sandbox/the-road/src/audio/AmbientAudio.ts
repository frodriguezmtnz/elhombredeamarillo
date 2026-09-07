import type { AudioManager } from '../core/AudioManager';
import { Random } from '../utils/Random';

interface NoiseLayer {
  source: AudioBufferSourceNode;
  gain: GainNode;
  lfo: OscillatorNode | null;
}

/**
 * AmbientAudio — ambiente 100% procedural (sin archivos):
 * viento (ruido brown + LFO), insectos nocturnos, cuervos lejanos
 * y zumbido eléctrico del pueblo (por factor de cercanía).
 */
export class AmbientAudio {
  private audio: AudioManager;
  private wind: NoiseLayer | null = null;
  private insects: NoiseLayer | null = null;
  private humGain: GainNode | null = null;
  private crowTimer = 6;
  private rand = new Random(777);
  private running = false;

  constructor(audio: AudioManager) {
    this.audio = audio;
  }

  start(): void {
    if (this.running || !this.audio.ready) return;
    const context = this.audio.audioContext;
    if (!context) return;
    this.running = true;

    // ---- viento ----
    const wind = this.audio.noiseLoop(true);
    if (wind) {
      wind.filter.type = 'lowpass';
      wind.filter.frequency.value = 340;
      wind.filter.Q.value = 0.6;
      wind.gain.gain.value = 0.14;
      this.audio.routeTo(wind.gain, 'ambient');
      const lfo = this.audio.createLfo(0.06, 0.09, wind.gain.gain);
      wind.source.start();
      this.wind = { source: wind.source, gain: wind.gain, lfo };
    }

    // ---- insectos ----
    const insects = this.audio.noiseLoop(false);
    if (insects) {
      insects.filter.type = 'bandpass';
      insects.filter.frequency.value = 5200;
      insects.filter.Q.value = 9;
      insects.gain.gain.value = 0.011;
      this.audio.routeTo(insects.gain, 'ambient');
      const lfo = this.audio.createLfo(0.31, 0.007, insects.gain.gain);
      insects.source.start();
      this.insects = { source: insects.source, gain: insects.gain, lfo };
    }

    // ---- zumbido del pueblo (transformadores) ----
    this.humGain = context.createGain();
    this.humGain.gain.value = 0.0001;
    this.audio.routeTo(this.humGain, 'ambient');
    const humOsc = context.createOscillator();
    humOsc.type = 'sawtooth';
    humOsc.frequency.value = 55;
    const humFilter = context.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 160;
    humOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    humOsc.start();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    try {
      this.wind?.source.stop();
      this.insects?.source.stop();
      this.wind?.lfo?.stop();
      this.insects?.lfo?.stop();
    } catch {
      /* ya parados */
    }
    this.wind = null;
    this.insects = null;
  }

  /** cuervos ocasionales; wind 0..1; villageFactor 0..1 (cercanía al pueblo) */
  update(dt: number, windIntensity: number, villageFactor = 0): void {
    if (!this.running) return;
    if (this.wind) {
      const target = 0.1 + windIntensity * 0.22;
      this.wind.gain.gain.value += (target - this.wind.gain.gain.value) * Math.min(1, dt * 1.6);
    }
    if (this.humGain) {
      const target = villageFactor * 0.028;
      this.humGain.gain.value += (target - this.humGain.gain.value) * Math.min(1, dt * 0.9);
    }
    this.crowTimer -= dt;
    if (this.crowTimer <= 0) {
      this.crowTimer = this.rand.range(9, 26);
      if (villageFactor < 0.6) this.caw();
    }
  }

  private caw(): void {
    const base = 430 + this.rand.range(0, 160);
    const count = 2 + this.rand.int(0, 2);
    for (let i = 0; i < count; i++) {
      setTimeout(
        () => {
          if (!this.running) return;
          this.audio.beep(base - i * 18, 0.16, { type: 'sawtooth', gain: 0.028 });
          this.audio.burst({ duration: 0.14, frequency: base * 2.2, q: 3, gain: 0.02 });
        },
        i * (200 + this.rand.int(0, 120)),
      );
    }
  }
}
