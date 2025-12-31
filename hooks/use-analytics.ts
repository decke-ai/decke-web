"use client";

import posthog from "posthog-js";
import { useCallback } from "react";

interface UserEventProperties {
  user_id: string;
  user_email: string;
}

export function useAnalytics() {
  const trackUserSignIn = useCallback((properties: UserEventProperties) => {
    posthog.capture("user_signin", properties);
    posthog.identify(properties.user_id, {
      email: properties.user_email,
    });
  }, []);

  const trackUserSignOut = useCallback((properties: UserEventProperties) => {
    posthog.capture("user_signout", properties);
    posthog.reset();
  }, []);

  return {
    trackUserSignIn,
    trackUserSignOut,
  };
}
