import React, { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  isAuthenticated: boolean;
  skipped: boolean;
};

type AuthCtx = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  skip: () => void;
};

const Ctx = createContext<AuthCtx>({
  isAuthenticated: false,
  skipped: false,
  login: async () => {},
  logout: () => {},
  skip: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthed] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const login = async (email: string, password: string) => {
    setAuthed(true);
    setSkipped(false);
  };

  const logout = () => {
    setAuthed(false);
    setSkipped(false);
  };

  const skip = () => {
    setSkipped(true);
  };

  const value = useMemo(
    () => ({ isAuthenticated, skipped, login, logout, skip }),
    [isAuthenticated, skipped]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}