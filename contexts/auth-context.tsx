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
      console.log("=== checkUserInBackend START ===");
      const response = await fetch("/api/authentication/me");
      console.log("Response status:", response.status);
      const data = await response.json();

      console.log("=== checkUserInBackend RESPONSE ===");
      console.log("Raw data:", JSON.stringify(data, null, 2));

      if (data.exists && data.organization) {
        console.log("Setting organization:", data.organization.id, data.organization.name);
        setOrganization(data.organization);

        if (data.user) {
          console.log("Setting backendUser:", data.user.id, "onboarding:", data.user.onboarding);
          setBackendUser(data.user);
          setNeedsOnboarding(!data.user.onboarding);
        } else {
          console.log("User NOT found in organization - setting needsOnboarding=true");
          setBackendUser(null);
          setNeedsOnboarding(true);
        }
      } else {
        console.log("Organization NOT found - exists:", data.exists, "org:", data.organization);
        setOrganization(null);
        setBackendUser(null);
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error("checkUserInBackend error:", error);
      setOrganization(null);
      setBackendUser(null);
      setNeedsOnboarding(true);
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    console.log("=== loadUser START ===");
    try {
      const response = await fetch("/auth/me");
      console.log("/auth/me response status:", response.status);
      if (response.ok) {
        const session = await response.json();
        console.log("/auth/me session:", JSON.stringify(session, null, 2));
        if (session?.user) {
          const userData = {
            id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
          };
          console.log("Setting user:", userData.email);
          setUser(userData);

          console.log("About to call checkUserInBackend...");
          await checkUserInBackend();
          console.log("checkUserInBackend completed");

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

  useEffect(() => {
    console.log("=== Auth State Changed ===");
    console.log("isLoading:", isLoading);
    console.log("isCheckingBackend:", isCheckingBackend);
    console.log("isAuthenticated:", !!user);
    console.log("user:", user);
    console.log("organization:", organization);
    console.log("backendUser:", backendUser);
    console.log("needsOnboarding:", needsOnboarding);
  }, [isLoading, isCheckingBackend, user, organization, backendUser, needsOnboarding]);

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
