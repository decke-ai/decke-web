"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Building2, MapPin, Briefcase, Users, Cpu, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YearPicker } from "@/components/ui/year-picker";
import { Badge } from "@/components/ui/badge";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BusinessFilters,
  AutocompleteField,
  AutocompleteResponse,
} from "@/lib/explorium/types";

interface CompanyFiltersProps {
  filters: BusinessFilters;
  onChange: (filters: BusinessFilters) => void;
  onClear: () => void;
  organizationId: string;
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

// Filter configuration type
interface FilterConfig {
  autocompleteField: AutocompleteField;
  filterKey: keyof BusinessFilters;
  label: string;
  placeholder: string;
  semanticSearch?: boolean;
  capitalizeLabel?: boolean;
}

// Words that should not be capitalized (unless first word)
const LOWERCASE_WORDS = new Set([
  // English
  "and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by",
]);

// Smart capitalize function
const smartCapitalize = (text: string): string => {
  if (!text) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Don't capitalize lowercase words
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

// Filter sections with their configurations
interface FilterSection {
  id: string;
  label: string;
  icon: React.ElementType;
  filters: FilterConfig[];
}

// Filter sections grouped by category
const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "company",
    label: "Company",
    icon: Building2,
    filters: [
      {
        autocompleteField: "company_size",
        filterKey: "company_size",
        label: "Size",
        placeholder: "Select employee range",
      },
      {
        autocompleteField: "company_revenue",
        filterKey: "company_revenue",
        label: "Revenue",
        placeholder: "Select revenue range",
      },
      {
        autocompleteField: "company_age",
        filterKey: "company_age",
        label: "Age",
        placeholder: "Select company age",
      },
      {
        autocompleteField: "number_of_locations",
        filterKey: "number_of_locations",
        label: "Number of Locations",
        placeholder: "Select location count",
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
    id: "intent",
    label: "Intent",
    icon: Target,
    filters: [
      {
        autocompleteField: "business_intent_topics",
        filterKey: "business_intent_topics",
        label: "Topics",
        placeholder: "Select intent topics",
        semanticSearch: true,
      },
    ],
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    filters: [
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
      {
        autocompleteField: "city_region_country",
        filterKey: "city_region_country",
        label: "City",
        placeholder: "Select cities",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: Users,
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
    id: "technology",
    label: "Technology",
    icon: Cpu,
    filters: [
      {
        autocompleteField: "company_tech_stack_categories",
        filterKey: "company_tech_stack_categories",
        label: "Categories",
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

// Flatten all filter configs for utility functions
const ALL_FILTER_CONFIGS = FILTER_SECTIONS.flatMap((section) => section.filters);

export function CompanyFilters({
  filters,
  onChange,
  onClear,
  organizationId,
}: CompanyFiltersProps) {
  // Track which sections are open (all closed by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    FILTER_SECTIONS.forEach((section) => {
      initial[section.id] = false;
    });
    return initial;
  });

  // Create state for each filter
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    () => {
      const states: Record<string, FilterState> = {};
      ALL_FILTER_CONFIGS.forEach((config) => {
        states[config.autocompleteField] = { ...initialFilterState };
      });
      return states;
    }
  );

  // Debounced queries for each filter
  const [queries, setQueries] = useState<Record<string, string>>({});
  const debouncedQueries = useDebounce(queries, 300);

  const fetchAutocomplete = useCallback(
    async (
      field: AutocompleteField,
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
          ...(semanticSearch && { semantic: "true" }),
        });
        const response = await fetch(`/api/organizations/${organizationId}/companies/autocomplete?${params}`);
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
    [organizationId]
  );

  // Fetch on debounced query change
  useEffect(() => {
    Object.entries(debouncedQueries).forEach(([field, query]) => {
      const config = ALL_FILTER_CONFIGS.find((c) => c.autocompleteField === field);
      if (config) {
        fetchAutocomplete(
          field as AutocompleteField,
          query,
          config.semanticSearch
        );
      }
    });
  }, [debouncedQueries, fetchAutocomplete]);

  const handleAddFilter = (
    filterKey: keyof BusinessFilters,
    autocompleteField: AutocompleteField,
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
    filterKey: keyof BusinessFilters,
    value: string
  ) => {
    const currentValues = (filters[filterKey] as string[]) || [];
    onChange({
      ...filters,
      [filterKey]: currentValues.filter((v) => v !== value),
    });
  };

  const handleOpen = (
    field: AutocompleteField,
    semanticSearch: boolean = false
  ) => {
    fetchAutocomplete(field, "", semanticSearch);
  };

  const handleSearch = (field: AutocompleteField, query: string) => {
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

  const hasFilters =
    ALL_FILTER_CONFIGS.some((config) => {
      const values = filters[config.filterKey] as string[] | undefined;
      return values && values.length > 0;
    }) ||
    filters.founded_year_min ||
    filters.founded_year_max ||
    filters.name;

  const renderBadges = (
    values: string[] | undefined,
    filterKey: keyof BusinessFilters,
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

      {/* Company Name Filter */}
      <div className="space-y-1.5 pb-3">
        <Label className="text-xs text-muted-foreground">Company Name</Label>
        <Input
          placeholder="Enter company name"
          value={filters.name || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              name: e.target.value || undefined,
            })
          }
          className="h-9"
        />
      </div>

      {/* Filter Sections */}
      <div className="space-y-1">
        {FILTER_SECTIONS.map(renderSection)}
      </div>

      {/* Founded Year Filter */}
      <div className="space-y-1.5 pt-3">
        <Label className="text-xs text-muted-foreground">Founded year</Label>
        <div className="flex gap-2">
          <YearPicker
            value={filters.founded_year_min}
            onChange={(year) =>
              onChange({
                ...filters,
                founded_year_min: year,
              })
            }
            placeholder="From"
            minYear={1800}
            maxYear={new Date().getFullYear()}
          />
          <YearPicker
            value={filters.founded_year_max}
            onChange={(year) =>
              onChange({
                ...filters,
                founded_year_max: year,
              })
            }
            placeholder="To"
            minYear={1800}
            maxYear={new Date().getFullYear()}
          />
        </div>
      </div>
    </div>
  );
}
