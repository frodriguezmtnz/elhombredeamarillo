// Importa el banco maestro (docs/trivial-banco-maestro.md) + el set curado del
// banco viejo (src/data/trivial.json actual) + 5 preguntas nuevas de producción,
// y escribe un único src/data/trivial.json con el modelo `spoilersUpTo`.
// Genera además docs/trivial-spoilers-review.md para auditoría manual.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_MD = join(root, 'docs', 'trivial-banco-maestro.md');
// Fuente inmutable del set curado (banco v2 de 63 preguntas, congelado como fixture
// para que el script sea idempotente y no consuma su propia salida).
const OLD_JSON = join(root, 'scripts', 'trivial-bank-v2.json');
const OUT_JSON = join(root, 'src', 'data', 'trivial.json');
const REVIEW = join(root, 'docs', 'trivial-spoilers-review.md');

const EXCLUDE = new Set(['Q006']); // casi-duplicado de Q029 (Niño de Blanco)

// bucket (## del md) → categoría del modelo
const BUCKET_TO_CATEGORY = {
  'Temporada 1': 'temporadas',
  'Temporada 2': 'temporadas',
  'Temporada 3': 'temporadas',
  'Temporada 4': 'temporadas',
  Personajes: 'personajes',
  'Criaturas y entidades': 'criaturas',
  'Misterios y objetos': 'misterios',
  'Lugares y Fromville': 'lugares',
  'Música y gramola': 'musica',
  'Reparto y producción': 'produccion',
};

const DIFF = { Fácil: 1, Media: 2, Difícil: 3 };

// ── Parseo del banco maestro ────────────────────────────────────────────
function parseMaestro(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let bucket = null;
  let cur = null;
  let inOptions = false;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
    inOptions = false;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flush();
      bucket = h2[1].trim();
      continue;
    }
    const h3 = line.match(/^###\s+(Q\d+)\s*·\s*(.*)$/);
    if (h3) {
      flush();
      cur = { id: h3[1], difficultyWord: h3[2].trim(), bucket };
      continue;
    }
    if (!cur) continue;
    if (/^-\s+\*\*Opciones:\*\*\s*$/.test(line)) {
      inOptions = true;
      continue;
    }
    const opt = inOptions ? line.match(/^\s*-\s*([A-D])\)\s*(.*)$/) : null;
    if (opt) {
      cur.options = cur.options || {};
      cur.options[opt[1]] = opt[2].trim();
      continue;
    }
    const alcance = line.match(/^-\s+\*\*Temporada \/ alcance:\*\*\s*(.+)$/);
    const pregunta = line.match(/^-\s+\*\*Pregunta:\*\*\s*(.+)$/);
    const correcta = line.match(/^-\s+\*\*Correcta:\*\*\s*\*\*([A-D])\)\s*(.*?)\*\*\s*$/);
    const explicacion = line.match(/^-\s+\*\*Explicación:\*\*\s*(.+)$/);
    const tags = line.match(/^-\s+\*\*Tags:\*\*\s*(.+)$/);
    if (alcance) cur.alcance = alcance[1].trim();
    else if (pregunta) cur.question = pregunta[1].trim();
    else if (correcta) {
      inOptions = false;
      cur.correctLetter = correcta[1];
      cur.correctText = correcta[2].trim();
    } else if (explicacion) cur.explanation = explicacion[1].trim();
    else if (tags) cur.tags = [...tags[1].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
  }
  flush();
  return out;
}

// alcance → { reach, default }
function alcanceToReach(def) {
  const a = def.alcance || '';
  const m = a.match(/^Temporada\s+(\d)/);
  if (m) return { reach: `T${m[1]}`, upTo: Number(m[1]) };
  if (/Producci/.test(a)) return { reach: 'Producción', upTo: 0 };
  if (/Promoci/.test(a)) return { reach: 'Promoción', upTo: 0 };
  if (/Pre-serie/.test(a)) return { reach: 'Pre-serie', upTo: 2 };
  return { reach: 'Global', upTo: 4 };
}

