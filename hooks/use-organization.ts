"use client";

import { useAuth } from "@/contexts/auth-context";

export function useOrganization() {
  const { organization } = useAuth();

  return {
    organizationId: organization?.id || null,
    organization,
  };
}
