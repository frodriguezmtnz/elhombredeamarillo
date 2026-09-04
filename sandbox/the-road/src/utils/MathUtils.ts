export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function wrap01(value: number): number {
  return value - Math.floor(value);
}

export function wrapRange(value: number, min: number, max: number): number {
  const span = max - min;
  return value - span * Math.floor((value - min) / span);
}

/** Interpolación exponencial independiente del framerate. */
export function damp(current: number, target: number, halfLife: number, dt: number): number {
  if (halfLife <= 0) return target;
  return lerp(target, current, 2 ** (-dt / halfLife));
}

export function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % TAU;
  if (diff > Math.PI) diff -= TAU;
  if (diff < -Math.PI) diff += TAU;
  return diff;
}

/** distancia mínima entre dos coordenadas de arco en un anillo cerrado */
export function ringDelta(a: number, b: number, length: number): number {
  const d = Math.abs(a - b) % length;
  return Math.min(d, length - d);
}
