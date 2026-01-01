"use client";

import { useMemo } from "react";

export function useOrganization() {
  const organizationId = useMemo(() => {
    return "default";
  }, []);

  return {
    organizationId,
  };
}
