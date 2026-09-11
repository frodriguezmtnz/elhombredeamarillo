import type { TriviaQuestion } from '@lib/types';
import { useEffect, useState } from 'react';
import AuthProvider from '../community/AuthProvider';
import TriviaGame, { type TriviaSummary } from './TriviaGame';
import TriviaLeaderboard from './TriviaLeaderboard';
import TriviaResults from './TriviaResults';
import TriviaSetup from './TriviaSetup';
import TriviaSubmit from './TriviaSubmit';

type Phase = 'setup' | 'playing' | 'results';

function TriviaBoardInner() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [deck, setDeck] = useState<TriviaQuestion[]>([]);
  const [modeLabel, setModeLabel] = useState('');
  const [summary, setSummary] = useState<TriviaSummary | null>(null);
  const [round, setRound] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [recordedId, setRecordedId] = useState<string | null>(null);

  function resetRecord() {
    setRecordedId(null);
  }

  function handleStart(nextDeck: TriviaQuestion[], label: string) {
    setDeck(nextDeck);
    setModeLabel(label);
    setSummary(null);
    resetRecord();
    setRound((r) => r + 1);
    setPhase('playing');
    document.getElementById('juego')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Modo inmersivo: difumina hero, reglas y footer mientras se juega
  useEffect(() => {
    const immersive = phase !== 'setup';
    document.body.classList.toggle('trivial-immersive', immersive);
    return () => {
      if (!immersive) return;
      // Si la SPA navega a otra página, limpiamos el flag
      queueMicrotask(() => {
        if (!document.getElementById('juego')) document.body.classList.remove('trivial-immersive');
      });
    };
  }, [phase]);

  function handleFinish(result: TriviaSummary) {
    setSummary(result);
    setPhase('results');
  }

  function handlePlayAgain() {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setSummary(null);
    resetRecord();
    setRound((r) => r + 1);
    setPhase('playing');
  }

  function handleRecorded(id: string) {
    setRecordedId(id);
    setLeaderboardKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
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
        <>
          <TriviaResults
            summary={summary}
            deck={deck}
            onPlayAgain={handlePlayAgain}
            onNewMode={() => setPhase('setup')}
          />
          <TriviaSubmit summary={summary} onRecorded={handleRecorded} />
        </>
      )}

      <TriviaLeaderboard refreshKey={leaderboardKey} highlightId={recordedId} />
    </div>
  );
}

export default function TriviaBoard() {
  return (
    <AuthProvider>
      <TriviaBoardInner />
    </AuthProvider>
  );
}
