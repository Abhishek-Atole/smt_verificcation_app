import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { AUTH_USERS } from '../data/mock';
import type { AppUser } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  quickLogin: (role: 'admin' | 'operator') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, login: async () => false, quickLogin: () => undefined, logout: () => undefined });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const value = useMemo<AuthContextValue>(() => {
    const login = async (email: string, _password: string) => {
      const role = email.includes('sarah') ? 'operator' : 'admin';
      setUser(AUTH_USERS[role]);
      return true;
    };

    const quickLogin = (role: 'admin' | 'operator') => setUser(AUTH_USERS[role]);
    const logout = () => setUser(null);

    return { user, login, quickLogin, logout };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
