import { Random } from '../utils/Random';

/**
 * Radio — tres estaciones: OFF → NÚMEROS (morse "TURN BACK") → NANA → OFF.
 * La estática sube al pasar junto a la figura (staticBoost desde el Game).
 */
export type RadioStation = 'off' | 'numbers' | 'lullaby';

const MORSE: Record<string, string> = {
  T: '-',
  U: '..-',
  R: '.-.',
  N: '-.',
  B: '-...',
  A: '.-',
  C: '-.-.',
  K: '-.-',
};

export class Radio {
  private audio: RadioAudioHost;
  private station: RadioStation = 'off';
  private rand = new Random(4242);
  private morseTimer = 0;
  private morseIndex = 0;
  private lullabyTimer = 0;
  private lullabyNote = 0;
  private staticGainNode: GainNode | null = null;
  private started = false;
  /** secuencia completa de símbolos (''=silencio entre letras) */
  private morseSequence: string[] = Radio.buildMorse('TURNBACK');

  private static buildMorse(word: string): string[] {
    const sequence: string[] = [];
    for (const char of word) {
      const symbols = MORSE[char] ?? '';
      for (const symbol of symbols) sequence.push(symbol);
      sequence.push('');
    }
    return sequence;
  }

  constructor(audio: RadioAudioHost) {
    this.audio = audio;
  }

  get current(): RadioStation {
    return this.station;
  }

  /** construye la base (cama de estática) la primera vez que se enciende */
  private ensureBuilt(): void {
    if (this.started) return;
    this.started = true;
    this.staticGainNode = this.audio.radioStaticBed();
  }

  /** el morse cambia de palabra (anomalía en loop 2+) */
  setWord(word: string): void {
    this.morseSequence = Radio.buildMorse(word);
    this.morseIndex = 0;
  }

  cycle(): RadioStation {
    this.ensureBuilt();
    this.station = this.station === 'off' ? 'numbers' : this.station === 'numbers' ? 'lullaby' : 'off';
    this.morseIndex = 0;
    this.morseTimer = 0.4;
    this.lullabyNote = 0;
    this.lullabyTimer = 0.2;
    if (this.staticGainNode) this.staticGainNode.gain.value = this.station === 'off' ? 0.0001 : 0.03;
    return this.station;
  }

  /** staticBoost 0..1 (cerca de la figura) */
  update(dt: number, staticBoost: number): void {
    if (this.station === 'off' || !this.started) return;
    if (this.staticGainNode) {
      const base = 0.025 + staticBoost * 0.3;
      this.staticGainNode.gain.value += (base - this.staticGainNode.gain.value) * Math.min(1, dt * 3);
    }
    if (this.station === 'numbers') this.updateNumbers(dt);
    else this.updateLullaby(dt);
  }

  private updateNumbers(dt: number): void {
    this.morseTimer -= dt;
    if (this.morseTimer > 0) return;
    const symbol = this.morseSequence[this.morseIndex % this.morseSequence.length];
    if (symbol === '.') {
      this.audio.radioBeep(0.07);
      this.morseTimer = 0.24;
    } else if (symbol === '-') {
      this.audio.radioBeep(0.22);
      this.morseTimer = 0.4;
    } else {
      this.morseTimer = 0.55; // pausa entre letras
    }
    this.morseIndex++;
    if (this.morseIndex % this.morseSequence.length === 0) this.morseTimer = 2.2; // pausa entre repeticiones
  }

  private updateLullaby(dt: number): void {
    this.lullabyTimer -= dt;
    if (this.lullabyTimer > 0) return;
    const notes = [659, 587, 523, 392];
    const note = notes[this.lullabyNote % notes.length];
    this.audio.radioNote(note);
    this.lullabyNote++;
    this.lullabyTimer = this.rand.range(0.9, 1.5);
  }
}

/** host mínimo (evita acoplar el Radio al AudioManager completo) */
export interface RadioAudioHost {
  radioStaticBed(): GainNode | null;
  radioBeep(duration: number): void;
  radioNote(frequency: number): void;
}
