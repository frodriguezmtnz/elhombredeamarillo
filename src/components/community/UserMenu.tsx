import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const email = user.email ?? 'Usuario';
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 min-h-[34px] px-2.5 border border-border bg-surface rounded-lg hover:border-yellow transition-colors"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <span className="w-6 h-6 rounded-full bg-yellow/20 border border-yellow/30 flex items-center justify-center text-yellow text-[10px] font-bold font-mono">
          {initial}
        </span>
        <span className="hidden sm:inline text-[10px] font-bold tracking-[.06em] text-text-muted font-mono max-w-[120px] truncate">
          {email}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            role="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
          />
          <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 w-56 p-3 rounded-xl border border-border bg-surface shadow-xl">
            <p className="text-[9px] font-bold tracking-[.1em] text-text-muted/40 uppercase font-mono mb-2">
              CONECTADO COMO
            </p>
            <p className="text-text text-xs font-mono truncate mb-3">{email}</p>
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="w-full py-2 border border-border text-text-muted text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:border-rust hover:text-rust-hot transition-colors"
            >
              CERRAR SESIÓN
            </button>
          </div>
        </>
      )}
    </div>
  );
}
