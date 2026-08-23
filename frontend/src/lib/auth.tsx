import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import * as api from "./api";
import type { User } from "./types";

/**
 * Session handling for the mock API. When the FastAPI backend is connected,
 * keep this interface and swap the internals for token-based auth
 * (store the JWT returned by POST /auth/login and send it as a Bearer header).
 */

const SESSION_KEY = "apex_session";

interface AuthContextValue {
  user: User | null;
  /** false until the saved session has been read (avoids SSR flash). */
  hydrated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      // corrupted session — start signed out
    }
    setHydrated(true);
  }, []);

  const persist = (next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  };

  const login = useCallback(async (email: string, password: string) => {
  const result = await api.login(email, password);
  persist(result.user);
  return result.user;
}, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
  const result = await api.register(name, email, password);
  persist(result.user);
  return result.user;
}, []);

  const logout = useCallback(() => persist(null), []);

  return (
    <AuthContext.Provider value={{ user, hydrated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
