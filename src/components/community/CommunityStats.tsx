import type { MysteryData } from '@lib/types';

interface Props {
  mysteries: MysteryData[];
}

export default function CommunityStats({ mysteries }: Props) {
  const openMysteries = mysteries.length;
  const totalHyp = mysteries.reduce((s, m) => s + m.hypotheses.length, 0);
  const totalVotes = mysteries.reduce((s, m) => s + m.hypotheses.reduce((v, h) => v + h.votes, 0), 0);

  const stats = [
    { value: openMysteries, label: 'MISTERIOS ABIERTOS' },
    { value: totalHyp, label: 'HIPÓTESIS' },
    { value: totalVotes, label: 'VOTOS TOTALES' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="p-4 rounded-xl border border-border bg-surface text-center">
          <span className="font-pixel text-2xl text-yellow block">{s.value}</span>
          <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono mt-1 block">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
