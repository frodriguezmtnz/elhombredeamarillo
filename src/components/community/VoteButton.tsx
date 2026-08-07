import { getSupabase } from '@lib/supabase-browser';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

interface Props {
  hypothesisId: string;
  initialVotes: number;
  initialVoted?: boolean;
  onVoteChange?: () => void;
}

export default function VoteButton({ hypothesisId, initialVotes, initialVoted = false, onVoteChange }: Props) {
  const { user } = useAuth();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVotes(initialVotes);
  }, [initialVotes]);

  useEffect(() => {
    if (!user) {
      setVoted(false);
      return;
    }
    if (initialVoted) return;
    getSupabase().then((sb) =>
      sb
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('hypothesis_id', hypothesisId)
        .eq('user_id', user.id)
        .then(({ count }) => {
          setVoted((count ?? 0) > 0);
        }),
    );
  }, [user, hypothesisId, initialVoted]);

  const toggle = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);

    if (voted) {
      setVotes((v) => v - 1);
      setVoted(false);
      const sb = await getSupabase();
      const { error } = await sb.from('votes').delete().eq('hypothesis_id', hypothesisId).eq('user_id', user.id);
      if (error) {
        setVotes((v) => v + 1);
        setVoted(true);
      } else {
        onVoteChange?.();
      }
    } else {
      setVotes((v) => v + 1);
      setVoted(true);
      const sb = await getSupabase();
      const { error } = await sb.from('votes').insert({ hypothesis_id: hypothesisId, user_id: user.id });
      if (error) {
        setVotes((v) => v - 1);
        setVoted(false);
      } else {
        onVoteChange?.();
      }
    }

    setLoading(false);
  }, [user, voted, loading, hypothesisId, onVoteChange]);

  if (!user) {
    return (
      <span className="text-[8px] text-text-muted/30 font-mono cursor-help" title="Inicia sesión para votar">
        🔒 VOTOS
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={clsx(
        'flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded transition-all',
        voted
          ? 'bg-yellow text-bg border border-yellow'
          : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
        loading && 'opacity-50 cursor-wait',
      )}
      aria-label={voted ? 'Quitar voto' : 'Votar'}
    >
      <span className="text-[10px]">{voted ? '★' : '☆'}</span>
      <span>{votes}</span>
    </button>
  );
}
