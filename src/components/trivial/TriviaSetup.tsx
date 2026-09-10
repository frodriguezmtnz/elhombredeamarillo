import { TRIVIA_CATEGORY_LABELS, buildDeck } from '@data/trivial';
import type { TriviaCategory, TriviaQuestion } from '@lib/types';

interface Props {
  onStart: (deck: TriviaQuestion[], modeLabel: string) => void;
}

interface ModeDef {
  key: string;
  label: string;
  hint: string;
}

const MODES: ModeDef[] = [
  { key: 'rapido', label: 'RÁPIDO', hint: '10 preguntas variadas' },
  { key: 'experto', label: 'EXPERTO', hint: '15 preguntas · solo media o difícil' },
  { key: 'sanspoilers', label: 'SIN SPOILERS', hint: '10 preguntas sin revelar trama' },
];

const SEASONS: { key: 1 | 2 | 3; label: string }[] = [
  { key: 1, label: 'T1' },
  { key: 2, label: 'T2' },
  { key: 3, label: 'T3' },
];

const CATEGORIES = Object.keys(TRIVIA_CATEGORY_LABELS) as TriviaCategory[];

export default function TriviaSetup({ onStart }: Props) {
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
      <p className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-2">
        EXPEDIENTE TRIVIAL · SELECCIÓN DE PRUEBA
      </p>
      <h2 className="font-pixel text-[clamp(1.6rem,3.5vw,2.5rem)] uppercase">Elige cómo quieres jugar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => start(mode.key)}
            className="text-left rounded-xl border border-border bg-surface-raised p-5 hover:border-yellow/50 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="text-[11px] font-bold tracking-[.12em] text-yellow uppercase font-mono">{mode.label}</span>
            <span className="block mt-2 text-text-muted text-xs leading-relaxed">{mode.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-[10px] font-bold tracking-[.14em] text-text-muted uppercase font-mono mb-4">
          Por temporada (spoilers de esa temporada)
        </p>
        <div className="flex flex-wrap gap-3">
          {SEASONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => start(`temporada-${s.key}`)}
              className="min-h-[44px] px-5 rounded-xl border border-border text-[11px] font-bold tracking-[.12em] uppercase font-mono text-text-muted hover:text-yellow hover:border-yellow/50 hover:bg-yellow/5 transition-all cursor-pointer"
            >
              T{s.key} · 8 preguntas
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-[10px] font-bold tracking-[.14em] text-text-muted uppercase font-mono mb-4">Por categoría</p>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => start(`categoria-${cat}`)}
              className="min-h-[44px] px-5 rounded-xl border border-border text-[11px] font-bold tracking-[.12em] uppercase font-mono text-text-muted hover:text-yellow hover:border-yellow/50 hover:bg-yellow/5 transition-all cursor-pointer"
            >
              {TRIVIA_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
