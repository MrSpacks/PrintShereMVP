"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { MakerSignupPayload } from "@/types/auth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  signupMaker: (payload: MakerSignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Failed to load session");

      const data = (await response.json()) as { user: User | null };
      setUser(data.user);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Auth error";
      setError(message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { user?: User; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Login failed");
    }

    if (!data.user) {
      throw new Error("Login failed");
    }

    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await response.json()) as { user?: User; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Signup failed");
      }

      if (!data.user) {
        throw new Error("Signup failed");
      }

      setUser(data.user);
      return data.user;
    },
    []
  );

  const signupMaker = useCallback(async (payload: MakerSignupPayload) => {
    const response = await fetch("/api/auth/signup/maker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { user?: User; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Maker registration failed");
    }

    if (!data.user) {
      throw new Error("Maker registration failed");
    }

    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      login,
      signup,
      signupMaker,
      logout,
      refetch,
    }),
    [user, isLoading, error, login, signup, signupMaker, logout, refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
