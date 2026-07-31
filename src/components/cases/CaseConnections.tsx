import type { DossierData } from '@lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  dossiers: DossierData[];
  hoveredCaseId: string | null;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fromId: string;
  toId: string;
}

export default function CaseConnections({ dossiers, hoveredCaseId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const calculateLines = useCallback(() => {
    if (isMobile) return;

    const newLines: Line[] = [];
    const processed = new Set<string>();

    for (const dossier of dossiers) {
      const fromEl = document.querySelector(`[data-case-id="${dossier.id}"]`);
      if (!fromEl) continue;

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2;
      const fromY = fromRect.top + fromRect.height / 2;

      for (const relatedId of dossier.related) {
        const key = [dossier.id, relatedId].sort().join('-');
        if (processed.has(key)) continue;
        processed.add(key);

        const toEl = document.querySelector(`[data-case-id="${relatedId}"]`);
        if (!toEl) continue;

        const toRect = toEl.getBoundingClientRect();
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;

        newLines.push({
          x1: fromX,
          y1: fromY,
          x2: toX,
          y2: toY,
          fromId: dossier.id,
          toId: relatedId,
        });
      }
    }

    setLines(newLines);
  }, [dossiers, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(calculateLines);
    });

    observer.observe(document.body);
    calculateLines();

    window.addEventListener('scroll', calculateLines, { passive: true });
    window.addEventListener('resize', calculateLines);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', calculateLines);
      window.removeEventListener('resize', calculateLines);
    };
  }, [calculateLines, isMobile]);

  if (isMobile || lines.length === 0) return null;

  return (
    <svg ref={svgRef} className="fixed inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
      {lines.map((line) => {
        const key = `${line.fromId}-${line.toId}`;
        const isHighlighted = hoveredCaseId && (line.fromId === hoveredCaseId || line.toId === hoveredCaseId);

        return (
          <g key={key}>
            {/* Glow effect */}
            {isHighlighted && (
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="rgba(211, 98, 85, 0.3)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            )}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={isHighlighted ? '#d36255' : 'rgba(157, 62, 50, 0.15)'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={isHighlighted ? 'none' : '4 4'}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
            {/* Endpoints */}
            {isHighlighted && (
              <>
                <circle cx={line.x1} cy={line.y1} r="4" fill="#d36255" />
                <circle cx={line.x2} cy={line.y2} r="4" fill="#d36255" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
