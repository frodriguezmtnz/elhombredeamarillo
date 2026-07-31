import type { DossierData, SourceData } from '@lib/types';
import CaseCard from './CaseCard';

interface Props {
  dossiers: DossierData[];
  sources: SourceData[];
  onOpenCase: (id: string) => void;
}

export default function CaseGrid({ dossiers, sources, onOpenCase }: Props) {
  if (dossiers.length === 0) {
    return (
      <div className="py-10 text-center text-text-muted text-sm">No se encontraron expedientes con esos criterios.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {dossiers.map((dossier, i) => (
        <CaseCard key={dossier.id} dossier={dossier} sources={sources} index={i} onOpen={onOpenCase} />
      ))}
    </div>
  );
}
