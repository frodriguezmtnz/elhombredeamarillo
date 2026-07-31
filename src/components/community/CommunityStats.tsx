import { MYSTERIES, getTotalHypotheses, getTotalVotes } from '@data/mysteries';

export default function CommunityStats() {
  const openMysteries = MYSTERIES.length;
  const totalHyp = getTotalHypotheses();
  const totalVotes = getTotalVotes();

  const stats = [
    { value: openMysteries, label: 'MITSTERIOS ABIERTOS' },
    { value: totalHyp, label: 'HIPÓTESIS' },
    { value: totalVotes, label: 'VOTOS TOTALES' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
