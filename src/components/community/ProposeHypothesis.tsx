import { getSupabase } from '@lib/supabase-browser';
import clsx from 'clsx';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface Props {
  mysteryId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

const TITLE_MIN = 15;
const TITLE_MAX = 100;
const DESC_MAX = 255;

export default function ProposeHypothesis({ mysteryId, onSubmitted, onCancel }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const titleValid = title.trim().length >= TITLE_MIN;
  const descValid = description.length <= DESC_MAX && description.trim().length > 0;
  const canSubmit = titleValid && descValid && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError('');

    const sb = await getSupabase();
    const { error: err } = await sb.from('hypotheses').insert({
      mystery_id: mysteryId,
      title: title.trim(),
      description: description.trim(),
      author: user.email ?? 'Anónimo',
      votes_count: 0,
      display_order: 0,
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      onSubmitted();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-xl border border-yellow/30 bg-yellow/5">
      {/* Title */}
      <div>
        <label
          htmlFor="hyp-title"
          className="block text-[9px] font-bold tracking-[.12em] text-yellow/80 uppercase font-mono mb-1.5"
        >
          EXPLICACIÓN / TÍTULO
        </label>
        <input
          id="hyp-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Nombre conciso de la teoría..."
          required
          className="w-full min-h-[38px] px-3 border border-border bg-bg text-text text-xs font-mono rounded-lg outline-none focus:border-yellow transition-colors placeholder:text-text-muted/25"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-text-muted/40 font-mono">MÍNIMO {TITLE_MIN} CARACTERES</span>
          <span
            className={clsx('text-[8px] font-mono', title.length >= TITLE_MIN ? 'text-yellow' : 'text-text-muted/40')}
          >
            {title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="hyp-desc"
          className="block text-[9px] font-bold tracking-[.12em] text-yellow/80 uppercase font-mono mb-1.5"
        >
          DESARROLLO DE LA TEORÍA
        </label>
        <textarea
          id="hyp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESC_MAX}
          rows={4}
          placeholder="Desarrolla tu teoría con evidencias del canal..."
          required
          className="w-full px-3 py-2 border border-border bg-bg text-text text-xs font-mono rounded-lg outline-none focus:border-yellow transition-colors resize-none placeholder:text-text-muted/25"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-text-muted/40 font-mono">MÁXIMO {DESC_MAX} CARACTERES</span>
          <span
            className={clsx(
              'text-[8px] font-mono',
              description.length > DESC_MAX
                ? 'text-rust-hot'
                : description.length > 200
                  ? 'text-yellow'
                  : 'text-text-muted/40',
            )}
          >
            {description.length}/{DESC_MAX}
          </span>
        </div>
      </div>

      {/* Author (disabled) */}
      <div>
        <label
          htmlFor="hyp-author"
          className="block text-[9px] font-bold tracking-[.12em] text-yellow/80 uppercase font-mono mb-1.5"
        >
          PROPUESTO POR
        </label>
        <input
          id="hyp-author"
          type="text"
          value={user?.email ?? ''}
          disabled
          className="w-full min-h-[38px] px-3 border border-border bg-surface text-text-muted/50 text-xs font-mono rounded-lg cursor-not-allowed"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-lg border border-rust/30 bg-rust/10 text-rust-hot text-[10px] font-mono">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 min-h-[38px] px-4 border border-yellow bg-yellow text-bg text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:bg-yellow-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              ENVIANDO...
            </span>
          ) : (
            'ENVIAR HIPÓTESIS'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="min-h-[38px] px-4 border border-border text-text-muted text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:border-yellow hover:text-yellow disabled:opacity-40 transition-colors"
        >
          CANCELAR
        </button>
      </div>
    </form>
  );
}
