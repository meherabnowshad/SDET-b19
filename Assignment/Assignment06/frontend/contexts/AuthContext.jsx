// contexts/AuthContext.jsx — global authentication state.
// Knows: is the user authenticated? who? what role? what avatar?
// Persists across refresh: token in localStorage, profile re-fetched once.
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { userService } from "@/services/user.service";
import {
  clearSession,
  getCachedUser,
  getToken,
  setSession,
  updateCachedUser,
} from "@/utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until refresh-check finishes

  // On first load: if a token exists, trust-but-verify via GET /users/profile.
  useEffect(() => {
    const boot = async () => {
      const token = getToken();
      if (!token) {
        setReady(true);
        return;
      }
      setUser(getCachedUser()); // instant paint, then verify
      try {
        const res = await userService.getProfile();
        setUser(res.data.data);
        updateCachedUser(res.data.data);
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setReady(true);
      }
    };
    boot();
  }, []);

  const login = useCallback((token, nextUser) => {
    setSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await userService.getProfile();
    setUser(res.data.data);
    updateCachedUser(res.data.data);
    return res.data.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, ready, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
