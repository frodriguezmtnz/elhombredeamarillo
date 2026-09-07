/**
 * Estados del juego.
 * - CoreState: estado global de alto nivel (controla qué sistemas se actualizan).
 * - StoryPhase: fase narrativa del MVP (qué está pasando en la historia).
 */
export type CoreState = 'BOOT' | 'MENU' | 'DRIVING' | 'ON_FOOT' | 'PAUSED' | 'ENDING';

export type StoryPhase =
  | 'INTRO' // conduciendo hacia el árbol
  | 'TREE' // árbol descubierto / bloquea la carretera
  | 'TURN_BACK' // vuelve al coche y retrocede
  | 'APPROACH_VILLAGE' // primera aparición del pueblo
  | 'VILLAGE' // explorando el pueblo
  | 'ESCAPE' // intentando huir por la carretera
  | 'RETURN' // reconociendo que vuelve
  | 'PHOTO' // descubrimiento de la fotografía
  | 'END'; // tarjeta final

export interface GameStateEvents {
  stateChanged: { from: CoreState; to: CoreState };
  phaseChanged: { from: StoryPhase; to: StoryPhase };
}

type Handler<T> = (payload: T) => void;

/** Emisor tipado mínimo (sin dependencias, sin hacks). */
export class GameState {
  current: CoreState = 'BOOT';
  phase: StoryPhase = 'INTRO';

  private listeners = new Map<string, Set<Handler<never>>>();

  setState(next: CoreState): void {
    if (next === this.current) return;
    const from = this.current;
    this.current = next;
    this.emit('stateChanged', { from, to: next });
  }

  setPhase(next: StoryPhase): void {
    if (next === this.phase) return;
    const from = this.phase;
    this.phase = next;
    this.emit('phaseChanged', { from, to: next });
  }

  on<K extends keyof GameStateEvents>(event: K, handler: Handler<GameStateEvents[K]>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(handler as Handler<never>);
  }

  private emit<K extends keyof GameStateEvents>(event: K, payload: GameStateEvents[K]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      (handler as Handler<GameStateEvents[K]>)(payload);
    }
  }
}
