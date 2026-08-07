import { getSupabase } from '@lib/supabase-browser';
import type { MysteryData } from '@lib/types';
import { useCallback, useEffect, useState } from 'react';
import AuthBar from './AuthBar';
import AuthProvider, { useAuth } from './AuthProvider';
import CommunityStats from './CommunityStats';
import MysteryDetail from './MysteryDetail';
import MysteryList from './MysteryList';
import MysteryToolbar from './MysteryToolbar';
import StreamMode from './StreamMode';

interface SupabaseHypothesisRow {
  id: string;
  title: string;
  votes_count: number;
}

interface SupabaseMysteryRow {
  id: string;
  code: string;
  title: string;
  short_title: string;
  category: string;
  context: string;
  contributors: string;
  mentions_count: number;
  hypotheses: SupabaseHypothesisRow[];
}

function mapRow(row: SupabaseMysteryRow): MysteryData {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    shortTitle: row.short_title,
    category: row.category as MysteryData['category'],
    context: row.context,
    contributors: row.contributors ?? '',
    mentions: row.mentions_count ?? 0,
    hypotheses: (row.hypotheses ?? []).map((h) => ({
      id: h.id,
      title: h.title,
      description: '',
      author: '',
      votes: h.votes_count ?? 0,
    })),
  };
}

function CommunityBoardInner() {
  const { user } = useAuth();
  const [mysteries, setMysteries] = useState<MysteryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtered, setFiltered] = useState<MysteryData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);
  const [myVotesActive, setMyVotesActive] = useState(false);
  const [votedHypIds, setVotedHypIds] = useState<Set<string>>(new Set());

  const selectedMystery = selectedId ? (mysteries.find((m) => m.id === selectedId) ?? null) : null;

  useEffect(() => {
    getSupabase().then((sb) => {
      sb.from('mysteries')
        .select('*, hypotheses(id, title, votes_count)')
        .order('display_order')
        .then(({ data, error: err }) => {
          if (err) {
            setError(err.message);
            setLoading(false);
            return;
          }
          const mapped = (data as SupabaseMysteryRow[]).map(mapRow);
          setMysteries(mapped);
          setFiltered(mapped);
          setLoading(false);
        });
    });
  }, []);

  const fetchVotedIds = useCallback(async () => {
    if (!user) {
      setVotedHypIds(new Set());
      return;
    }
    const sb = await getSupabase();
    const { data } = await sb.from('votes').select('hypothesis_id').eq('user_id', user.id);
    setVotedHypIds(new Set(data?.map((v) => v.hypothesis_id) ?? []));
  }, [user]);

  useEffect(() => {
    if (myVotesActive) fetchVotedIds();
    else setVotedHypIds(new Set());
  }, [myVotesActive, fetchVotedIds]);

  const toggleMyVotes = useCallback(() => {
    if (!user) return;
    setMyVotesActive((prev) => !prev);
  }, [user]);

  const handleFilterChange = useCallback((newFiltered: MysteryData[]) => {
    setFiltered(newFiltered);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <span className="w-4 h-4 border-2 border-text-muted/20 border-t-yellow rounded-full animate-spin" />
        <span className="text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          Cargando misterios...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl border border-rust/30 bg-rust/5 text-center">
        <p className="text-rust-hot text-xs font-mono">Error cargando misterios: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auth bar */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono">
          ACCESO COMUNITARIO
        </span>
        <AuthBar />
      </div>

      <CommunityStats mysteries={mysteries} />

      <MysteryToolbar
        mysteries={mysteries}
        onFilterChange={handleFilterChange}
        onOpenStream={() => setStreamOpen(true)}
        myVotesActive={myVotesActive}
        onMyVotesToggle={toggleMyVotes}
        votedHypIds={votedHypIds}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <MysteryList mysteries={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <MysteryDetail mystery={selectedMystery} />
      </div>

      <StreamMode mysteries={mysteries} isOpen={streamOpen} onClose={() => setStreamOpen(false)} />
    </div>
  );
}

export default function CommunityBoard() {
  return (
    <AuthProvider>
      <CommunityBoardInner />
    </AuthProvider>
  );
}
