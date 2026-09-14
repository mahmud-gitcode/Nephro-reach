"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useIsMounted } from "@/lib/utils/useIsMounted";
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
  /* The session lives in a cookie, which the server render cannot read, so
     `user` stays null until React hydrates. `session` holds what login and
     logout set during this page's life; before either happens we fall back
     to whatever the cookie already says. `ready` is just "have we looked
     yet" — consumers use it to avoid flashing a signed-out UI. */
  const [session, setSession] = useState<AuthUser | null>(null);
  const ready = useIsMounted();
  const user = ready ? (session ?? readSessionFromDocument()) : null;

  const loginAs = useCallback((next: AuthUser) => {
    writeSessionCookie(next);
    setSession(next);
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
    setSession(null);
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
