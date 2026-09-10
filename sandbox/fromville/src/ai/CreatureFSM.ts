export type CreatureState =
  | 'Dormant'
  | 'Patrol'
  | 'Investigate'
  | 'Observe'
  | 'Stalk'
  | 'Chase'
  | 'Search'
  | 'Retreat'
  | 'Consume';

/** Qué se le pide al movimiento este frame (el `Creature` lo traduce a steering). */
export type Intent = 'idle' | 'hold' | 'seek' | 'lastKnown' | 'patrol' | 'stalkFollow' | 'retreat';

export interface FsmSignals {
  dt: number;
  awareness: number;
  dist: number;
  canSee: boolean;
  /** posición del jugador (para registrar lastKnown) */
  px: number;
  pz: number;
  /** de noche (NIGHT/DANGER): la criatura está despierta */
  active: boolean;
  /** el jugador está en un refugio cerrado+sellado → intocable */
  safe: boolean;
  /** al alcance de captura */
  caught: boolean;
}

/**
 * CreatureFSM (AI.md §2, capa 2). Dos capas: la percepción entrega `awareness` y ESTE autómata lo
 * modula en transiciones. Estados con intención de terror: Observe (quieto mirando), Stalk (te sigue
 * a distancia, lo oyes más que lo ves), Chase (breve y con reglas), Search (última posición). La
 * criatura NUNCA corre (AI.md §2.7): el Chase es corto y se pierde rompiendo contacto / metiéndose
 * en un refugio. El Horror Director (Fase 9) podrá forzar `setMode`.
 */
export class CreatureFSM {
  state: CreatureState = 'Dormant';
  intent: Intent = 'idle';
  /** última posición conocida del jugador (para Investigate/Search) */
  readonly lastKnown = { x: 0, z: 0, valid: false };

  private observeTimer = 0;
  private stalkTimer = 0;
  private chaseTimer = 0;
  private searchTimer = 0;

  /** el Director fija un modo y objetivo (AI.md §5). */
  setMode(state: CreatureState, target?: { x: number; z: number }): void {
    this.state = state;
    if (target) {
      this.lastKnown.x = target.x;
      this.lastKnown.z = target.z;
      this.lastKnown.valid = true;
    }
    this.enter(state);
  }

  /** amanecer / retirada al Den. */
  recall(): void {
    this.state = 'Retreat';
    this.enter('Retreat');
  }

  update(s: FsmSignals): { state: CreatureState; intent: Intent } {
    if (s.awareness > 0.5 && !s.safe) {
      this.lastKnown.x = s.px ?? this.lastKnown.x;
      this.lastKnown.valid = true;
    }
    // retirada global al amanecer (menos Dormant/Consume)
    if (!s.active && this.state !== 'Dormant' && this.state !== 'Consume' && this.state !== 'Retreat') {
      this.goto('Retreat');
    }

    switch (this.state) {
      case 'Dormant':
        this.intent = 'idle';
        if (s.active) this.goto('Patrol');
        break;

      case 'Patrol':
        this.intent = 'patrol';
        if (s.awareness > 0.72 && s.canSee && s.dist < 18) this.goto('Observe');
        else if (s.awareness > 0.35) this.goto('Investigate');
        break;

      case 'Investigate':
        this.intent = 'lastKnown';
        if (s.awareness > 0.72 && s.canSee) this.goto('Observe');
        else if (s.awareness < 0.2) this.goto('Patrol');
        break;

      case 'Observe':
        this.intent = 'hold';
        this.observeTimer += s.dt;
        if (s.awareness > 0.82) this.goto('Stalk');
        else if (this.observeTimer > 3.5 || s.awareness < 0.3) {
          this.observeTimer = 0;
          this.goto('Patrol');
        }
        break;

      case 'Stalk':
        this.intent = 'stalkFollow';
        this.stalkTimer += s.dt;
        // se mantiene a distancia y "decide": si te tiene muy localizado (linterna/ruido) y
        // lleva un rato acechando, corta la distancia y persigue (Chase).
        if (s.awareness > 0.9 && (this.stalkTimer > 2 || s.dist < 7)) this.goto('Chase');
        else if (s.awareness < 0.35) this.goto('Search');
        break;

      case 'Chase':
        this.intent = 'seek';
        this.chaseTimer += s.dt;
        if (s.caught && !s.safe) this.goto('Consume');
        else if (s.safe || s.awareness < 0.45 || this.chaseTimer > 12) {
          this.chaseTimer = 0;
          this.goto('Search');
        }
        break;

      case 'Search':
        this.intent = 'lastKnown';
        this.searchTimer += s.dt;
        if (s.awareness > 0.7 && s.canSee) this.goto('Observe');
        else if (this.searchTimer > 8 || s.awareness < 0.12) {
          this.searchTimer = 0;
          this.goto('Patrol');
        }
        break;

      case 'Retreat':
        this.intent = 'retreat';
        break;

      case 'Consume':
        this.intent = 'idle';
        break;
    }
    return { state: this.state, intent: this.intent };
  }

  private goto(next: CreatureState): void {
    this.state = next;
    this.enter(next);
  }

  private enter(state: CreatureState): void {
    if (state === 'Observe') this.observeTimer = 0;
    if (state === 'Stalk') this.stalkTimer = 0;
    if (state === 'Chase') this.chaseTimer = 0;
    if (state === 'Search') this.searchTimer = 0;
  }
}
