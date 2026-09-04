import type { GameEventDef } from './GameEvent';

/**
 * Eventos del pueblo: vida inquietante y primeros cambios imposibles.
 * (los grandes cambios visuales los aplica Village.applyLoopState)
 */
export function villageEvents(villageCenter: { x: number; z: number }): GameEventDef[] {
  const dist = (px: number, pz: number, x: number, z: number): number => Math.hypot(px - x, pz - z);

  return [
    {
      id: 'village-silence',
      once: true,
      condition: (ctx) => ctx.phase === 'VILLAGE' && ctx.loops === 0,
      fire: (api) => api.caption('No dogs. No televisions. The whole town is listening to something else.', 6),
    },
    {
      id: 'motel-sound',
      once: true,
      condition: (ctx) =>
        ctx.phase === 'VILLAGE' &&
        ctx.loops >= 1 &&
        dist(ctx.playerPos.x, ctx.playerPos.z, villageCenter.x, villageCenter.z) < 60,
      fire: (api) => api.caption('Behind the motel, something settles. Dust slides off the eaves, all at once.', 5),
    },
    {
      id: 'streetlight-wave',
      everyAttempt: true,
      cooldown: 45,
      condition: (ctx) =>
        ctx.phase === 'VILLAGE' &&
        ctx.loops >= 2 &&
        dist(ctx.playerPos.x, ctx.playerPos.z, villageCenter.x, villageCenter.z) < 80,
      fire: (api) => api.caption('The streetlights dim in a slow wave, like something passing under them.', 5),
    },
  ];
}
