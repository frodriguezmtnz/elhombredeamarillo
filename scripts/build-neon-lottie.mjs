/**
 * Generador del cartel de neón "TRIVIAL — FromVille" en formato Lottie (.json).
 *
 * Pipeline: VT323 (woff local de @fontsource, fallback a TTF de Google Fonts)
 *   → contornos de texto con opentype.js → capas de formas Lottie.
 *
 * El glow se simula con 3 trazos concéntricos por tubo (lejos/cerca/núcleo),
 * porque el blur real de After Effects no es portable en lottie-web.
 *
 * Salida:
 *   - public/assets/lottie/trivial-neon.json   (el asset para la web)
 *   - sandbox/neon-trivial-lottie.html         (JSON inyectado inline entre los
 *     marcadores __LOTTIE_START__/__LOTTIE_END__ para abrirlo con file://)
 *
 * Uso:  node scripts/build-neon-lottie.mjs
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import opentype from 'opentype.js';
import { FONT_FILES, NEON } from '../sandbox/neon-spec.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─────────────────────────── fuente → contornos ───────────────────────────

async function loadFont() {
  for (const rel of FONT_FILES) {
    try {
      const buf = readFileSync(join(ROOT, rel));
      return opentype.parse(new Uint8Array(buf).buffer);
    } catch (err) {
      console.warn(`[neon] no pude leer ${rel}: ${err.message}`);
    }
  }
  console.warn('[neon] fallback: descargando VT323-Regular.ttf de Google Fonts');
  const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/vt323/VT323-Regular.ttf');
  if (!res.ok) throw new Error(`fallback de fuente falló: HTTP ${res.status}`);
  return opentype.parse(await res.arrayBuffer());
}

/** commands de opentype.js → contornos bezier estilo Lottie {v,i,o,c}.
 *  OJO: en Lottie i/o son DESPLAZAMIENTOS RELATIVOS al vértice (lottie los
 *  convierte a absolutos sumando v). Un tramo recto usa i=o=[0,0]. */
function commandsToContours(commands) {
  const contours = [];
  let cur = null;
  let prev = null;
  let start = null;

  const closeCur = () => {
    if (cur && cur.v.length > 1) contours.push(cur);
    cur = null;
  };
  const newCur = (x, y) => {
    closeCur();
    cur = { v: [[x, y]], i: [[0, 0]], o: [[0, 0]], c: false };
    start = [x, y];
    prev = [x, y];
  };
  const addVertex = (x, y) => {
    if (!cur) return;
    cur.v.push([x, y]);
    cur.i.push([0, 0]);
    cur.o.push([0, 0]);
    prev = [x, y];
  };

  for (const cmd of commands) {
    if (cmd.type === 'M') newCur(cmd.x, cmd.y);
    else if (cmd.type === 'L') addVertex(cmd.x, cmd.y);
    else if (cmd.type === 'C') {
      if (!cur) {
        newCur(cmd.x, cmd.y);
        continue;
      }
      cur.o[cur.v.length - 1] = [cmd.x1 - prev[0], cmd.y1 - prev[1]];
      cur.v.push([cmd.x, cmd.y]);
      cur.i.push([cmd.x2 - cmd.x, cmd.y2 - cmd.y]);
      cur.o.push([0, 0]);
      prev = [cmd.x, cmd.y];
    } else if (cmd.type === 'Q') {
      if (!cur) {
        newCur(cmd.x, cmd.y);
        continue;
      }
      const [px, py] = prev;
      const c1 = [px + (2 / 3) * (cmd.x1 - px), py + (2 / 3) * (cmd.y1 - py)];
      const c2 = [cmd.x + (2 / 3) * (cmd.x1 - cmd.x), cmd.y + (2 / 3) * (cmd.y1 - cmd.y)];
      cur.o[cur.v.length - 1] = [c1[0] - px, c1[1] - py];
      cur.v.push([cmd.x, cmd.y]);
      cur.i.push([c2[0] - cmd.x, c2[1] - cmd.y]);
      cur.o.push([0, 0]);
      prev = [cmd.x, cmd.y];
    } else if (cmd.type === 'Z' && cur) {
      cur.c = true;
      cur.v.push([...start]);
      cur.i.push([0, 0]);
      cur.o.push([0, 0]);
    }
  }
  closeCur();
  return contours;
}

function textContours(text, size) {
  const path = font.getPath(text, 0, 0, size);
  const contours = commandsToContours(path.commands);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const c of contours)
    for (const [x, y] of c.v) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (const c of contours)
    for (const p of c.v) {
      p[0] -= cx;
      p[1] -= cy;
    }
  return { contours, bbox: { x0: minX - cx, y0: minY - cy, x1: maxX - cx, y1: maxY - cy } };
}

