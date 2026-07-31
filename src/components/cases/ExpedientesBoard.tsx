import type { DossierData, SourceData } from '@lib/types';
import { useCallback, useEffect, useState } from 'react';
import CaseConnections from './CaseConnections';
import CaseDialog from './CaseDialog';
import CaseFilters from './CaseFilters';
import CaseGrid from './CaseGrid';
import CaseHoverEffects from './CaseHoverEffects';
import CaseTimeline from './CaseTimeline';

interface Props {
  dossiers: DossierData[];
  sources: SourceData[];
}

type View = 'board' | 'timeline';

export default function ExpedientesBoard({ dossiers, sources }: Props) {
  const [filtered, setFiltered] = useState<DossierData[]>(dossiers);
  const [view, setView] = useState<View>('board');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredCaseId, setHoveredCaseId] = useState<string | null>(null);

  const selectedDossier = selectedId ? (dossiers.find((d) => d.id === selectedId) ?? null) : null;

  const handleOpen = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      setSelectedId(customEvent.detail.id);
    };
    window.addEventListener('open-case', handler);
    return () => window.removeEventListener('open-case', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-case-id]');
      setHoveredCaseId(target?.dataset.caseId ?? null);
    };
    document.addEventListener('mouseover', handler);
    return () => document.removeEventListener('mouseover', handler);
  }, []);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8">
        <CaseFilters dossiers={dossiers} onFilterChange={setFiltered} onViewChange={setView} view={view} />
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold tracking-[.12em] text-yellow uppercase font-mono">
          {filtered.length} EXPEDIENTE{filtered.length === 1 ? '' : 'S'}
        </span>
      </div>

      {/* Content */}
      {view === 'board' ? (
        <CaseGrid dossiers={filtered} sources={sources} onOpenCase={handleOpen} />
      ) : (
        <CaseTimeline dossiers={filtered} sources={sources} onOpenCase={handleOpen} />
      )}

      {/* Dialog (client:only) */}
      <CaseDialog dossier={selectedDossier} sources={sources} allDossiers={dossiers} onClose={handleClose} />

      {/* SVG Connections overlay (client:visible) */}
      <CaseConnections dossiers={dossiers} hoveredCaseId={hoveredCaseId} />

      {/* Hover effects (client:idle) */}
      <CaseHoverEffects />
    </div>
  );
}
