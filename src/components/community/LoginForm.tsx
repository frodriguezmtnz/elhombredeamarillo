import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginForm({ isOpen, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setMessage('');
      setMode('login');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password);

    if (result.error) setError(result.error);
    if (result.message) setMessage(result.message);
    setSubmitting(false);

    if (!result.error && !result.message && mode === 'login') {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full max-w-sm mx-auto my-auto bg-transparent border-0 rounded-2xl shadow-2xl overflow-visible backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClose={onClose}
    >
      <div className="relative bg-bg border border-border rounded-2xl overflow-hidden">
        {/* Header glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow/40 to-transparent" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 grid place-items-center text-text-muted/40 hover:text-yellow rounded-lg hover:bg-yellow/10 transition-colors z-10"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="p-6">
          {/* Title */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 text-[8px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono border border-yellow/20 rounded-full mb-3">
              ARCHIVO COMUNITARIO
            </span>
            <h2 className="font-pixel text-xl uppercase text-text">{mode === 'login' ? 'Acceso' : 'Registro'}</h2>
            <p className="text-text-muted/60 text-[10px] font-mono mt-1">
              {mode === 'login' ? 'Entra para votar y proponer hipótesis.' : 'Crea una cuenta para participar.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-[8px] font-bold tracking-[.12em] text-text-muted/60 uppercase font-mono mb-1.5"
              >
                EMAIL
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="tu@email.com"
                required
                className="w-full min-h-[40px] px-3 border border-border bg-surface text-text text-xs font-mono rounded-lg outline-none focus:border-yellow focus:ring-1 focus:ring-yellow/20 transition-colors placeholder:text-text-muted/25"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-[8px] font-bold tracking-[.12em] text-text-muted/60 uppercase font-mono mb-1.5"
              >
                CONTRASEÑA
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full min-h-[40px] px-3 border border-border bg-surface text-text text-xs font-mono rounded-lg outline-none focus:border-yellow focus:ring-1 focus:ring-yellow/20 transition-colors placeholder:text-text-muted/25"
              />
            </div>

            {/* Error / Message */}
            {error && (
              <div className="px-3 py-2 rounded-lg border border-rust/30 bg-rust/10 text-rust-hot text-[10px] font-mono">
                {error}
              </div>
            )}
            {message && (
              <div className="px-3 py-2 rounded-lg border border-yellow/30 bg-yellow/10 text-yellow text-[10px] font-mono">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[42px] border border-yellow bg-yellow text-bg text-[10px] font-bold tracking-[.14em] uppercase font-mono rounded-lg hover:bg-yellow-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  ESPERA...
                </span>
              ) : mode === 'login' ? (
                'ENTRAR'
              ) : (
                'CREAR CUENTA'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <span className="text-text-muted/40 text-[9px] font-mono">
              {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }}
              className="text-yellow text-[9px] font-bold font-mono hover:text-yellow-bright transition-colors"
            >
              {mode === 'login' ? 'REGÍSTRATE' : 'INICIA SESIÓN'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