// ─────────────────────────── primitivas Lottie ────────────────────────────

const R = (n) => Math.round(n * 100) / 100;
const col = (arr, a = 1) => [R(arr[0]), R(arr[1]), R(arr[2]), a];

const stat = (v) => ({ a: 0, k: v });
const statColor = (v) => ({ a: 0, k: v });

/** flicker "paso": valores constantes entre keyframes, cambios instantáneos */
function stepKeys(pairs) {
  return pairs.map(([t, v], idx) => {
    const kf = { t, s: [v] };
    if (idx < pairs.length - 1) {
      kf.o = { x: 1, y: 1 };
      kf.i = idx === 0 ? { x: 0, y: 1 } : { x: 0, y: 0 };
    }
    return kf;
  });
}

function rampKeys(t0, t1, v0, v1) {
  return [
    { t: t0, s: [v0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
    { t: t1, s: [v1] },
  ];
}

// Lottie exige UN item 'sh' por sub-contorno (cada letra y cada contra-forma/hueco
// del glifo va aparte). Fusionarlos en un solo 'sh' dibuja una polilínea que salta
// entre letras. 'c' debe ser un booleano (cerrado), no un array.
function pathItems(contours) {
  return contours.map((ct) => ({
    ty: 'sh',
    nm: 'path',
    hd: false,
    ks: {
      a: 0,
      k: {
        i: ct.i.map(([x, y]) => [R(x), R(y)]),
        o: ct.o.map(([x, y]) => [R(x), R(y)]),
        v: ct.v.map(([x, y]) => [R(x), R(y)]),
        c: !!ct.c,
      },
    },
  }));
}

function strokeItem(colorCssArr, { w, o }, dash = null) {
  const st = {
    ty: 'st',
    nm: 'stroke',
    c: statColor(col(colorCssArr)),
    o: stat(R(o)),
    w: stat(R(w)),
    lc: 2,
    lj: 2,
    ml: 4,
    bm: 0,
    hd: false,
  };
  if (dash)
    st.d = [
      { n: 'd', nm: 'dash', v: stat(dash[0]) },
      { n: 'g', nm: 'gap', v: stat(dash[1]) },
    ];
  return st;
}

function fillItem(colorArr, o = 100) {
  return { ty: 'fl', nm: 'fill', c: statColor(col(colorArr)), o: stat(o), r: 1, bm: 0, hd: false };
}

function trimItem(rampFrom = 0, rampTo = 22) {
  return {
    ty: 'tm',
    nm: 'trim',
    hd: false,
    m: 1,
    s: stat(0),
    o: stat(0),
    e: { a: 1, k: rampKeys(rampFrom, rampTo, 0, 100) },
  };
}

function ellipse(cx = 0, cy = 0, rx = 10, ry = rx) {
  return { ty: 'el', nm: 'ellipse', p: stat([R(cx), R(cy)]), s: stat([R(2 * rx), R(2 * ry)]), d: 1, hd: false };
}

function rect(cx, cy, w, h, r = 0) {
  return { ty: 'rc', nm: 'rect', p: stat([R(cx), R(cy)]), s: stat([R(w), R(h)]), r: stat(R(r)), d: 1, hd: false };
}

function openPath(points, closed = false) {
  return {
    ty: 'sh',
    nm: 'line',
    hd: false,
    ks: {
      a: 0,
      k: {
        i: points.map(() => [0, 0]),
        o: points.map(() => [0, 0]),
        v: points.map(([x, y]) => [R(x), R(y)]),
        c: !!closed,
      },
    },
  };
}

const groupTr = (extra = {}) => ({
  ty: 'tr',
  nm: 'xform',
  p: stat(extra.p ?? [0, 0]),
  a: stat([0, 0]),
  s: stat([100, 100]),
  r: extra.r ?? stat(0),
  o: stat(100),
  sk: stat(0),
  sa: stat(0),
});

function group(nm, items) {
  return { ty: 'gr', nm, np: 3, bm: 0, it: [...items, groupTr()] };
}

let layerIdx = 0;
function shapeLayer(
  nm,
  shapes,
  { p = [0, 0], a = [0, 0], o = stat(100), r = stat(0), ip = 0, op = NEON.timing.loopEnd, bm = 0 } = {},
) {
  layerIdx += 1;
  return {
    ddd: 0,
    ind: layerIdx,
    ty: 4,
    nm,
    sr: 1,
    ks: {
      o: o.a ? { a: 1, k: o.k } : o,
      r,
      p: { a: 0, k: [...p, 0] },
      a: { a: 0, k: [...a, 0] },
      s: stat([100, 100, 100]),
    },
    ao: 0,
    shapes,
    ip,
    op,
    st: 0,
    bm,
  };
}

/** grupo "trazo" = items de path ya construidos + trim (encendido) + stroke */
function strokeGroup(nm, pathItems, strokeColor, strokeOpts, withTrim = true) {
  const items = [...pathItems];
  if (withTrim) items.push(trimItem());
  items.push(strokeItem(strokeColor, strokeOpts));
  return group(nm, items);
}

/** cada contorno del texto vectorizado → su propio item 'sh' */
const textPaths = (contours) => pathItems(contours);
/** polylinea abierta (patas, subrayado, hilo) */
const linePaths = (pts) => [openPath(pts)];

// ─────────────────────────── construcción del cartel ──────────────────────

const font = await loadFont();
const { introEnd, loopEnd } = NEON.timing;
const layers = [];

function wordLayer(name, line, ring) {
  const { contours } = textCache.get(line.id);
  const s = line.strokes[ring];
  const color =
    ring === 'core'
      ? line.glow === 'yellow'
        ? NEON.colors.white.rgb
        : NEON.colors.redCore.rgb
      : line.glow === 'yellow'
        ? NEON.colors.yellow.rgb
        : NEON.colors.red.rgb;
  return shapeLayer(
    name + (ring !== 'core' ? `-${ring}` : ''),
    [strokeGroup(`${name}-${ring}`, textPaths(contours), color, s, false)],
    {
      p: line.center,
      o: { a: 1, k: stepKeys(line.flicker) },
    },
  );
}

const textCache = new Map();
for (const line of NEON.lines) textCache.set(line.id, textContours(line.text, line.size));

// 1) nucleo TRIVIAL → halos (las primeras capas van arriba)
const trivial = NEON.lines.find((l) => l.id === 'trivial');
layers.push(wordLayer('TRIVIAL', trivial, 'core'));
layers.push(wordLayer('TRIVIAL', trivial, 'near'));
layers.push(wordLayer('TRIVIAL', trivial, 'far'));

// 2) FromVille + subrayado (comparten capa y por tanto parpadeo)
const fv = NEON.lines.find((l) => l.id === 'fromville');
const u = NEON.underline;
function fvLayer(ring) {
  const { contours } = textCache.get(fv.id);
  const s = fv.strokes[ring];
  const color = ring === 'core' ? NEON.colors.redCore.rgb : NEON.colors.red.rgb;
  const linePts = [
    [u.x1 - fv.center[0], u.y - fv.center[1]],
    [u.x2 - fv.center[0], u.y - fv.center[1]],
  ];
  const us = ring === 'core' ? u.strokes.core : ring === 'near' ? u.strokes.near : u.strokes.far;
  return shapeLayer(
    `FromVille-${ring}`,
    [
      strokeGroup(`fv-${ring}`, textPaths(contours), color, s, false),
      strokeGroup(`ul-${ring}`, linePaths(linePts), color, us),
    ],
    { p: fv.center, o: { a: 1, k: stepKeys(fv.flicker) } },
  );
}
layers.push(fvLayer('core'));
layers.push(fvLayer('near'));
layers.push(fvLayer('far'));

// 3) marco rojo del cartel (rect redondeado, estable, con encendido)
const f = NEON.frame;
function frameGroup(nm, opts, withTrim) {
  const items = [rect(0, 0, f.w, f.h, f.r)];
  if (withTrim) items.push(trimItem());
  items.push(strokeItem(opts.color, opts));
  return group(nm, items);
}
layers.push(
  shapeLayer(
    'Marco',
    [
      frameGroup('frame-halo', { color: NEON.colors.red.rgb, ...f.halo }, false),
      frameGroup('frame-core', { color: NEON.colors.redCore.rgb, ...f.core }, true),
    ],
    { p: [f.x + f.w / 2, f.y + f.h / 2], o: { a: 1, k: rampKeys(6, introEnd, 0, 100) } },
  ),
);

// 4) talisman (halo + detalle), calcado de Talisman404.astro con escala 0.42
const T = NEON.talisman;
const S = T.scale;
const ringR = 150 * S;
const outerR = 166 * S;
const innerR = 133 * S;
const discR = 176 * S;
function talismanShapes(haloMode) {
  const items = [];
  if (!haloMode) {
    items.push(group('disco', [ellipse(0, 0, discR), fillItem([0.07, 0.078, 0.06], 92)]));
  }
  const spin = haloMode
    ? undefined
    : {
        a: 1,
        k: [
          { t: T.ringSpinFrames[0], s: [0], i: { x: 0.5, y: 0.5 }, o: { x: 0.5, y: 0.5 } },
          { t: T.ringSpinFrames[1], s: [360] },
        ],
      };
  const band = haloMode
    ? [ellipse(0, 0, ringR), strokeItem(NEON.colors.yellow.rgb, T.halo), groupTr({ r: spin })]
    : [ellipse(0, 0, ringR), strokeItem(NEON.colors.yellow.rgb, T.stroke, [6.6, 8.4]), groupTr({ r: spin })];
  items.push({ ty: 'gr', nm: 'runas', np: 3, bm: 0, it: band });
  const ring2 = haloMode
    ? [ellipse(0, 0, outerR), strokeItem(NEON.colors.yellow.rgb, T.halo), groupTr()]
    : [ellipse(0, 0, outerR), strokeItem(NEON.colors.yellow.rgb, { w: 1, o: 60 }), groupTr()];
  const ring3 = haloMode
    ? [ellipse(0, 0, innerR), strokeItem(NEON.colors.yellow.rgb, T.halo), groupTr()]
    : [ellipse(0, 0, innerR), strokeItem(NEON.colors.yellow.rgb, { w: 1, o: 60 }), groupTr()];
  const eye = haloMode
    ? [ellipse(0, 0, 58 * S, 36 * S), strokeItem(NEON.colors.yellow.rgb, T.halo), groupTr()]
    : [ellipse(0, 0, 58 * S, 36 * S), strokeItem(NEON.colors.yellow.rgb, { w: 1.6, o: 85 }), groupTr()];
  items.push(group('a1', ring2), group('a2', ring3), { ty: 'gr', nm: 'ojo', np: 3, bm: 0, it: eye });
  if (!haloMode) {
    items.push(
      group('pupila', [
        ellipse(0, 0, 4.6),
        fillItem(NEON.colors.ink.rgb, 100),
        strokeItem([0.847, 0.702, 0.235], { w: 0.9, o: 90 }),
      ]),
      group('punto', [ellipse(0, 0, 1.5), fillItem(NEON.colors.yellow.rgb, 100)]),
    );
  }
  return items;
}
const talismanFade = { a: 1, k: [...rampKeys(10, introEnd, 0, 100)] };
layers.push(shapeLayer('Talisman', talismanShapes(false), { p: T.pos, o: talismanFade }));
layers.push(shapeLayer('Talisman-halo', talismanShapes(true), { p: T.pos, o: talismanFade }));

// 5) arana colgando a la derecha (una sola capa con balanceo de pos + rot)
const sp = NEON.spider;
const legR = [
  [
    [8, -6],
    [26, -20],
    [38, -6],
  ],
  [
    [9, -1],
    [30, -4],
    [44, 8],
  ],
  [
    [8, 4],
    [28, 11],
    [40, 23],
  ],
  [
    [6, 9],
    [21, 20],
    [29, 34],
  ],
];
const legs = [...legR, ...legR.map((l) => l.map(([x, y]) => [-x, y]))];

const threadTopY = -(sp.hangY - sp.threadTop);
const spiderItems = [
  group('hilo', [
    openPath([
      [0, threadTopY],
      [0, -16],
    ]),
    strokeItem(NEON.colors.ivory.rgb, { w: sp.thread.w, o: sp.thread.o }),
  ]),
  group('patas', [
    ...legs.map((pts) => openPath(pts)),
    strokeItem(NEON.colors.ink.rgb, { w: 4.8, o: 100 }),
    strokeItem(NEON.colors.ivory.rgb, { w: sp.rim.w, o: sp.rim.o }),
  ]),
  group('abd', [
    ellipse(0, 9, 15, 17),
    strokeItem(NEON.colors.yellow.rgb, { w: 16, o: 8 }),
    fillItem(NEON.colors.ink.rgb, 100),
    strokeItem(NEON.colors.ivory.rgb, { w: sp.rim.w, o: sp.rim.o }),
  ]),
  group('cabeza', [
    ellipse(0, -10, 8.5, 7),
    fillItem(NEON.colors.ink.rgb, 100),
    strokeItem(NEON.colors.ivory.rgb, { w: 1.4, o: sp.rim.o }),
  ]),
  group('ojos', [
    ellipse(-3.2, -12, 1.5, 1.5),
    ellipse(3.2, -12, 1.5, 1.5),
    fillItem(NEON.colors.yellow.rgb, sp.eyes.o),
  ]),
];
const swayKeys = sp.sway.keys;
const spiderLayer = shapeLayer('Arana', spiderItems, { p: [sp.x, sp.hangY], o: talismanFade });
spiderLayer.ks.p = {
  a: 1,
  k: swayKeys.map(([t, dy], idx) => ({
    t,
    s: [sp.x, sp.hangY + dy, 0],
    to: [0, 0, 0],
    ti: [0, 0, 0],
    ...(idx < swayKeys.length - 1 ? { i: { x: 0.5, y: 0.85 }, o: { x: 0.5, y: 0.15 } } : {}),
  })),
};
spiderLayer.ks.r = {
  a: 1,
  k: swayKeys.map(([t, , rot], idx) => ({
    t,
    s: [rot],
    ...(idx < swayKeys.length - 1 ? { i: { x: 0.5, y: 0.85 }, o: { x: 0.5, y: 0.15 } } : {}),
  })),
};
layers.push(spiderLayer);

// 6) resplandor ambiental (gradiente radial amarillo, capa base)
const A = NEON.ambient;
layers.push(
  shapeLayer(
    'Ambiente',
    [
      {
        ty: 'gr',
        nm: 'aura',
        np: 3,
        bm: 0,
        it: [
          ellipse(0, 0, A.rx, A.ry),
          {
            ty: 'gf',
            nm: 'aura-g',
            t: 1,
            hd: false,
            s: stat([0, 0]),
            e: stat([A.rx, 0]),
            o: stat(70),
            r: 1,
            bm: 0,
            g: {
              p: 3,
              k: {
                a: 0,
                k: [
                  0,
                  ...col(NEON.colors.yellow.rgb, 1),
                  0.55,
                  ...col(NEON.colors.yellow.rgb, 0.22),
                  1,
                  ...col(NEON.colors.yellow.rgb, 0),
                ].map(R),
              },
            },
          },
          groupTr(),
        ],
      },
    ],
    { p: [A.x, A.y], o: { a: 1, k: rampKeys(8, introEnd + 10, 0, A.o) } },
  ),
);

// ─────────────────────────── salida ───────────────────────────────────────

const animation = {
  v: '5.7.4',
  fr: NEON.timing.fr,
  ip: 0,
  op: loopEnd,
  w: NEON.canvas.w,
  h: NEON.canvas.h,
  nm: 'TRIVIAL — FromVille (neón)',
  ddd: 0,
  assets: [],
  layers,
  markers: [{ tm: introEnd, dr: loopEnd - introEnd, cm: 'loop' }],
};

// validaciones básicas antes de escribir
for (const line of NEON.lines) {
  const [first, last] = [line.flicker[0], line.flicker.at(-1)];
  if (first[1] !== last[1]) throw new Error(`flicker de ${line.id} no cierra loop (${first[1]} vs ${last[1]})`);
}
JSON.parse(JSON.stringify(animation));

const outJson = join(ROOT, 'public/assets/lottie/trivial-neon.json');
const outHtml = join(ROOT, 'sandbox/neon-trivial-lottie.html');
mkdirSync(dirname(outJson), { recursive: true });
const compact = JSON.stringify(animation);
writeFileSync(outJson, compact);

// inyección idempotente en el playground: con file:// no se pueden cargar
// .js hermanos (orígenes opacos), así que el JSON viaja inline en el HTML
if (existsSync(outHtml)) {
  const html = readFileSync(outHtml, 'utf8');
  const start = '/*__LOTTIE_START__*/';
  const end = '/*__LOTTIE_END__*/';
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1) {
    console.warn('[neon] el playground B no tiene marcadores __LOTTIE_START__/__LOTTIE_END__');
  } else {
    writeFileSync(outHtml, html.slice(0, i + start.length) + compact + html.slice(j));
    console.log('[neon] JSON inyectado en sandbox/neon-trivial-lottie.html');
  }
} else {
  console.warn('[neon] no existe sandbox/neon-trivial-lottie.html, no se inyecta');
}

const raw = statSync(outJson).size;
const gz = gzipSync(readFileSync(outJson)).length;
const totalVerts = [...textCache.values()].reduce((acc, t) => acc + t.contours.reduce((a, c) => a + c.v.length, 0), 0);
console.log(`[neon] ${layers.length} capas · ${totalVerts} vértices de texto`);
console.log(`[neon] trivial-neon.json: ${(raw / 1024).toFixed(1)} KB · gzip ${(gz / 1024).toFixed(1)} KB`);
console.log(`[neon] → ${outJson}`);
