"use client";

import { useState, useCallback } from "react";
import { AutocompleteField, AutocompleteResponse } from "@/lib/explorium/types";

export function useAutocomplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AutocompleteResponse[]>([]);

  const fetchOptions = useCallback(
    async (field: AutocompleteField, query: string) => {
      if (!query || query.length < 2) {
        setOptions([]);
        return;
      }

      setIsLoading(true);

      try {
        const params = new URLSearchParams({ field, query });
        const response = await fetch(`/api/companies/autocomplete?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch autocomplete");
        }

        const data = await response.json();
        setOptions(data);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearOptions = useCallback(() => {
    setOptions([]);
  }, []);

  return {
    options,
    isLoading,
    fetchOptions,
    clearOptions,
  };
}
