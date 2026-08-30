import type { AudioManager } from '../core/AudioManager';
import { damp } from '../utils/MathUtils';

/**
 * CarAudio — motor + rodadura 100% procedurales.
 * Motor: dos osciladores (saw + square sub) con lowpass; tono según velocidad.
 * Rodadura: ruido filtrado cuyo gain/frecuencia suben con la velocidad.
 */
export class CarAudio {
  private audio: AudioManager;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private tires: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private started = false;
  /** timestamp hasta el que el motor está calado */
  private stalledUntil = 0;
  private tunnel = false;

  constructor(audio: AudioManager) {
    this.audio = audio;
  }

  start(): void {
    if (this.started || !this.audio.ready) return;
    const context = this.audio.audioContext;
    if (!context) return;
    this.started = true;

    this.engineGain = context.createGain();
    this.engineGain.gain.value = 0.0001;
    this.engineFilter = context.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 700;
    this.engineFilter.Q.value = 1.4;
    this.engineFilter.connect(this.engineGain);
    this.audio.routeTo(this.engineGain, 'effects');

    this.osc1 = context.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.value = 58;
    this.osc1.connect(this.engineFilter);
    this.osc1.start();

    this.osc2 = context.createOscillator();
    this.osc2.type = 'square';
    this.osc2.frequency.value = 29;
    const subGain = context.createGain();
    subGain.gain.value = 0.45;
    this.osc2.connect(subGain);
    subGain.connect(this.engineFilter);
    this.osc2.start();

    const tires = this.audio.noiseLoop(true);
    if (tires) {
      tires.filter.type = 'lowpass';
      tires.filter.frequency.value = 260;
      tires.gain.gain.value = 0.0001;
      this.audio.routeTo(tires.gain, 'ambient');
      tires.source.start();
      this.tires = tires;
    }
  }

  /** cala el motor durante `seconds` (eventos de susto) */
  stall(seconds = 1.4): void {
    this.stalledUntil = this.audio.now + seconds;
  }

  setTunnel(inside: boolean): void {
    this.tunnel = inside;
  }

  /** speedRatio 0..1 (módulo), throttle 0..1, offroad 0..1 */
  update(dt: number, speedRatio: number, throttle: number, offroad: number): void {
    if (!this.started || !this.osc1 || !this.osc2 || !this.engineGain || !this.engineFilter) return;
    const stalled = this.audio.now < this.stalledUntil;
    const rpm = stalled ? 0 : 0.14 + speedRatio * 0.86;
    const targetFreq = stalled ? 22 : 52 + rpm * 175 + Math.sin(this.audio.now * 8.3) * 2.2;
    this.osc1.frequency.value = damp(this.osc1.frequency.value, targetFreq, 0.05, dt);
    this.osc2.frequency.value = this.osc1.frequency.value * 0.5;
    this.engineFilter.frequency.value = damp(
      this.engineFilter.frequency.value,
      stalled ? 160 : 420 + rpm * 1500 + (this.tunnel ? 500 : 0),
      0.14,
      dt,
    );
    const engineTarget = stalled ? 0.0001 : 0.035 + speedRatio * 0.075 + throttle * 0.05 + (this.tunnel ? 0.02 : 0);
    this.engineGain.gain.value = damp(this.engineGain.gain.value, engineTarget, stalled ? 0.03 : 0.11, dt);
    if (this.tires) {
      const roll = speedRatio * (0.05 + offroad * 0.16) * (this.tunnel ? 1.5 : 1);
      this.tires.gain.gain.value = damp(this.tires.gain.gain.value, Math.max(0.0001, roll), 0.12, dt);
      this.tires.filter.frequency.value = 180 + speedRatio * 240 + offroad * 120;
    }
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.tires?.source.stop();
    } catch {
      /* ignore */
    }
    this.osc1 = null;
    this.osc2 = null;
    this.tires = null;
    this.engineGain = null;
    this.engineFilter = null;
  }
}
