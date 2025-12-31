"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import posthog from "posthog-js";

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasTrackedSignIn = useRef(false);

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch("/auth/me");
      if (response.ok) {
        const session = await response.json();
        if (session?.user) {
          const userData = {
            id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
          };
          setUser(userData);

          // Track sign in only once per session
          if (!hasTrackedSignIn.current) {
            hasTrackedSignIn.current = true;
            posthog.capture("user_signin", {
              user_id: userData.id,
              user_email: userData.email,
            });
            posthog.identify(userData.id, {
              email: userData.email,
            });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser: loadUser,
      }}
    >
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
