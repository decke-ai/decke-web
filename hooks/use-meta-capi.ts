"use client";

import { useState, useCallback } from "react";
import type {
  MetaServerEvent,
  MetaEventResponse,
  MetaIntegrationConfig,
  MetaEventName,
  MetaActionSource,
  MetaCustomData,
} from "@/lib/meta/types";

interface UseMetaCapiOptions {
  organizationId: string;
}

interface MetaConfigState {
  configured: boolean;
  config: MetaIntegrationConfig | null;
}

interface SendEventOptions {
  pixelId?: string;
  eventName: MetaEventName | string;
  actionSource: MetaActionSource;
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string;
    fbp?: string;
  };
  customData?: MetaCustomData;
  eventSourceUrl?: string;
  eventId?: string;
  testEventCode?: string;
}

export function useMetaCapi({ organizationId }: UseMetaCapiOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MetaConfigState | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/meta/config`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch configuration");
      }

      const data: MetaConfigState = await response.json();
      setConfig(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const saveConfig = useCallback(
    async (configData: {
      pixel_id: string;
      access_token: string;
      test_event_code?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/meta/config`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(configData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save configuration");
        }

        const data: MetaIntegrationConfig = await response.json();
        setConfig({ configured: true, config: data });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  const updateConfig = useCallback(
    async (configData: {
      pixel_id?: string;
      access_token?: string;
      test_event_code?: string;
      is_active?: boolean;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/meta/config`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(configData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update configuration");
        }

        const data: MetaIntegrationConfig = await response.json();
        setConfig({ configured: true, config: data });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  const deleteConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/meta/config`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete configuration");
      }

      setConfig({ configured: false, config: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const hashValue = (value: string): string => {
    return value;
  };

  const buildUserData = (userData: SendEventOptions["userData"]) => {
    const data: Record<string, unknown> = {};

    if (userData.email) {
      data.em = [hashValue(userData.email.toLowerCase().trim())];
    }
    if (userData.phone) {
      data.ph = [hashValue(userData.phone.replace(/\D/g, ""))];
    }
    if (userData.firstName) {
      data.fn = [hashValue(userData.firstName.toLowerCase())];
    }
    if (userData.lastName) {
      data.ln = [hashValue(userData.lastName.toLowerCase())];
    }
    if (userData.city) {
      data.ct = [hashValue(userData.city.toLowerCase().replace(/[^a-z]/g, ""))];
    }
    if (userData.state) {
      data.st = [hashValue(userData.state.toLowerCase().replace(/[^a-z]/g, ""))];
    }
    if (userData.zipCode) {
      data.zp = [hashValue(userData.zipCode.replace(/\s/g, ""))];
    }
    if (userData.country) {
      data.country = [hashValue(userData.country.toLowerCase())];
    }
    if (userData.externalId) {
      data.external_id = [hashValue(userData.externalId)];
    }
    if (userData.clientIpAddress) {
      data.client_ip_address = userData.clientIpAddress;
    }
    if (userData.clientUserAgent) {
      data.client_user_agent = userData.clientUserAgent;
    }
    if (userData.fbc) {
      data.fbc = userData.fbc;
    }
    if (userData.fbp) {
      data.fbp = userData.fbp;
    }

    return data;
  };

  const sendEvent = useCallback(
    async (options: SendEventOptions): Promise<MetaEventResponse | null> => {
      setIsSending(true);
      setError(null);

      const pixelId = options.pixelId || config?.config?.pixel_id;

      if (!pixelId) {
        setError("Pixel ID is required");
        setIsSending(false);
        return null;
      }

      const event: MetaServerEvent = {
        event_name: options.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: options.actionSource,
        user_data: buildUserData(options.userData),
      };

      if (options.eventSourceUrl) {
        event.event_source_url = options.eventSourceUrl;
      }

      if (options.eventId) {
        event.event_id = options.eventId;
      }

      if (options.customData) {
        event.custom_data = options.customData;
      }

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/meta/events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pixel_id: pixelId,
              events: [event],
              test_event_code: options.testEventCode || config?.config?.test_event_code,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send event");
        }

        const data: MetaEventResponse = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [organizationId, config]
  );

  const sendEvents = useCallback(
    async (
      events: MetaServerEvent[],
      pixelId?: string,
      testEventCode?: string
    ): Promise<MetaEventResponse | null> => {
      setIsSending(true);
      setError(null);

      const targetPixelId = pixelId || config?.config?.pixel_id;

      if (!targetPixelId) {
        setError("Pixel ID is required");
        setIsSending(false);
        return null;
      }

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/meta/events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pixel_id: targetPixelId,
              events,
              test_event_code: testEventCode || config?.config?.test_event_code,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send events");
        }

        const data: MetaEventResponse = await response.json();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [organizationId, config]
  );

  const trackLead = useCallback(
    async (userData: SendEventOptions["userData"], customData?: MetaCustomData) => {
      return sendEvent({
        eventName: "Lead",
        actionSource: "website",
        userData,
        customData,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
    },
    [sendEvent]
  );

  const trackPurchase = useCallback(
    async (
      userData: SendEventOptions["userData"],
      value: number,
      currency: string,
      orderId?: string
    ) => {
      return sendEvent({
        eventName: "Purchase",
        actionSource: "website",
        userData,
        customData: {
          value,
          currency,
          order_id: orderId,
        },
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
    },
    [sendEvent]
  );

  const trackPageView = useCallback(
    async (userData: SendEventOptions["userData"]) => {
      return sendEvent({
        eventName: "PageView",
        actionSource: "website",
        userData,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
    },
    [sendEvent]
  );

  const trackContact = useCallback(
    async (userData: SendEventOptions["userData"]) => {
      return sendEvent({
        eventName: "Contact",
        actionSource: "website",
        userData,
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
    },
    [sendEvent]
  );

  return {
    config,
    isLoading,
    isSending,
    error,
    fetchConfig,
    saveConfig,
    updateConfig,
    deleteConfig,
    sendEvent,
    sendEvents,
    trackLead,
    trackPurchase,
    trackPageView,
    trackContact,
  };
}
