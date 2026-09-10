import type { TriviaQuestion } from '@lib/types';
import { useState } from 'react';
import TriviaGame, { type TriviaSummary } from './TriviaGame';
import TriviaResults from './TriviaResults';
import TriviaSetup from './TriviaSetup';

type Phase = 'setup' | 'playing' | 'results';

export default function TriviaBoard() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [deck, setDeck] = useState<TriviaQuestion[]>([]);
  const [modeLabel, setModeLabel] = useState('');
  const [summary, setSummary] = useState<TriviaSummary | null>(null);
  const [round, setRound] = useState(0);

  function handleStart(nextDeck: TriviaQuestion[], label: string) {
    setDeck(nextDeck);
    setModeLabel(label);
    setSummary(null);
    setRound((r) => r + 1);
    setPhase('playing');
  }

  function handleFinish(result: TriviaSummary) {
    setSummary(result);
    setPhase('results');
  }

  function handlePlayAgain() {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setSummary(null);
    setRound((r) => r + 1);
    setPhase('playing');
  }

  return (
    <div>
      {phase === 'setup' && <TriviaSetup onStart={handleStart} />}
      {phase === 'playing' && (
        <TriviaGame
          key={round}
          deck={deck}
          modeLabel={modeLabel}
          onFinish={handleFinish}
          onQuit={() => setPhase('setup')}
        />
      )}
      {phase === 'results' && summary && (
        <TriviaResults
          summary={summary}
          deck={deck}
          onPlayAgain={handlePlayAgain}
          onNewMode={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
