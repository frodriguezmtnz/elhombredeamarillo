import type { GameEventDef } from './GameEvent';

/**
 * EventManager — eventos activables por distancia/fase/loops/intento.
 * Evaluación barata: cada def decide con su condition().
 */
export class EventManager {
  private defs: GameEventDef[] = [];
  private firedOnce = new Set<string>();
  private firedThisAttempt = new Set<string>();
  private lastFireAt = new Map<string, number>();

  register(...definitions: GameEventDef[]): void {
    this.defs.push(...definitions);
  }

  /** nuevo intento de fuga: rearmar los everyAttempt */
  beginAttempt(): void {
    this.firedThisAttempt.clear();
  }

  reset(): void {
    this.firedOnce.clear();
    this.firedThisAttempt.clear();
    this.lastFireAt.clear();
  }

  update(
    context: Parameters<GameEventDef['condition']>[0],
    api: Parameters<GameEventDef['fire']>[0],
    now: number,
  ): void {
    for (const def of this.defs) {
      if (def.once && this.firedOnce.has(def.id)) continue;
      if (def.everyAttempt && this.firedThisAttempt.has(def.id)) continue;
      if (def.cooldown) {
        const last = this.lastFireAt.get(def.id);
        if (last !== undefined && now - last < def.cooldown) continue;
      }
      if (!def.condition(context)) continue;
      def.fire(api, context);
      this.lastFireAt.set(def.id, now);
      if (def.once) this.firedOnce.add(def.id);
      if (def.everyAttempt) this.firedThisAttempt.add(def.id);
    }
  }
}
