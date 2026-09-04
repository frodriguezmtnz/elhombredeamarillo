import type { AudioManager } from '../core/AudioManager';

/**
 * MusicBox — "The Road Lullaby": tema ORIGINAL procedural.
 * Caja de música desafinada, melodía menor en 3/4 a ~54 BPM,
 * crujido de vinilo + wow de cinta. Nunca suena de fondo: es un evento.
 */
export type MusicBoxMode = 'off' | 'ambient' | 'full';

export class MusicBox {
  private audio: AudioManager;
  private mode: MusicBoxMode = 'off';
  private nextNoteIn = 0;
  private step = 0;
  private loopCount = 0;
  private crackleTimer = 0.2;
  private finished = false;

  /** melodía original (La menor, compás de 3/4, negativas; null = silencio) */
  private static readonly MELODY: (number | null)[] = [
    440,
    523.25,
    659.25,
    880,
    null,
    659.25,
    698.46,
    659.25,
    587.33,
    523.25,
    null,
    null,
    493.88,
    587.33,
    698.46,
    659.25,
    null,
    523.25,
    440,
    null,
    415.3,
    440,
    null,
    null,
  ];
  private static readonly BEAT = 60 / 54;

  constructor(audio: AudioManager) {
    this.audio = audio;
  }

  get playing(): boolean {
    return this.mode !== 'off';
  }

  play(mode: 'ambient' | 'full'): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.step = 0;
    this.loopCount = 0;
    this.finished = false;
    this.nextNoteIn = 0.8;
    this.crackleTimer = 0.1;
  }

  stop(): void {
    this.mode = 'off';
  }

  update(dt: number): void {
    if (this.mode === 'off') return;

    // crujido de vinilo esporádico
    this.crackleTimer -= dt;
    if (this.crackleTimer <= 0) {
      this.crackleTimer = 0.12 + Math.random() * 0.5;
      this.audio.burst({ duration: 0.014, frequency: 2800 + Math.random() * 2400, q: 0.6, gain: 0.018 });
    }

    this.nextNoteIn -= dt;
    if (this.nextNoteIn > 0) return;

    const melodyLength = MusicBox.MELODY.length;
    const index = this.step % melodyLength;
    const note = MusicBox.MELODY[index];
    const isLoopEnd = index === melodyLength - 1;
    if (isLoopEnd) this.loopCount++;

    // en ambiente, algunas notas se pierden (la caja está lejos / rota)
    const ambientSkip = this.mode === 'ambient' && Math.random() < 0.3;
    if (note !== null && !ambientSkip) {
      this.audio.musicPluck(note, this.mode === 'full' ? 0.16 : 0.09);
    }
    this.step++;
    // wow de cinta: micro-jitter temporal
    this.nextNoteIn = MusicBox.BEAT * (1 + (Math.random() - 0.5) * 0.06);

    // en 'full', tras dos vueltas → acorde final desplegado y silencio
    if (this.mode === 'full' && this.loopCount >= 2 && isLoopEnd && !this.finished) {
      this.finished = true;
      this.audio.musicPluck(440, 0.14);
      this.audio.musicPluck(523.25, 0.12);
      this.audio.musicPluck(659.25, 0.12);
      this.audio.musicPluck(880, 0.1);
      this.mode = 'off';
    }
  }
}
