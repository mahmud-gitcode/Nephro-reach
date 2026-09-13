"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authenticate,
  AuthUser,
  clearSessionCookie,
  readSessionFromDocument,
  registerUser,
  writeSessionCookie,
} from "@/features/auth/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => AuthUser | null;
  loginAs: (user: AuthUser) => void;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => "ok" | "exists";
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readSessionFromDocument());
    setReady(true);
  }, []);

  const loginAs = useCallback((next: AuthUser) => {
    writeSessionCookie(next);
    setUser(next);
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const next = authenticate(email, password);
      if (!next) return null;
      loginAs(next);
      return next;
    },
    [loginAs],
  );

  const register = useCallback(
    (input: { name: string; email: string; password: string }) => {
      const result = registerUser(input);
      if ("error" in result) return result.error;
      loginAs(result.user);
      return "ok";
    },
    [loginAs],
  );

  const logout = useCallback(() => {
    clearSessionCookie();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, loginAs, register, logout }),
    [user, ready, login, loginAs, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
