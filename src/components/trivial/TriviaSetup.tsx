import { TRIVIA_CATEGORY_LABELS, TRIVIA_QUESTIONS, buildDeck, countByCategory, countForSeason } from '@data/trivial';
import type { TriviaCategory, TriviaQuestion } from '@lib/types';

interface Props {
  onStart: (deck: TriviaQuestion[], modeLabel: string) => void;
  alias: string;
  onAliasChange: (value: string) => void;
}

const MODES: { key: string; label: string; hint: string; note: string }[] = [
  { key: 'rapido', label: 'Rápido', hint: '10 preguntas variadas', note: 'de todo el archivo' },
  { key: 'experto', label: 'Experto', hint: '15 preguntas · solo media o difícil', note: 'para iniciados' },
  { key: 'sanspoilers', label: 'Sin spoilers', hint: '10 preguntas sin revelar trama', note: 'ideal recién llegado' },
];

const SEASONS: { key: 1 | 2 | 3; label: string }[] = [
  { key: 1, label: 'T1' },
  { key: 2, label: 'T2' },
  { key: 3, label: 'T3' },
];

const CATEGORIES = Object.keys(TRIVIA_CATEGORY_LABELS) as TriviaCategory[];

function SectionHeader({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-pixel text-3xl text-yellow/40 leading-none">{index}</span>
      <div>
        <h3 className="font-pixel text-xl uppercase leading-none">{title}</h3>
        <p className="mt-1 text-[9px] font-bold tracking-[.12em] text-text-muted/60 uppercase font-mono">{sub}</p>
      </div>
    </div>
  );
}

export default function TriviaSetup({ onStart, alias, onAliasChange }: Props) {
  function start(modeKey: string) {
    let deck: TriviaQuestion[];
    let modeLabel: string;

    if (modeKey === 'rapido') {
      deck = buildDeck({ count: 10 });
      modeLabel = 'Rápido';
    } else if (modeKey === 'experto') {
      deck = buildDeck({ count: 15, minDifficulty: 2 });
      modeLabel = 'Experto';
    } else if (modeKey === 'sanspoilers') {
      deck = buildDeck({ count: 10, safeOnly: true });
      modeLabel = 'Sin spoilers';
    } else if (modeKey.startsWith('temporada-')) {
      const s = Number(modeKey.split('-')[1]) as 1 | 2 | 3;
      deck = buildDeck({ count: 8, season: s });
      modeLabel = `Temporada ${s}`;
    } else {
      const cat = modeKey.replace('categoria-', '') as TriviaCategory;
      deck = buildDeck({ count: 10, categories: [cat] });
      modeLabel = TRIVIA_CATEGORY_LABELS[cat];
    }

    if (deck.length > 0) onStart(deck, modeLabel);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-2">
            EXPEDIENTE TRIVIAL · SELECCIÓN DE PRUEBA
          </p>
          <h2 className="font-pixel text-[clamp(1.6rem,3.5vw,2.5rem)] uppercase">Elige cómo quieres jugar</h2>
        </div>

        {/* Alias visible desde el principio: se usa al publicar en el tablón */}
        <label className="lg:text-right">
          <span className="block text-[9px] font-bold tracking-[.14em] text-text-muted uppercase font-mono mb-2">
            TU NOMBRE EN EL TABLÓN
          </span>
          <input
            type="text"
            value={alias}
            onChange={(e) => onAliasChange(e.target.value.slice(0, 24))}
            maxLength={24}
            placeholder="Anónimo"
            className="w-full lg:w-64 min-h-[44px] px-4 rounded-xl bg-bg border border-border text-sm text-text placeholder:text-text-muted/40 focus:outline-2 focus:outline-yellow"
          />
          <span className="mt-1 block text-[9px] text-text-muted/50 font-mono">así firmará el pueblo tus marcas</span>
        </label>
      </div>

      {/* 01 · Modos principales: las tarjetas grandes son el camino rápido */}
      <div className="mt-10">
        <SectionHeader index="01" title="Modos del pueblo" sub="elige y la campana empezará a sonar" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {MODES.map((mode, i) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => start(mode.key)}
              className="group text-left rounded-xl border border-yellow/25 bg-surface-raised p-5 hover:border-yellow hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(228,183,34,0.12)] transition-all cursor-pointer"
            >
              <span className="font-pixel text-2xl text-yellow/40 group-hover:text-yellow transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="block mt-1 font-pixel text-2xl uppercase text-text group-hover:text-yellow transition-colors">
                {mode.label}
              </span>
              <span className="block mt-2 text-text-muted text-xs leading-relaxed">{mode.hint}</span>
              <span className="mt-3 inline-block px-2 py-1 rounded bg-yellow/10 border border-yellow/20 text-[8px] font-bold tracking-[.12em] text-yellow/70 uppercase font-mono">
                {mode.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 02 · Temporadas: píldoras con aviso de spoilers */}
      <div className="mt-12">
        <SectionHeader index="02" title="Por temporada" sub="spoilers de esa temporada + reglas generales" />
        <div className="flex flex-wrap gap-3 mt-5">
          {SEASONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => start(`temporada-${s.key}`)}
              className="group inline-flex items-center gap-3 min-h-[44px] px-4 rounded-full border border-border text-[11px] font-bold tracking-[.12em] uppercase font-mono text-text-muted hover:text-yellow hover:border-yellow/50 transition-all cursor-pointer"
            >
              <span className="font-pixel text-lg text-yellow/60 group-hover:text-yellow">T{s.key}</span>· 8 preguntas
              <span className="px-1.5 py-0.5 rounded bg-rust/15 border border-rust/30 text-[8px] text-rust-hot tracking-[.08em]">
                {countForSeason(s.key)} disp.
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 03 · Categorías: fichas informativas con su tamaño de banco */}
      <div className="mt-12">
        <SectionHeader
          index="03"
          title="Por categoría"
          sub={`archivo completo: ${TRIVIA_QUESTIONS.length} preguntas catalogadas`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => start(`categoria-${cat}`)}
              className="flex items-center justify-between gap-2 min-h-[44px] px-4 rounded-xl border border-border-light bg-bg/40 text-[10px] font-bold tracking-[.1em] uppercase font-mono text-text-muted hover:text-yellow hover:border-yellow/50 transition-all cursor-pointer"
            >
              <span className="truncate">{TRIVIA_CATEGORY_LABELS[cat]}</span>
              <span className="shrink-0 font-pixel text-base text-yellow/50">{countByCategory(cat)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
