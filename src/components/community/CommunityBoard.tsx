import type { MysteryData } from '@lib/types';
import { useState } from 'react';
import AuthBar from './AuthBar';
import AuthProvider from './AuthProvider';
import CommunityStats from './CommunityStats';
import MysteryDetail from './MysteryDetail';
import MysteryList from './MysteryList';
import MysteryToolbar from './MysteryToolbar';
import StreamMode from './StreamMode';

interface Props {
  mysteries: MysteryData[];
}

function CommunityBoardInner({ mysteries }: Props) {
  const [filtered, setFiltered] = useState<MysteryData[]>(mysteries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [streamOpen, setStreamOpen] = useState(false);

  const selectedMystery = selectedId ? (mysteries.find((m) => m.id === selectedId) ?? null) : null;

  return (
    <div className="space-y-6">
      {/* Auth bar */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono">
          ACCESO COMUNITARIO
        </span>
        <AuthBar />
      </div>

      <CommunityStats />

      <MysteryToolbar mysteries={mysteries} onFilterChange={setFiltered} onOpenStream={() => setStreamOpen(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <MysteryList mysteries={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <MysteryDetail mystery={selectedMystery} />
      </div>

      <StreamMode mysteries={mysteries} isOpen={streamOpen} onClose={() => setStreamOpen(false)} />
    </div>
  );
}

export default function CommunityBoard({ mysteries }: Props) {
  return (
    <AuthProvider>
      <CommunityBoardInner mysteries={mysteries} />
    </AuthProvider>
  );
}
