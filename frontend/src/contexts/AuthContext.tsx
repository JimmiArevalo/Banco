import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile } from "../services/api";
import { Client } from "../types";

interface AuthContextValue {
  token: string | null;
  client: Client | null;
  setSession: (token: string, client: Client) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "banco.accessToken";
const CLIENT_KEY = "banco.client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  );
  const [client, setClient] = useState<Client | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(CLIENT_KEY);
    return stored ? (JSON.parse(stored) as Client) : null;
  });

  useEffect(() => {
    if (token && !client) {
      getProfile()
        .then((profile) => updateSession(token, profile))
        .catch(() => clearSession());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const clearSession = () => {
    setToken(null);
    setClient(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CLIENT_KEY);
    }
  };

  const updateSession = (newToken: string, newClient: Client) => {
    setToken(newToken);
    setClient(newClient);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(CLIENT_KEY, JSON.stringify(newClient));
    }
  };

  const value = useMemo(
    () => ({
      token,
      client,
      setSession: updateSession,
      logout: clearSession,
    }),
    [token, client]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

