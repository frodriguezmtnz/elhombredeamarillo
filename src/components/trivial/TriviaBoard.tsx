import type { TriviaQuestion } from '@lib/types';
import { useCallback, useEffect, useState } from 'react';
import AuthProvider, { useAuth } from '../community/AuthProvider';
import TriviaCountdown from './TriviaCountdown';
import TriviaGame, { type TriviaSummary } from './TriviaGame';
import TriviaLeaderboard from './TriviaLeaderboard';
import TriviaResults from './TriviaResults';
import TriviaSetup from './TriviaSetup';
import TriviaSubmit from './TriviaSubmit';

type Phase = 'setup' | 'countdown' | 'playing' | 'results';

const ALIAS_KEY = 'trivial-alias';

function loadStoredAlias(): string {
  try {
    return window.localStorage.getItem(ALIAS_KEY) ?? '';
  } catch {
    return '';
  }
}

function TriviaBoardInner() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [deck, setDeck] = useState<TriviaQuestion[]>([]);
  const [modeLabel, setModeLabel] = useState('');
  const [summary, setSummary] = useState<TriviaSummary | null>(null);
  const [round, setRound] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [recordedId, setRecordedId] = useState<string | null>(null);
  const [alias, setAlias] = useState(loadStoredAlias);

  // Si inicia sesión y no tenía alias, se lo sugerimos por email
  useEffect(() => {
    if (user && !alias) {
      setAlias((user.email ?? '').split('@')[0] ?? '');
    }
  }, [user, alias]);

  function handleAliasChange(value: string) {
    setAlias(value);
    try {
      window.localStorage.setItem(ALIAS_KEY, value);
    } catch {
      // sin almacenamiento: solo en memoria
    }
  }

  function resetRecord() {
    setRecordedId(null);
  }

  function handleStart(nextDeck: TriviaQuestion[], label: string) {
    setDeck(nextDeck);
    setModeLabel(label);
    setSummary(null);
    resetRecord();
    setRound((r) => r + 1);
    setPhase('countdown');
  }

  const handleCountdownDone = useCallback(() => {
    setPhase('playing');
    document.getElementById('juego')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
    setPhase('countdown');
  }

  function handleRecorded(id: string) {
    setRecordedId(id);
    setLeaderboardKey((k) => k + 1);
  }

  // Modo inmersivo: oculta el hero y difumina reglas y footer mientras se juega
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

  return (
    <div className="space-y-6">
      {phase === 'countdown' && <TriviaCountdown modeLabel={modeLabel} alias={alias} onDone={handleCountdownDone} />}
      {(phase === 'setup' || phase === 'countdown') && (
        <TriviaSetup onStart={handleStart} alias={alias} onAliasChange={handleAliasChange} />
      )}
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
          <TriviaSubmit summary={summary} alias={alias} onAliasChange={handleAliasChange} onRecorded={handleRecorded} />
        </>
      )}

      <TriviaLeaderboard refreshKey={leaderboardKey} highlightId={recordedId} alias={alias} />
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
