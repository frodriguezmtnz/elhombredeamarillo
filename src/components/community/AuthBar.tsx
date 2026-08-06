import { useAuth } from './AuthProvider';
import LoginForm from './LoginForm';
import UserMenu from './UserMenu';

export default function AuthBar() {
  const { user, loading, loginOpen, openLogin, closeLogin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[9px] font-bold tracking-[.1em] text-text-muted/40 uppercase font-mono">
        <span className="w-3 h-3 border-2 border-text-muted/20 border-t-yellow rounded-full animate-spin" />
        CARGANDO...
      </div>
    );
  }

  if (user) return <UserMenu />;

  return (
    <>
      <button
        type="button"
        onClick={openLogin}
        className="flex items-center gap-2 min-h-[34px] px-3 border border-yellow/30 bg-yellow/10 text-yellow text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:bg-yellow hover:text-bg transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        INICIAR SESIÓN
      </button>

      <LoginForm isOpen={loginOpen} onClose={closeLogin} />
    </>
  );
}
