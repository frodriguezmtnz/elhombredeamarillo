import type { AudioManager } from '../core/AudioManager';
import { clamp } from '../utils/MathUtils';

interface WindBed {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

/**
 * AmbientAudio (`TECH_ARCHITECTURE §8`): la **mantle** continua no-posicional (viento/ráfagas con
 * LFO + drone sub-bass que crece de noche). Reacciona al `dayFactor` (más viento/graves de noche).
 * Expone `setIntensity()` para que el Horror Director pueda cortar el ambiente de golpe (`silence()`,
 * `HORROR_SYSTEM §5`).
 */
export class AmbientAudio {
  private wind: WindBed | null = null;
  private gustLfo: OscillatorNode | null = null;
  private drone: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
  private intensity = 1;
  private started = false;

  constructor(private readonly audio: AudioManager) {}

  start(): void {
    const ctx = this.audio.audioContext;
    const bus = this.audio.ambient;
    if (!ctx || !bus || this.started) return;

    const wind = this.audio.noiseLoop(true);
    if (wind) {
      wind.filter.type = 'lowpass';
      wind.filter.frequency.value = 520;
      wind.gain.gain.value = 0.0001;
      wind.gain.connect(bus);
      wind.source.start();
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const depth = ctx.createGain();
      depth.gain.value = 240;
      lfo.connect(depth);
      depth.connect(wind.filter.frequency);
      lfo.start();
      this.wind = wind;
      this.gustLfo = lfo;
    }

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.0001;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 150;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 36;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 37.6; // batimiento lento
    osc1.connect(droneFilter);
    osc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(bus);
    osc1.start();
    osc2.start();
    this.drone = { osc1, osc2, gain: droneGain };

    this.started = true;
  }

  setIntensity(value: number): void {
    this.intensity = clamp(value, 0, 1);
  }

  update(dayFactor: number): void {
    const ctx = this.audio.audioContext;
    if (!ctx || !this.started) return;
    const t = ctx.currentTime;
    const wind = (0.05 + (1 - dayFactor) * 0.08) * this.intensity;
    const drone = (1 - dayFactor) ** 1.7 * 0.2 * this.intensity;
    this.wind?.gain.gain.setTargetAtTime(Math.max(0.0001, wind), t, 0.6);
    this.drone?.gain.gain.setTargetAtTime(Math.max(0.0001, drone), t, 0.9);
  }

  stop(): void {
    try {
      this.gustLfo?.stop();
      this.drone?.osc1.stop();
      this.drone?.osc2.stop();
      this.wind?.source.stop();
    } catch {
      /* ya parados */
    }
    this.started = false;
  }
}
