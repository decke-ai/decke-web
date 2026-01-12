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

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  onboarding: boolean;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  backendUser: BackendUser | null;
  isLoading: boolean;
  isCheckingBackend: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const hasTrackedSignIn = useRef(false);

  const checkUserInBackend = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const response = await fetch("/api/authentication/me");
      const data = await response.json();

      if (data.exists && data.organization) {
        setOrganization(data.organization);

        if (data.user) {
          setBackendUser(data.user);
          setNeedsOnboarding(!data.user.onboarding);
        } else {
          setBackendUser(null);
          setNeedsOnboarding(true);
        }
      } else {
        setOrganization(null);
        setBackendUser(null);
        setNeedsOnboarding(true);
      }
    } catch {
      setOrganization(null);
      setBackendUser(null);
      setNeedsOnboarding(true);
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

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

          await checkUserInBackend();

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
          setOrganization(null);
          setBackendUser(null);
          setNeedsOnboarding(false);
          setIsCheckingBackend(false);
        }
      } else {
        setUser(null);
        setOrganization(null);
        setBackendUser(null);
        setNeedsOnboarding(false);
        setIsCheckingBackend(false);
      }
    } catch {
      setUser(null);
      setOrganization(null);
      setBackendUser(null);
      setNeedsOnboarding(false);
      setIsCheckingBackend(false);
    } finally {
      setIsLoading(false);
    }
  }, [checkUserInBackend]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        backendUser,
        isLoading,
        isCheckingBackend,
        isAuthenticated: !!user,
        needsOnboarding,
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
