import { getSupabase } from '@lib/supabase-browser';
import type { HypothesisData, MysteryData } from '@lib/types';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import ProposeHypothesis from './ProposeHypothesis';
import VoteButton from './VoteButton';

interface Props {
  mystery: MysteryData | null;
}

function fetchHypotheses(mysteryId: string): Promise<{ data: HypothesisData[] | null; error: string | null }> {
  return getSupabase().then((sb) =>
    sb
      .from('hypotheses')
      .select('id, title, description, author, votes_count, display_order')
      .eq('mystery_id', mysteryId)
      .order('display_order')
      .then(({ data, error }) => {
        if (error) return { data: null, error: error.message };
        const mapped: HypothesisData[] = (data ?? []).map((h) => ({
          id: h.id,
          title: h.title,
          description: h.description ?? '',
          author: h.author ?? 'Anónimo',
          votes: h.votes_count ?? 0,
        }));
        return { data: mapped, error: null };
      }),
  );
}

export default function MysteryDetail({ mystery }: Props) {
  const { user, openLogin } = useAuth();
  const [hypotheses, setHypotheses] = useState<HypothesisData[]>([]);
  const [hypLoading, setHypLoading] = useState(false);
  const [hypError, setHypError] = useState('');
  const [proposeOpen, setProposeOpen] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const applyData = (data: HypothesisData[] | null, error: string | null) => {
    if (!error && data) setHypotheses(data);
  };

  const fetchUserVotes = (hyps: HypothesisData[]) => {
    if (!user) {
      setVotedIds(new Set());
      return;
    }
    const ids = hyps.map((h) => h.id);
    if (ids.length === 0) return;
    getSupabase().then((sb) =>
      sb
        .from('votes')
        .select('hypothesis_id')
        .eq('user_id', user.id)
        .in('hypothesis_id', ids)
        .then(({ data }) => {
          setVotedIds(new Set(data?.map((v) => v.hypothesis_id) ?? []));
        }),
    );
  };

  const refreshHypotheses = () => {
    if (!mystery) return;
    setTimeout(() => {
      fetchHypotheses(mystery.id).then(({ data, error }) => {
        applyData(data, error);
        if (data) fetchUserVotes(data);
      });
    }, 500);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: applyData es estable (solo usa setHypotheses)
  useEffect(() => {
    if (!mystery) return;
    setHypLoading(true);
    setHypError('');

    const mysteryId = mystery.id;

    fetchHypotheses(mysteryId).then(({ data, error }) => {
      if (error) {
        setHypError(error);
        setHypLoading(false);
        return;
      }
      setHypotheses(data ?? []);
      setHypLoading(false);
      if (data) fetchUserVotes(data);
    });

    let unsubscribe: (() => void) | undefined;

    getSupabase().then((sb) => {
      const refresh = () => {
        fetchHypotheses(mysteryId).then(({ data, error }) => applyData(data, error));
      };

      const channel = sb
        .channel(`hypotheses-${mysteryId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hypotheses' }, refresh)
        .subscribe();

      unsubscribe = () => {
        sb.removeChannel(channel);
      };
    });

    return () => {
      unsubscribe?.();
    };
  }, [mystery]);

  if (!mystery) {
    return (
      <div className="p-6 rounded-xl border border-border bg-surface text-center">
        <p className="text-text-muted text-sm">Selecciona un misterio para ver su detalle.</p>
      </div>
    );
  }

  const sorted = [...hypotheses].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted[0]?.votes ?? 1;

  return (
    <div className="p-5 rounded-xl border border-border bg-surface space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-pixel text-xl text-yellow">{mystery.code}</span>
          <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
            {mystery.category}
          </span>
        </div>
        <h3 className="font-pixel text-lg uppercase leading-tight mb-2">{mystery.title}</h3>
        <p className="text-text-muted text-xs leading-relaxed">{mystery.context}</p>
        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          <span>{mystery.contributors}</span>
          <span>{mystery.mentions} menciones</span>
        </div>
      </div>

      {/* Hypotheses */}
      <div>
        <h4 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
          HIPÓTESIS ({hypLoading ? '...' : hypotheses.length})
        </h4>

        {hypLoading && (
          <div className="flex items-center gap-2 py-4">
            <span className="w-3 h-3 border-2 border-text-muted/20 border-t-yellow rounded-full animate-spin" />
            <span className="text-[9px] text-text-muted/40 font-mono">Cargando hipótesis...</span>
          </div>
        )}

        {hypError && (
          <div className="px-3 py-2 rounded-lg border border-rust/30 bg-rust/10 text-rust-hot text-[10px] font-mono">
            {hypError}
          </div>
        )}

        {!hypLoading && !hypError && (
          <div className="space-y-3">
            {sorted.map((hyp, i) => {
              const pct = maxVotes > 0 ? Math.round((hyp.votes / maxVotes) * 100) : 0;
              return (
                <div key={hyp.id} className="p-3 rounded-lg border border-border bg-bg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-[8px] font-bold tracking-[.1em] uppercase font-mono rounded',
                        i === 0 ? 'bg-yellow text-bg' : 'bg-surface text-text-muted border border-border',
                      )}
                    >
                      #{i + 1}
                    </span>
                    <VoteButton
                      hypothesisId={hyp.id}
                      initialVotes={hyp.votes}
                      initialVoted={votedIds.has(hyp.id)}
                      onVoteChange={refreshHypotheses}
                    />
                  </div>
                  <h5 className="text-text text-xs font-bold mb-1">{hyp.title}</h5>
                  <p className="text-text-muted text-[10px] leading-relaxed mb-2">{hyp.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-text-muted/50 font-mono">{hyp.author}</span>
                    <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-yellow rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      {!user ? (
        <button
          type="button"
          onClick={openLogin}
          className="w-full py-3 border border-yellow/30 bg-yellow/5 text-yellow/60 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:border-yellow hover:text-yellow hover:bg-yellow/10 transition-colors"
        >
          INICIAR SESIÓN PARA PROPONER UNA EXPLICACIÓN →
        </button>
      ) : proposeOpen ? (
        <ProposeHypothesis
          mysteryId={mystery.id}
          onSubmitted={() => {
            setProposeOpen(false);
            refreshHypotheses();
          }}
          onCancel={() => setProposeOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setProposeOpen(true)}
          className="w-full py-3 border border-yellow/30 bg-yellow/5 text-yellow text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:bg-yellow hover:text-bg transition-colors"
        >
          + PROPONER EXPLICACIÓN
        </button>
      )}
    </div>
  );
}
