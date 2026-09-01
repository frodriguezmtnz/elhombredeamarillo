import { ringDelta } from '../utils/MathUtils';
import type { GameEventDef } from './GameEvent';

/** posiciones de los landmarks (coinciden con Props/World) */
export const LANDMARK_S = {
  wreckNear: 520,
  slowSign: 450,
  wreckFar: 380,
  townSign: 205,
  figure: 1120,
  barrier: 225,
  lake: 620,
  lighthouse: 1900,
  swing: 700,
  markers: 300,
  skids: 480,
  bicycle: 300,
} as const;

const near = (s: number, target: number, ringLength: number, margin = 12): boolean =>
  ringDelta(s, target, ringLength) < margin;

/**
 * Eventos de carretera: reconocimiento (ha vuelto al mismo sitio)
 * y pequeñas anomalías que crecen con los intentos.
 */
export function roadEvents(): GameEventDef[] {
  return [
    {
      id: 'barrier-block',
      once: true,
      condition: (ctx) => ctx.phase === 'INTRO' && near(ctx.s, LANDMARK_S.barrier, ctx.ringLength, 10),
      fire: (api) =>
        api.caption(
          'A road-crew barricade blocks the way back. There is no road crew. There was never a road crew.',
          6,
        ),
    },
    {
      id: 'lake-first',
      once: true,
      condition: (ctx) => near(ctx.s, LANDMARK_S.lake, ctx.ringLength, 55),
      fire: (api) =>
        api.caption('A lake to the left. The moon lies on it, perfectly still. The water does not move.', 6),
    },
    {
      id: 'radio-static-intro',
      once: true,
      condition: (ctx) => ctx.phase === 'INTRO' && near(ctx.s, 500, ctx.ringLength, 60),
      fire: (api) =>
        api.caption('The radio finds a station for half a second. Numbers, read slowly. Then static.', 5.5),
    },
    {
      id: 'swing-first',
      once: true,
      condition: (ctx) => near(ctx.s, LANDMARK_S.swing, ctx.ringLength, 24),
      fire: (api) => api.caption('A playground. One swing is moving. There is no wind.', 5.5),
    },
    {
      id: 'markers-first',
      once: true,
      condition: (ctx) => near(ctx.s, LANDMARK_S.markers, ctx.ringLength, 16),
      fire: (api) => api.caption('A mile marker: 3. They all say 3. Every single one of them says 3.', 5),
    },
    {
      id: 'skids-first',
      once: true,
      condition: (ctx) => near(ctx.s, LANDMARK_S.skids, ctx.ringLength, 22),
      fire: (api) => api.caption('Fresh skid marks. They end in the middle of the road. There is no impact.', 5),
    },
    {
      id: 'bicycle-first',
      once: true,
      condition: (ctx) => near(ctx.s, LANDMARK_S.bicycle, ctx.ringLength, 18),
      fire: (api) => api.caption("A child's bicycle on the shoulder. The front wheel is still turning.", 5),
    },
    {
      id: 'lighthouse-first',
      once: true,
      condition: (ctx) => ctx.attempts >= 1 && near(ctx.s, LANDMARK_S.lighthouse, ctx.ringLength, 90),
      fire: (api) => api.narration('A lighthouse, far off the road. The nearest coast is a hundred miles away.', 6),
    },
    {
      id: 'sign-slow-first',
      once: true,
      condition: (ctx) => ctx.phase === 'TURN_BACK' && near(ctx.s, LANDMARK_S.slowSign, ctx.ringLength),
      fire: (api) => api.caption('REDUCE SPEED, NEXT TWO MILES. You do not remember this sign on the way in.', 5.5),
    },
    {
      id: 'wreck-near-first',
      once: true,
      condition: (ctx) => ctx.phase === 'TURN_BACK' && near(ctx.s, LANDMARK_S.wreckNear, ctx.ringLength),
      fire: (api) => api.caption('A burnt-out wagon on the shoulder. Nobody has stopped here in a long time.', 5),
    },
    {
      id: 'wreck-far-first',
      once: true,
      condition: (ctx) => ctx.phase === 'TURN_BACK' && near(ctx.s, LANDMARK_S.wreckFar, ctx.ringLength),
      fire: (api) => api.caption('A white pickup, dust on the windshield. The bonnet is cold.', 5),
    },
    // ---- reconocimientos durante las fugas ----
    {
      id: 'wreck-near-again',
      everyAttempt: true,
      condition: (ctx) => ctx.phase === 'ESCAPE' && near(ctx.s, LANDMARK_S.wreckNear, ctx.ringLength),
      fire: (api, ctx) =>
        api.caption(
          ctx.attempts === 1 ? 'The same burnt-out wagon. The same missing hubcap.' : 'It has not moved. Not one inch.',
          4.5,
        ),
    },
    {
      id: 'wreck-far-again',
      everyAttempt: true,
      condition: (ctx) => ctx.phase === 'ESCAPE' && near(ctx.s, LANDMARK_S.wreckFar, ctx.ringLength),
      fire: (api, ctx) =>
        api.caption(
          ctx.attempts >= 2
            ? 'The white pickup again. You are almost sure it was on the other side of the road.'
            : 'The white pickup again. Dust, undisturbed.',
          4.5,
        ),
    },
    {
      id: 'slow-sign-again',
      everyAttempt: true,
      condition: (ctx) => ctx.phase === 'ESCAPE' && near(ctx.s, LANDMARK_S.slowSign, ctx.ringLength),
      fire: (api) => api.caption('REDUCE SPEED. As if the sign knew you would be back.', 4),
    },
    {
      id: 'town-sign-pass',
      once: true,
      condition: (ctx) =>
        (ctx.phase === 'TURN_BACK' || ctx.phase === 'VILLAGE') && near(ctx.s, LANDMARK_S.townSign, ctx.ringLength),
      fire: (api) => api.caption('"MARROW FALLS — POP. 114". The last digit looks newer than the rest.', 5.5),
    },
    // ---- anomalías ----
    {
      id: 'figure-first',
      once: true,
      condition: (ctx) =>
        ctx.attempts >= 1 && ctx.phase === 'ESCAPE' && near(ctx.s, LANDMARK_S.figure, ctx.ringLength, 30),
      fire: (api) => api.showFigure(),
    },
    {
      id: 'town-sign-population',
      once: true,
      condition: (ctx) => ctx.attempts >= 2 && near(ctx.s, LANDMARK_S.townSign, ctx.ringLength, 10),
      fire: (api) => {
        api.swapTownSign();
        api.caption('"MARROW FALLS — POP. 115". You read that number before. It was different.', 6);
      },
    },
    {
      id: 'radio-static',
      everyAttempt: true,
      cooldown: 90,
      condition: (ctx) => ctx.phase === 'ESCAPE' && ctx.speed > 10,
      fire: (api) => api.caption('The engine note climbs, then drops. Like something breathing between stations.', 4.5),
    },
  ];
}
