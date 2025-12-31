"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronDown, ChevronRight, MapPin, Briefcase, Building2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PeopleFilters,
  PeopleAutocompleteField,
  AutocompleteResponse,
} from "@/lib/explorium/types";

interface PeopleFiltersProps {
  filters: PeopleFilters;
  onChange: (filters: PeopleFilters) => void;
  onClear: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FilterState {
  options: AutocompleteResponse[];
  loading: boolean;
  query: string;
  labels: Record<string, string>;
}

const initialFilterState: FilterState = {
  options: [],
  loading: false,
  query: "",
  labels: {},
};

interface FilterConfig {
  autocompleteField: PeopleAutocompleteField;
  filterKey: keyof PeopleFilters;
  label: string;
  placeholder: string;
  semanticSearch?: boolean;
  capitalizeLabel?: boolean;
}

const LOWERCASE_WORDS = new Set([
  "and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by",
]);

const smartCapitalize = (text: string): string => {
  if (!text) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

interface FilterSection {
  id: string;
  label: string;
  icon: React.ElementType;
  filters: FilterConfig[];
}

const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
    filters: [
      {
        autocompleteField: "company_name",
        filterKey: "company_name",
        label: "Company Name",
        placeholder: "Select companies",
      },
      {
        autocompleteField: "company_size",
        filterKey: "company_size",
        label: "Company Size",
        placeholder: "Select employee range",
      },
      {
        autocompleteField: "company_revenue",
        filterKey: "company_revenue",
        label: "Revenue",
        placeholder: "Select revenue range",
      },
    ],
  },
  {
    id: "industry",
    label: "Industry",
    icon: Briefcase,
    filters: [
      {
        autocompleteField: "google_category",
        filterKey: "google_category",
        label: "Category (Google)",
        placeholder: "Select Google categories",
      },
      {
        autocompleteField: "linkedin_category",
        filterKey: "linkedin_category",
        label: "Industry (LinkedIn)",
        placeholder: "Select industries",
      },
      {
        autocompleteField: "naics_category",
        filterKey: "naics_category",
        label: "Industry (NAICS)",
        placeholder: "Select NAICS categories",
      },
    ],
  },
  {
    id: "job",
    label: "Job",
    icon: Briefcase,
    filters: [
      {
        autocompleteField: "job_department",
        filterKey: "job_department",
        label: "Department",
        placeholder: "Select departments",
        capitalizeLabel: true,
      },
      {
        autocompleteField: "job_level",
        filterKey: "job_level",
        label: "Job Level",
        placeholder: "Select job levels",
        capitalizeLabel: true,
      },
      {
        autocompleteField: "job_title",
        filterKey: "job_title",
        label: "Job Title",
        placeholder: "Select job titles",
      },
    ],
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    filters: [
      {
        autocompleteField: "city_region_country",
        filterKey: "city_region_country",
        label: "City",
        placeholder: "Select cities",
      },
      {
        autocompleteField: "country",
        filterKey: "country",
        label: "Country",
        placeholder: "Select countries",
      },
      {
        autocompleteField: "region_country_code",
        filterKey: "region_country_code",
        label: "Region/State",
        placeholder: "Select regions or states",
      },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    icon: Cpu,
    filters: [
      {
        autocompleteField: "company_tech_stack_categories",
        filterKey: "company_tech_stack_categories",
        label: "Tech Categories",
        placeholder: "Select tech categories",
      },
      {
        autocompleteField: "company_tech_stack_tech",
        filterKey: "company_tech_stack_tech",
        label: "Technologies",
        placeholder: "Select technologies",
      },
    ],
  },
];

const ALL_FILTER_CONFIGS = FILTER_SECTIONS.flatMap((section) => section.filters);

export function PeopleFiltersComponent({
  filters,
  onChange,
  onClear,
}: PeopleFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    FILTER_SECTIONS.forEach((section) => {
      initial[section.id] = false;
    });
    return initial;
  });

  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    () => {
      const states: Record<string, FilterState> = {};
      ALL_FILTER_CONFIGS.forEach((config) => {
        states[config.autocompleteField] = { ...initialFilterState };
      });
      return states;
    }
  );

  const [queries, setQueries] = useState<Record<string, string>>({});
  const debouncedQueries = useDebounce(queries, 300);

  const fetchAutocomplete = useCallback(
    async (
      field: PeopleAutocompleteField,
      query: string,
      semanticSearch: boolean = false
    ) => {
      setFilterStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], loading: true },
      }));

      try {
        const params = new URLSearchParams({
          field,
          query: query || " ",
          ...(semanticSearch && { semantic_search: "true" }),
        });
        const response = await fetch(`/api/people/autocomplete?${params}`);
        if (response.ok) {
          const data = await response.json();
          setFilterStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], options: data, loading: false },
          }));
        } else {
          setFilterStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], options: [], loading: false },
          }));
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
        setFilterStates((prev) => ({
          ...prev,
          [field]: { ...prev[field], options: [], loading: false },
        }));
      }
    },
    []
  );

  useEffect(() => {
    Object.entries(debouncedQueries).forEach(([field, query]) => {
      const config = ALL_FILTER_CONFIGS.find((c) => c.autocompleteField === field);
      if (config) {
        fetchAutocomplete(
          field as PeopleAutocompleteField,
          query,
          config.semanticSearch
        );
      }
    });
  }, [debouncedQueries, fetchAutocomplete]);

  const handleAddFilter = (
    filterKey: keyof PeopleFilters,
    autocompleteField: PeopleAutocompleteField,
    option: ComboboxOption
  ) => {
    const currentValues = (filters[filterKey] as string[]) || [];
    if (!currentValues.includes(option.value)) {
      onChange({
        ...filters,
        [filterKey]: [...currentValues, option.value],
      });
      setFilterStates((prev) => ({
        ...prev,
        [autocompleteField]: {
          ...prev[autocompleteField],
          labels: {
            ...prev[autocompleteField].labels,
            [option.value]: option.label,
          },
        },
      }));
    }
  };

  const handleRemoveFilter = (
    filterKey: keyof PeopleFilters,
    value: string
  ) => {
    const currentValues = (filters[filterKey] as string[]) || [];
    onChange({
      ...filters,
      [filterKey]: currentValues.filter((v) => v !== value),
    });
  };

  const handleOpen = (
    field: PeopleAutocompleteField,
    semanticSearch: boolean = false
  ) => {
    fetchAutocomplete(field, "", semanticSearch);
  };

  const handleSearch = (field: PeopleAutocompleteField, query: string) => {
    setQueries((prev) => ({ ...prev, [field]: query }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getActiveFiltersCount = (section: FilterSection): number => {
    return section.filters.reduce((count, config) => {
      const values = filters[config.filterKey] as string[] | undefined;
      return count + (values?.length || 0);
    }, 0);
  };

  const hasFilters = ALL_FILTER_CONFIGS.some((config) => {
    const values = filters[config.filterKey] as string[] | undefined;
    return values && values.length > 0;
  });

  const renderBadges = (
    values: string[] | undefined,
    filterKey: keyof PeopleFilters,
    labels: Record<string, string>,
    capitalizeLabel?: boolean
  ) => {
    if (!values || values.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {values.map((value) => {
          const label = labels[value] || value;
          const displayLabel = capitalizeLabel ? smartCapitalize(label) : label;
          return (
            <Badge key={value} variant="secondary" className="gap-1 text-xs">
              {displayLabel}
              <button
                onClick={() => handleRemoveFilter(filterKey, value)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
    );
  };

  const renderFilter = (config: FilterConfig) => {
    const state = filterStates[config.autocompleteField] || initialFilterState;
    const values = (filters[config.filterKey] as string[]) || [];

    return (
      <div key={config.autocompleteField} className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{config.label}</Label>
        <Combobox
          placeholder={config.placeholder}
          searchPlaceholder="Search"
          emptyText="No results found"
          options={state.options.map((o) => ({
            label: o.label,
            value: o.value,
          }))}
          selectedValues={values}
          onSelect={(option) =>
            handleAddFilter(config.filterKey, config.autocompleteField, option)
          }
          onSearch={(query) => handleSearch(config.autocompleteField, query)}
          onOpen={() => handleOpen(config.autocompleteField, config.semanticSearch)}
          isLoading={state.loading}
          transformLabel={config.capitalizeLabel ? smartCapitalize : undefined}
        />
        {renderBadges(values, config.filterKey, state.labels, config.capitalizeLabel)}
      </div>
    );
  };

  const renderSection = (section: FilterSection) => {
    const Icon = section.icon;
    const activeCount = getActiveFiltersCount(section);
    const isOpen = openSections[section.id];

    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
      >
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full py-2 px-1 hover:bg-accent/50 rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{section.label}</span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeCount}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pl-6 pt-2 pb-3">
          {section.filters.map(renderFilter)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-1">
      {hasFilters && (
        <div className="flex justify-end pb-2">
          <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-1">
        {FILTER_SECTIONS.map(renderSection)}
      </div>
    </div>
  );
}
