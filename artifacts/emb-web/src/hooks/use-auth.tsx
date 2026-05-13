import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("emb_token");
    } catch {
      return null;
    }
  });

  const queryClient = useQueryClient();

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("emb_token", newToken);
    } else {
      localStorage.removeItem("emb_token");
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    }
  };

  const logout = () => {
    setToken(null);
  };

  const { data: user = null, isLoading: isUserLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  // If we have a token but getMe fails, we might want to clear the token,
  // but let's just let it be null for now.

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{ user, token, setToken, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