// Overrides por contenido. Solo aplicamos dos tipos de ajustes seguros:
//  (a) RELAJAR a spoiler-free lo que es conocimiento de producción/reparto
//      accesible en prensa sin ver la trama; y
//  (b) SUBIR preguntas cuyo enunciado («por última vez», «ya no dialoga con»,
//      «termina derrumbándose») filtra un desenlace posterior al alcance que
//      indica el banco. Nunca BAJAMOS por debajo del default Global→4.
const OVERRIDES = {
  Q079: { upTo: 0 }, // actor Jim
  Q081: { upTo: 0 }, // actriz Kristi
  Q092: { upTo: 0 }, // actor Ethan
  Q090: { upTo: 1 }, // actor Niño de Blanco: exige conocer la entidad (T1)
  Q080: { upTo: 3 }, // actor Hombre de Amarillo (la identidad es reveal T3–T4)
  Q051: { upTo: 4 }, // «por última vez» a Ethan: confirma el cierre de su arco
  Q055: { upTo: 2 }, // revela el vínculo de Victor con su hermana
  Q063: { upTo: 2 }, // «termina derrumbándose» filtra un evento posterior
};

function maestroToQuestions(defs) {
  const warnings = [];
  const errors = [];
  const out = [];
  for (const d of defs) {
    if (EXCLUDE.has(d.id)) continue;
    const category = BUCKET_TO_CATEGORY[d.bucket];
    if (!category) {
      errors.push(`${d.id}: bucket sin categoría → "${d.bucket}"`);
      continue;
    }
    const difficulty = DIFF[d.difficultyWord];
    if (!difficulty) {
      errors.push(`${d.id}: dificultad desconocida → "${d.difficultyWord}"`);
      continue;
    }
    const letters = ['A', 'B', 'C', 'D'];
    if (!d.options || letters.some((l) => d.options[l] === undefined)) {
      errors.push(`${d.id}: faltan opciones`);
      continue;
    }
    const options = letters.map((l) => d.options[l]);
    const seenOpt = new Set(options);
    if (seenOpt.size !== 4) warnings.push(`${d.id}: opciones no son 4 distintas`);
    const answer = letters.indexOf(d.correctLetter);
    if (answer < 0) {
      errors.push(`${d.id}: letra correcta inválida → "${d.correctLetter}"`);
      continue;
    }
    if (options[answer] !== d.correctText) {
      errors.push(
        `${d.id}: "Correcta" ("${d.correctText}") no coincide con opción ${d.correctLetter} ("${options[answer]}")`,
      );
      continue;
    }
    const { reach, upTo } = alcanceToReach(d);
    const finalUpTo = OVERRIDES[d.id]?.upTo ?? upTo;
    out.push({
      id: d.id,
      category,
      difficulty,
      spoilersUpTo: finalUpTo,
      reach,
      ...(d.tags?.length ? { tags: d.tags } : {}),
      question: d.question,
      options,
      answer,
      explanation: d.explanation,
    });
  }
  return { questions: out, errors, warnings };
}

