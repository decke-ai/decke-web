"use client";

import { useEffect, useState, useCallback } from "react";
import { paragon, SDK_EVENT } from "@useparagon/connect";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/hooks/use-organization";

export interface ParagonIntegration {
  id: string;
  name: string;
  enabled: boolean;
  connected: boolean;
}

export function useParagon() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [integrations, setIntegrations] = useState<ParagonIntegration[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchParagonToken = useCallback(async () => {
    if (!organizationId || !user) return null;

    try {
      const response = await fetch(`/api/organizations/${organizationId}/paragon/token`);
      if (response.ok) {
        const data = await response.json();
        return data.token || data.jwt || data;
      }
      setError("Failed to fetch token");
    } catch {
      setError("Failed to fetch token");
      return null;
    }
    return null;
  }, [organizationId, user]);

  const updateIntegrations = useCallback(() => {
    const authedUser = paragon.getUser();
    if (authedUser && authedUser.authenticated) {
      const integrationsData = Object.entries(authedUser.integrations || {}).map(
        ([name, data]) => ({
          id: name,
          name,
          enabled: (data as { enabled?: boolean }).enabled || false,
          connected: (data as { enabled?: boolean }).enabled || false,
        })
      );
      setIntegrations(integrationsData);
    }
  }, []);

  useEffect(() => {
    const initParagon = async () => {
      const projectId = process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID;
      if (!projectId || !user || !organizationId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await fetchParagonToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        await paragon.authenticate(projectId, token);
        setIsReady(true);

        const authedUser = paragon.getUser();
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("Paragon authenticated user:", authedUser);
          if (authedUser.authenticated) {
            // eslint-disable-next-line no-console
            console.log("Available integrations:", Object.keys(authedUser.integrations || {}));
          }
        }

        updateIntegrations();

        paragon.subscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, () => {
          updateIntegrations();
        });

        paragon.subscribe(SDK_EVENT.ON_INTEGRATION_UNINSTALL, () => {
          updateIntegrations();
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize Paragon";
        setError(errorMessage);
        setIsReady(false);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initParagon();
  }, [user, organizationId, fetchParagonToken, updateIntegrations]);

  const connectIntegration = useCallback((integrationName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isReady) {
        toast.error("Paragon is not ready. Please try again.");
        resolve(false);
        return;
      }

      setIsConnecting(true);

      const onInstall = () => {
        updateIntegrations();
        setIsConnecting(false);
        paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, onInstall);
        resolve(true);
      };

      paragon.subscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, onInstall);

      try {
        paragon.connect(integrationName, {
          onClose: () => {
            setIsConnecting(false);
            paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, onInstall);
            resolve(false);
          },
          onError: (err: Error) => {
            const errorMessage = err.message || "Failed to connect integration";
            toast.error(errorMessage);
            setIsConnecting(false);
            paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, onInstall);
            resolve(false);
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect integration";
        if (errorMessage.includes("not found")) {
          toast.error(`Integration "${integrationName}" is not enabled in Paragon. Please configure it in the Paragon dashboard.`);
        } else {
          toast.error(errorMessage);
        }
        setIsConnecting(false);
        paragon.unsubscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, onInstall);
        resolve(false);
      }
    });
  }, [isReady, updateIntegrations]);

  const disconnectIntegration = useCallback(async (integrationName: string) => {
    if (!isReady) return;

    try {
      await paragon.uninstallIntegration(integrationName);
      updateIntegrations();
    } catch {
    }
  }, [isReady, updateIntegrations]);

  const isIntegrationConnected = useCallback((integrationName: string) => {
    const integration = integrations.find(
      (i) => i.name.toLowerCase() === integrationName.toLowerCase()
    );
    return integration?.connected || false;
  }, [integrations]);

  return {
    isReady,
    isLoading,
    isConnecting,
    integrations,
    error,
    connectIntegration,
    disconnectIntegration,
    isIntegrationConnected,
  };
}
