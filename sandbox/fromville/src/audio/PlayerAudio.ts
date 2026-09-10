import type { AudioManager } from '../core/AudioManager';

/**
 * PlayerAudio (`TECH_ARCHITECTURE §8`): todo lo que suena "pegado al cuerpo". Reenvía los pasos y
 * mantiene una respiración procedural (ruido filtrado + LFO de pechada) que sube al correr y baja al
 * descansar. El castigo por ruido (atraer criaturas) lo consumirá la IA en Fase 8.
 */
export class PlayerAudio {
  private breath: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private breathLfo: OscillatorNode | null = null;
  private started = false;

  constructor(private readonly audio: AudioManager) {}

  start(): void {
    const ctx = this.audio.audioContext;
    const bus = this.audio.player;
    if (!ctx || !bus || this.started) return;
    const bed = this.audio.noiseLoop(true);
    if (bed) {
      bed.filter.type = 'bandpass';
      bed.filter.frequency.value = 460;
      bed.filter.Q.value = 0.6;
      bed.gain.gain.value = 0.0001;
      bed.gain.connect(bus);
      bed.source.start();
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.0001;
      lfo.connect(lfoDepth);
      lfoDepth.connect(bed.gain.gain);
      lfo.start();
      this.breath = bed;
      this.breathLfo = lfo;
      this.started = true;
    }
  }

  footstep(running: boolean): void {
    this.audio.footstep(running);
  }

  /** 0 = quieto, 1 = sprint sostenido. */
  setExertion(level: number): void {
    const ctx = this.audio.audioContext;
    if (!ctx || !this.breath) return;
    const t = ctx.currentTime;
    const bedLevel = 0.004 + level * 0.03;
    this.breath.gain.gain.setTargetAtTime(bedLevel, t, 0.4);
    this.breathLfo?.frequency.setTargetAtTime(0.5 + level * 1.6, t, 0.3);
  }

  stop(): void {
    try {
      this.breathLfo?.stop();
      this.breath?.source.stop();
    } catch {
      /* ya parados */
    }
    this.started = false;
  }
}