// ── Set curado del banco viejo (ids nuevos Q095+) ────────────────────────
// oldId → { id, category, difficulty, spoilersUpTo, reach? }
const CURATED = [
  { from: 'r1', id: 'Q095', category: 'reglas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'r2', id: 'Q096', category: 'reglas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'r3', id: 'Q097', category: 'reglas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'r4', id: 'Q098', category: 'reglas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'r5', id: 'Q099', category: 'reglas', difficulty: 2, spoilersUpTo: 0 },
  { from: 'r6', id: 'Q100', category: 'reglas', difficulty: 2, spoilersUpTo: 0 },
  { from: 'r7', id: 'Q101', category: 'reglas', difficulty: 2, spoilersUpTo: 0 },
  { from: 'r8', id: 'Q102', category: 'reglas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'r11', id: 'Q103', category: 'reglas', difficulty: 2, spoilersUpTo: 0 },
  { from: 'c1', id: 'Q104', category: 'criaturas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'c2', id: 'Q105', category: 'criaturas', difficulty: 2, spoilersUpTo: 0 },
  { from: 'c3', id: 'Q106', category: 'criaturas', difficulty: 1, spoilersUpTo: 0 },
  { from: 'c4', id: 'Q107', category: 'criaturas', difficulty: 2, spoilersUpTo: 0 },
  { from: 't1', id: 'Q108', category: 'temporadas', difficulty: 1, spoilersUpTo: 1 },
  { from: 't4', id: 'Q109', category: 'temporadas', difficulty: 2, spoilersUpTo: 2 },
  { from: 't7', id: 'Q110', category: 'temporadas', difficulty: 3, spoilersUpTo: 2 },
  { from: 't9', id: 'Q111', category: 'temporadas', difficulty: 3, spoilersUpTo: 1 },
  { from: 'pr1', id: 'Q112', category: 'produccion', difficulty: 1, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr2', id: 'Q113', category: 'produccion', difficulty: 1, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr3', id: 'Q114', category: 'produccion', difficulty: 2, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr4', id: 'Q115', category: 'produccion', difficulty: 2, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr6', id: 'Q116', category: 'produccion', difficulty: 1, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr7', id: 'Q117', category: 'produccion', difficulty: 2, spoilersUpTo: 0, reach: 'Promoción' },
  { from: 'pr8', id: 'Q118', category: 'produccion', difficulty: 1, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr9', id: 'Q119', category: 'produccion', difficulty: 2, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr10', id: 'Q120', category: 'produccion', difficulty: 2, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'pr11', id: 'Q121', category: 'produccion', difficulty: 3, spoilersUpTo: 0, reach: 'Producción' },
  { from: 'ch1', id: 'Q122', category: 'canal', difficulty: 1, spoilersUpTo: 0 },
  { from: 'ch2', id: 'Q123', category: 'canal', difficulty: 1, spoilersUpTo: 0 },
  { from: 'ch3', id: 'Q124', category: 'canal', difficulty: 2, spoilersUpTo: 0 },
  { from: 'ch4', id: 'Q125', category: 'canal', difficulty: 2, spoilersUpTo: 0 },
  { from: 'ch5', id: 'Q126', category: 'canal', difficulty: 3, spoilersUpTo: 0 },
  { from: 'ch6', id: 'Q127', category: 'canal', difficulty: 1, spoilersUpTo: 0 },
];

// Correcciones de contenido (datos verificados) aplicadas sobre el texto viejo.
const CORRECTIONS = {
  pr1: {
    question: '¿En qué cadena estadounidense se emitió FROM en su estreno?',
    options: ['HBO', 'Epix (rebautizada MGM+ después)', 'Netflix', 'AMC'],
    answer: 1,
    explanation: 'FROM nació en Epix (2022); la cadena cambió de nombre a MGM+ a partir de la segunda temporada.',
  },
  pr3: {
    question: '¿Quién creó la serie?',
    options: ['John Griffin', 'Jack Bender', 'Michael J. Sigelow', 'J.J. Abrams'],
    answer: 0,
    explanation:
      'John Griffin es el creador y showrunner. El concepto original parte de Michael J. Sigelow y Jack Bender produce y dirige buena parte de la serie.',
  },
  pr6: {
    question: '¿En qué país se rueda principalmente FROM?',
    options: ['Estados Unidos', 'Canadá', 'Reino Unido', 'Irlanda'],
    answer: 1,
    explanation:
      'Aunque la acción transcurre en un pueblo de EE. UU., FROM se rueda en Canadá: el set se construyó desde cero en Nueva Escocia.',
  },
  pr7: {
    question: '¿En qué plataforma puede verse la serie en España?',
    options: ['Movistar+', 'Netflix', 'ATRESplayer Premium', 'HBO Max'],
    answer: 3,
    explanation: 'En España FROM puede verse en HBO Max.',
  },
  pr10: {
    question: '¿En qué año se estrenó la tercera temporada?',
    options: ['2023', '2024', '2025', '2026'],
    answer: 1,
    explanation: 'La T3 se estrenó en 2024.',
  },
  pr11: {
    explanation: 'Cada una de las temporadas emitidas consta de 10 episodios.',
  },
};

function curatedToQuestions(oldArr) {
  const byOld = new Map(oldArr.map((q) => [q.id, q]));
  const out = [];
  for (const def of CURATED) {
    const old = byOld.get(def.from);
    if (!old) throw new Error(`curado: no existe la pregunta vieja "${def.from}" en trivial.json`);
    const c = CORRECTIONS[def.from] || {};
    const options = c.options ?? old.options;
    const answer = c.answer ?? old.answer;
    const q = {
      id: def.id,
      category: def.category,
      difficulty: def.difficulty,
      spoilersUpTo: def.spoilersUpTo,
      ...(def.reach ? { reach: def.reach } : {}),
      question: c.question ?? old.question,
      options,
      answer,
      explanation: c.explanation ?? old.explanation,
    };
    if (new Set(options).size !== 4) throw new Error(`${def.id}: opciones no son 4 distintas`);
    if (answer < 0 || answer >= options.length) throw new Error(`${def.id}: answer fuera de rango`);
    out.push(q);
  }
  return out;
}

// ── 5 preguntas nuevas de producción (Q128–Q132) ──────────────────────────
const NEW = [
  {
    id: 'Q128',
    category: 'produccion',
    difficulty: 2,
    spoilersUpTo: 0,
    reach: 'Promoción',
    tags: ['cabecera', 'Pixies', 'música'],
    question: '¿Qué canción suena en la cabecera de FROM?',
    options: ['Que Sera, Sera (versión de Pixies)', 'Badlands', 'Paint It Black', 'The End'],
    answer: 0,
    explanation:
      'La cabecera usa el «Que Sera, Sera» reinterpretado por Pixies: un contraste deliberado, alegre y escalofriante.',
  },
  {
    id: 'Q129',
    category: 'produccion',
    difficulty: 3,
    spoilersUpTo: 0,
    reach: 'Producción',
    tags: ['banda sonora', 'compositor'],
    question: '¿Quién compone la música de FROM?',
    options: ['Ramin Djawadi', 'Bear McCreary', 'Chris Tilton', 'Michael Giacchino'],
    answer: 2,
    explanation: 'Chris Tilton firma la banda sonora de la serie.',
  },
  {
    id: 'Q130',
    category: 'produccion',
    difficulty: 1,
    spoilersUpTo: 0,
    reach: 'Global',
    tags: ['temporadas', 'episodios'],
    question: '¿Cuántas temporadas y episodios acumula FROM tras su cuarta entrega?',
    options: [
      '3 temporadas · 30 episodios',
      '4 temporadas · 40 episodios',
      '4 temporadas · 45 episodios',
      '5 temporadas · 50 episodios',
    ],
    answer: 1,
    explanation: 'Cuatro temporadas de diez episodios: 40 capítulos emitidos hasta la T4.',
  },
  {
    id: 'Q131',
    category: 'produccion',
    difficulty: 1,
    spoilersUpTo: 0,
    reach: 'Promoción',
    tags: ['renovación', 'T5'],
    question: '¿Qué está confirmado sobre el futuro de FROM?',
    options: [
      'Renovada por una quinta temporada que será la última',
      'Cancelada tras la cuarta temporada',
      'Un spin-off ya en rodaje',
      'Encargada una sexta temporada',
    ],
    answer: 0,
    explanation: 'FROM fue renovada por una quinta y última temporada, prevista para 2027.',
  },
  {
    id: 'Q132',
    category: 'produccion',
    difficulty: 2,
    spoilersUpTo: 0,
    reach: 'Producción',
    tags: ['productoras', 'MGM', 'AGBO'],
    question: '¿Qué productoras están detrás de FROM?',
    options: [
      'MGM, AGBO y Midnight Radio',
      'Warner Bros. y Bad Robot',
      'HBO y Anonymous Content',
      'Netflix y Chernin Entertainment',
    ],
    answer: 0,
    explanation: 'La serie la producen MGM Television, AGBO (los hermanos Russo) y Midnight Radio.',
  },
];

// ── Validación final + detección de cuasi-duplicados ──────────────────────
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

function detectNearDuplicates(all) {
  const warnings = [];
  const seen = new Map();
  for (const q of all) {
    const key = norm(q.question);
    if (seen.has(key)) warnings.push(`posible duplicado exacto: ${seen.get(key)} ≈ ${q.id}`);
    else seen.set(key, q.id);
  }
  // solape alto de opciones en la misma categoría
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      if (a.category !== b.category) continue;
      const A = new Set(a.options.map(norm));
      const shared = b.options.filter((o) => A.has(norm(o))).length;
      if (shared >= 3) warnings.push(`opciones muy solapadas: ${a.id} ≈ ${b.id} (${shared}/4)`);
    }
  }
  return warnings;
}

function validate(all) {
  const errors = [];
  const ids = new Set();
  const CATS = new Set([
    'reglas',
    'criaturas',
    'personajes',
    'temporadas',
    'misterios',
    'lugares',
    'musica',
    'produccion',
    'canal',
  ]);
  const REACH = new Set(['T1', 'T2', 'T3', 'T4', 'Global', 'Pre-serie', 'Producción', 'Promoción']);
  for (const q of all) {
    if (ids.has(q.id)) errors.push(`${q.id}: id duplicado`);
    ids.add(q.id);
    if (!CATS.has(q.category)) errors.push(`${q.id}: categoría inválida ${q.category}`);
    if (![0, 1, 2, 3, 4].includes(q.spoilersUpTo)) errors.push(`${q.id}: spoilersUpTo inválido ${q.spoilersUpTo}`);
    if (q.reach && !REACH.has(q.reach)) errors.push(`${q.id}: reach inválido ${q.reach}`);
    if (q.difficulty < 1 || q.difficulty > 3) errors.push(`${q.id}: dificultad inválida`);
    if (q.options.length !== 4) errors.push(`${q.id}: necesita 4 opciones`);
    if (new Set(q.options.map(norm)).size !== 4) errors.push(`${q.id}: opciones repetidas`);
    if (q.answer < 0 || q.answer > 3) errors.push(`${q.id}: answer fuera de rango`);
  }
  return errors;
}

// ── Ejecución ─────────────────────────────────────────────────────────────
const md = readFileSync(SRC_MD, 'utf8');
const oldArr = JSON.parse(readFileSync(OLD_JSON, 'utf8'));
const maestro = parseMaestro(md);
const { questions: mQ, errors: mErr, warnings: mWarn } = maestroToQuestions(maestro);
const cQ = curatedToQuestions(oldArr);
const all = [...mQ, ...cQ, ...NEW].sort((a, b) => a.id.localeCompare(b.id));

const dupWarn = detectNearDuplicates(all);
const vErr = validate(all);
const allErrors = [...mErr, ...vErr];

if (allErrors.length) {
  console.error('ERRORES de importación:');
  for (const e of allErrors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

writeFileSync(OUT_JSON, `${JSON.stringify(all, null, 2)}\n`, 'utf8');

// ── Doc de revisión ────────────────────────────────────────────────────────
const byCat = {};
for (const q of all) {
  if (!byCat[q.category]) byCat[q.category] = [];
  byCat[q.category].push(q);
}
const CAT_ORDER = [
  'reglas',
  'criaturas',
  'personajes',
  'temporadas',
  'misterios',
  'lugares',
  'musica',
  'produccion',
  'canal',
];
const DF = ['', 'Fácil', 'Media', 'Difícil'];
let doc = '# Revisión de spoilersUpTo — trivial\n\n';
doc += `Total: **${all.length}** preguntas. Reparto por spoiler-level:\n\n`;
for (const n of [0, 1, 2, 3, 4]) {
  const c = all.filter((q) => q.spoilersUpTo === n).length;
  doc += `- **spoilersUpTo ${n}** → ${c} preguntas\n`;
}
doc +=
  '\nReglas: `0` = se puede jugar sin haber visto nada (premisas, producción, reparto accesible en prensa). `N` = requiere haber visto hasta la temporada N.\n\n';
doc +=
  'Auditúa cada fila: si crees que una pregunta filtra trama antes de tiempo, sube su número; si es spoiler-free, bájalo.\n\n';
for (const cat of CAT_ORDER) {
  const list = byCat[cat];
  if (!list?.length) continue;
  doc += `\n## ${cat} (${list.length})\n\n| id | S | D | reach | pregunta |\n|---|---|---|---|---|\n`;
  for (const q of list)
    doc += `| ${q.id} | ${q.spoilersUpTo} | ${DF[q.difficulty]} | ${q.reach ?? '—'} | ${q.question.replace(/\|/g, '\\|')} |\n`;
}
writeFileSync(REVIEW, doc, 'utf8');

// ── Resumen por consola ─────────────────────────────────────────────────────
console.log(`Maestro parseado: ${maestro.length} ids (excluidos: ${[...EXCLUDE].join(', ')}) → ${mQ.length} preguntas`);
console.log(`Curado viejo remapeado: ${cQ.length} preguntas`);
console.log(`Nuevas: ${NEW.length} preguntas`);
console.log(`TOTAL trivial.json: ${all.length}`);
console.log('\nPor spoilersUpTo:');
for (const n of [0, 1, 2, 3, 4]) console.log(`  ${n}: ${all.filter((q) => q.spoilersUpTo === n).length}`);
console.log('\nPor categoría:');
for (const cat of CAT_ORDER) console.log(`  ${cat}: ${(byCat[cat] ?? []).length}`);
if (mWarn.length || dupWarn.length) {
  console.log('\nADVERTENCIAS (no bloqueantes):');
  for (const w of [...mWarn, ...dupWarn]) console.log(`  ⚠ ${w}`);
}
console.log('\nEscritos: src/data/trivial.json y docs/trivial-spoilers-review.md');
