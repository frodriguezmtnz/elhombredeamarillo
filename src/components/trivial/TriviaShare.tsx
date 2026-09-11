import { useState } from 'react';
import type { TriviaSummary } from './TriviaGame';

interface Props {
  summary: TriviaSummary;
  rank: string;
}

const CARD_W = 1200;
const CARD_H = 630;

function drawCard(summary: TriviaSummary, rank: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas no disponible');

  // Fondo
  ctx.fillStyle = '#070805';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const glow = ctx.createRadialGradient(CARD_W * 0.85, 0, 40, CARD_W * 0.85, 0, 700);
  glow.addColorStop(0, 'rgba(244, 201, 67, 0.16)');
  glow.addColorStop(1, 'rgba(244, 201, 67, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Marco de expediente
  ctx.strokeStyle = '#212318';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, CARD_W - 56, CARD_H - 56);

  const mono = (px: number) => `${px}px "JetBrains Mono", monospace`;
  const pixel = (px: number) => `${px}px "VT323", monospace`;

  // Cabecera
  ctx.fillStyle = '#e4b722';
  ctx.font = mono(22);
  ctx.fillText('TRIVIAL DEL PUEBLO // EL HOMBRE DE AMARILLO', 72, 108);

  // Puntuación
  ctx.fillStyle = '#f1ebdc';
  ctx.font = pixel(150);
  ctx.fillText(`${summary.score} PTS`, 68, 268);

  // Detalle
  ctx.fillStyle = '#e4b722';
  ctx.font = mono(24);
  ctx.fillText('RANGO', 72, 336);
  ctx.fillStyle = '#f4c943';
  ctx.font = pixel(72);
  ctx.fillText(rank, 68, 402);

  ctx.fillStyle = 'rgba(241, 235, 220, 0.72)';
  ctx.font = pixel(46);
  ctx.fillText(
    `${summary.correct}/${summary.total} aciertos · modo ${summary.modeLabel} · mejor racha x${summary.bestStreak}`,
    68,
    478,
  );

  // Call a la acción + URL
  ctx.fillStyle = '#e4b722';
  ctx.font = mono(20);
  ctx.fillText('¿AGUANTAS TÚ EL TIPO DE CAMBIO?', 72, 540);
  ctx.fillStyle = 'rgba(241, 235, 220, 0.5)';
  ctx.font = mono(18);
  ctx.fillText('elhombredeamarillo.vercel.app/trivial', 72, 572);

  return canvas;
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('no se pudo generar la imagen'));
    }, 'image/png');
  });
}

export default function TriviaShare({ summary, rank }: Props) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'shared' | 'downloaded' | 'error'>('idle');

  async function share() {
    setStatus('busy');
    try {
      await document.fonts.ready;
      const blob = await toBlob(drawCard(summary, rank));
      const text = `He hecho ${summary.correct}/${summary.total} (${summary.score} pts) en el Trivial del Pueblo de FROM: rango ${rank}. ¿Aguantas tú el tipo de cambio?`;
      const file = new File([blob], 'trivial-fromville.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Trivial del Pueblo', text });
          setStatus('shared');
          return;
        } catch {
          // cancelado por el usuario: probamos descarga
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trivial-fromville.png';
      a.click();
      URL.revokeObjectURL(url);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // sin portapapeles: la descarga basta
      }
      setStatus('downloaded');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={share}
        disabled={status === 'busy'}
        className="inline-flex items-center gap-3 min-h-[48px] px-5 border border-yellow/50 text-yellow text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:bg-yellow/10 transition-all cursor-pointer disabled:opacity-50"
      >
        {status === 'busy' ? 'REVELANDO FOTOGRAFÍA...' : 'COMPARTIR RESULTADO'} <b>↗</b>
      </button>
      {status === 'shared' && (
        <p className="text-[9px] font-bold tracking-[.1em] text-yellow/70 uppercase font-mono">Enviado al pueblo.</p>
      )}
      {status === 'downloaded' && (
        <p className="text-[9px] font-bold tracking-[.1em] text-text-muted/70 uppercase font-mono">
          Tarjeta descargada · texto copiado al portapapeles.
        </p>
      )}
      {status === 'error' && (
        <p className="text-[9px] font-bold tracking-[.1em] text-rust-hot uppercase font-mono">
          El pueblo se ha negado: inténtalo otra vez.
        </p>
      )}
    </div>
  );
}
