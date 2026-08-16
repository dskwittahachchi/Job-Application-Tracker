import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types";

type Credentials = { email: string; password: string };
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (input: Credentials & { name: string }) => Promise<void>;
  useDemo: () => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("trackly_token")) {
      setLoading(false);
      return;
    }
    api.me().then((result) => setUser(result.data)).catch(() => localStorage.removeItem("trackly_token")).finally(() => setLoading(false));
  }, []);

  const finishAuthentication = useCallback((result: Awaited<ReturnType<typeof api.login>>) => {
    localStorage.setItem("trackly_token", result.data.token);
    setUser(result.data.user);
  }, []);
  const login = useCallback(async (credentials: Credentials) => finishAuthentication(await api.login(credentials)), [finishAuthentication]);
  const register = useCallback(async (input: Credentials & { name: string }) => finishAuthentication(await api.register(input)), [finishAuthentication]);
  const useDemo = useCallback(() => login({ email: "demo@trackly.dev", password: "Demo123!" }), [login]);
  const logout = useCallback(() => {
    localStorage.removeItem("trackly_token");
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, loading, login, register, useDemo, logout }), [user, loading, login, register, useDemo, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
