/**
 * Especificación compartida del cartel de neón "TRIVIAL — FromVille".
 * La usan las tres fases del comparativa:
 *   A) sandbox/neon-trivial-svg.html     (SVG + CSS puro)
 *   B) scripts/build-neon-lottie.mjs     (generador del .json Lottie)
 *   C) sandbox/neon-trivial-compare.html (comparativa visual A vs B)
 *
 * Todo en coordenadas del lienzo 1200x480 con fondo transparente
 * (en la web irá como fondo de la sección #juego sobre --color-bg).
 */

export const NEON = {
  canvas: { w: 1200, h: 480 },

  /** 30 fps · intro de encendido [0..introEnd] · loop perfecto [introEnd..loopEnd] */
  timing: { fr: 30, introEnd: 26, loopEnd: 206 },

  colors: {
    yellow: { rgb: [0.957, 0.788, 0.263], css: '#f4c943' },
    white: { rgb: [1.0, 0.965, 0.855], css: '#fff6da' },
    pureWhite: { rgb: [1, 1, 1], css: '#ffffff' },
    red: { rgb: [1.0, 0.231, 0.188], css: '#ff3b30' },
    redCore: { rgb: [1.0, 0.875, 0.847], css: '#ffdfda' },
    ivory: { rgb: [0.945, 0.922, 0.863], css: '#f1ebdc' },
    ink: { rgb: [0.02, 0.02, 0.015], css: '#050504' },
  },

  /** Marco exterior del cartel (tubo rojo fino) */
  frame: { x: 40, y: 36, w: 1120, h: 408, r: 18, core: { w: 3, o: 85 }, halo: { w: 14, o: 16 } },

  /** Líneas de texto (fuente VT323, la del sitio; en B se vectoriza con opentype.js) */
  lines: [
    {
      id: 'trivial',
      text: 'TRIVIAL',
      size: 196,
      center: [600, 190],
      glow: 'yellow',
      coreCss: '#fff6da',
      strokes: { far: { w: 12, o: 10 }, near: { w: 5, o: 26 }, core: { w: 2, o: 100 } },
      /** flicker en frames absolutos; el valor de introEnd y loopEnd debe coincidir (loop perfecto) */
      flicker: [
        [26, 100],
        [52, 100],
        [55, 45],
        [58, 100],
        [120, 100],
        [123, 62],
        [126, 100],
        [186, 100],
        [189, 28],
        [192, 100],
        [206, 100],
      ],
    },
    {
      id: 'fromville',
      text: 'FromVille',
      size: 88,
      center: [600, 322],
      glow: 'red',
      coreCss: '#ffdfda',
      strokes: { far: { w: 8, o: 10 }, near: { w: 3.5, o: 28 }, core: { w: 1.6, o: 100 } },
      /** tubo "averiado": parpadeo más nervioso */
      flicker: [
        [26, 100],
        [40, 12],
        [44, 100],
        [48, 12],
        [52, 100],
        [96, 55],
        [100, 100],
        [150, 8],
        [155, 95],
        [160, 8],
        [166, 100],
        [200, 100],
        [206, 100],
      ],
    },
  ],

  /** Subrayado bajo FromVille (tubo rojo, parpadea solidario con la línea) */
  underline: {
    x1: 396,
    x2: 804,
    y: 372,
    strokes: { far: { w: 24, o: 9 }, near: { w: 11, o: 26 }, core: { w: 3, o: 95 } },
  },

  /** Talismán colgado a la izquierda (paths calcados de Talisman404.astro, escala 0.42) */
  talisman: {
    pos: [146, 236],
    scale: 0.42,
    ringSpinFrames: [26, 206], // giro 360° por loop => costuras invisibles
    stroke: { w: 2.2, o: 90 },
    halo: { w: 12, o: 22 },
  },

  /** Araña a la derecha, colgando de un hilo (silueta negra + remate blanco) */
  spider: {
    x: 1046,
    threadTop: 36,
    hangY: 238,
    sway: {
      keys: [
        [26, 0, 0],
        [71, 7, 2.5],
        [116, 0, 0],
        [161, -7, -2.5],
        [206, 0, 0],
      ],
    }, // [frame, dy, rot]
    bodyFill: '#0a0a08',
    rim: { w: 2, o: 45, css: '#cfc9b2' },
    eyes: { r: 2.6, o: 95, css: '#f4c943' },
    thread: { w: 1.6, o: 30, css: 'rgba(241,235,220,0.35)' },
  },

  /** Resplandor ambiental bajo el cartel (gradiente radial amarillo) */
  ambient: { x: 600, y: 268, rx: 470, ry: 176, o: 20 },

  /**
   * Efectos de cursor (opciones A/C/D; en B solo spotlight/tilt/combo,
   * porque Lottie no expone nodos por letra).
   */
  effects: {
    modes: ['off', 'spotlight', 'tilt', 'magnetic', 'eye', 'combo'],
    labels: {
      off: 'Sin efecto',
      spotlight: 'Foco que sigue al cursor',
      tilt: 'Inclinación 3D (parallax)',
      magnetic: 'Letras magnéticas',
      eye: 'Ojo que te observa (pupila en la O)',
      combo: 'Combo: foco + inclinación',
    },
    spotlight: { radius: 170, color: 'rgba(255,246,218,0.55)', tint: 'rgba(255,59,48,0.22)' },
    tilt: { maxDeg: 7, lerp: 0.12 },
    magnetic: { radius: 230, push: 26, lerp: 0.16 },
    eye: { reach: 6 },
  },

  /** Variantes de la comparativa */
  variants: {
    A: { lines: ['trivial', 'fromville'], extras: true },
    B: { engine: 'lottie' },
    C: { lines: ['fromville'], extras: true, scaleUp: 1.7 },
    D: { lines: ['fromville'], extras: false, scaleUp: 2.2, transparent: true },
  },
};

export const FONT_FILES = ['node_modules/@fontsource/vt323/files/vt323-latin-400-normal.woff'];
