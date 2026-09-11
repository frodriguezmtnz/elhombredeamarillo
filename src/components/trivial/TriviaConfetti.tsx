import { useEffect, useRef } from 'react';

const COLORS = ['#e4b722', '#f4c943', '#d36255', '#f1ebdc', '#9d3e32'];
const PARTICLES = 160;
const LIFETIME_MS = 4200;

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
}

/**
 * Confeti de celebración sobre toda la pantalla (se autorretira).
 * Solo para partidas perfectas. Respeta prefers-reduced-motion.
 */
export default function TriviaConfetti({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone?.();
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const pieces: Piece[] = Array.from({ length: PARTICLES }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.5,
      w: (6 + Math.random() * 6) * dpr,
      h: (4 + Math.random() * 5) * dpr,
      vx: (Math.random() - 0.5) * 1.6 * dpr,
      vy: (2 + Math.random() * 3.2) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      const fade = elapsed > LIFETIME_MS - 900 ? Math.max(0, 1 - (elapsed - (LIFETIME_MS - 900)) / 900) : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = fade;

      for (const p of pieces) {
        p.x += p.vx + Math.sin(now / 300 + p.rot) * 0.4 * dpr;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < LIFETIME_MS) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onDone]);

  return (
    <canvas ref={canvasRef} role="presentation" className="fixed inset-0 z-[70] w-full h-full pointer-events-none" />
  );
}
