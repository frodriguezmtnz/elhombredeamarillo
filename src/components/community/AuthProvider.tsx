import { getSupabase } from '@lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase().then((sb) => {
      sb.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = sb.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = await getSupabase();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = await getSupabase();
    const { error, data } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && !data.session) {
      return { message: 'Cuenta creada. Revisa tu email para confirmar.' };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const sb = await getSupabase();
    await sb.auth.signOut();
  }, []);

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
