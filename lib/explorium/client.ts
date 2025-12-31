import {
  Business,
  BusinessFilters,
  FetchBusinessesRequest,
  FetchBusinessesResponse,
  FetchBusinessesStatsResponse,
  AutocompleteField,
  AutocompleteResponse,
  FILTER_TO_SEARCH_API_MAP,
  Person,
  PeopleFilters,
  FetchPeopleRequest,
  FetchPeopleResponse,
  FetchPeopleStatsResponse,
  PeopleAutocompleteField,
  PEOPLE_FILTER_TO_SEARCH_API_MAP,
} from "./types";

const EXPLORIUM_API_URL = "https://api.explorium.ai/v1";

function buildFiltersPayload(
  filters: BusinessFilters
): FetchBusinessesRequest["filters"] {
  const payload: FetchBusinessesRequest["filters"] = {};

  // Array filters - map from BusinessFilters field to search API field
  const arrayFilterFields: (keyof BusinessFilters)[] = [
    "country",
    "city_region_country",
    "google_category",
    "naics_category",
    "linkedin_category",
    "company_size",
    "company_revenue",
    "number_of_locations",
    "company_age",
    "company_tech_stack_tech",
    "company_tech_stack_categories",
    "job_title",
    "job_department",
    "job_level",
    "business_intent_topics",
    "domain",
  ];

  for (const field of arrayFilterFields) {
    const values = filters[field] as string[] | undefined;
    if (values?.length) {
      // Use the mapping to get the correct search API field name
      const searchApiField = FILTER_TO_SEARCH_API_MAP[field] || field;
      payload[searchApiField] = { values };
    }
  }

  // Range filters
  if (filters.founded_year_min || filters.founded_year_max) {
    payload.founded_year = {
      min: filters.founded_year_min,
      max: filters.founded_year_max,
    };
  }

  // Name filter (single value as array)
  if (filters.name) {
    payload.company_name = { values: [filters.name] };
  }

  return payload;
}

export async function fetchBusinesses(
  apiKey: string,
  filters: BusinessFilters,
  options: {
    page?: number;
    pageSize?: number;
    size?: number;
  } = {}
): Promise<FetchBusinessesResponse> {
  const { page = 1, pageSize = 50, size = 60000 } = options;

  const payload: FetchBusinessesRequest = {
    mode: "full",
    size,
    page,
    page_size: pageSize,
    filters: buildFiltersPayload(filters),
  };

  console.log("Explorium request payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${EXPLORIUM_API_URL}/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("Explorium response keys:", Object.keys(data));
  console.log("Explorium response sample:", JSON.stringify(data).substring(0, 500));
  return data;
}

export async function fetchBusinessesStats(
  apiKey: string,
  filters: BusinessFilters
): Promise<FetchBusinessesStatsResponse> {
  const payload = {
    filters: buildFiltersPayload(filters),
  };

  const response = await fetch(`${EXPLORIUM_API_URL}/businesses/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function fetchAutocomplete(
  apiKey: string,
  field: AutocompleteField,
  query: string,
  semanticSearch: boolean = false
): Promise<AutocompleteResponse[]> {
  const params = new URLSearchParams({
    field,
    query,
    ...(semanticSearch && { semantic_search: "true" }),
  });

  const response = await fetch(
    `${EXPLORIUM_API_URL}/businesses/autocomplete?${params}`,
    {
      method: "GET",
      headers: {
        api_key: apiKey,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export interface EnrichmentRequest {
  business_ids: string[];
  request_context?: null;
  parameters?: Record<string, unknown>;
}

// Firmographics data returned by the enrichment API
export interface FirmographicsData {
  business_id?: string;
  name?: string;
  business_description?: string;
  website?: string;
  country_name?: string;
  region_name?: string;
  city_name?: string;
  street?: string;
  zip_code?: string;
  naics?: string;
  naics_description?: string;
  sic_code?: string;
  sic_code_description?: string;
  ticker?: string;
  number_of_employees_range?: string;
  yearly_revenue_range?: string;
  linkedin_industry_category?: string;
  linkedin_profile?: string;
  business_logo?: string;
  locations_distribution?: Array<{ country?: string; count?: number }>;
}

// Each row in the enrichment response
export interface EnrichmentRow {
  business_id: string;
  data: FirmographicsData;
}

export interface EnrichmentResponse {
  total_results?: number;
  data?: EnrichmentRow[];
  response_context?: {
    correlation_id?: string;
    request_status?: string;
    time_took_in_seconds?: number;
  };
}

export async function enrichBusinesses(
  apiKey: string,
  businessIds: string[]
): Promise<EnrichmentResponse> {
  // API allows max 50 business IDs per request
  const idsToEnrich = businessIds.slice(0, 50);

  const payload: EnrichmentRequest = {
    business_ids: idsToEnrich,
    request_context: null,
    parameters: {},
  };

  console.log("Enrichment request payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(
    `${EXPLORIUM_API_URL}/businesses/firmographics/bulk_enrich`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        api_key: apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("Enrichment response keys:", Object.keys(data));
  return data;
}

// Merge enrichment data into businesses
export function mergeEnrichmentData(
  businesses: Business[],
  enrichmentData: EnrichmentResponse
): Business[] {
  // Build a map from business_id to firmographics data for fast lookup
  const enrichmentMap = new Map<string, FirmographicsData>();

  if (enrichmentData.data) {
    for (const row of enrichmentData.data) {
      if (row.business_id && row.data) {
        enrichmentMap.set(row.business_id, row.data);
      }
    }
  }

  return businesses.map((business) => {
    const businessId = business.business_id || business.id;
    if (!businessId) return business;

    const firmographics = enrichmentMap.get(businessId);
    if (!firmographics) return business;

    return {
      ...business,
      // Description
      business_description:
        firmographics.business_description || business.business_description,
      description:
        firmographics.business_description || business.description,
      // Industry
      industry:
        firmographics.linkedin_industry_category ||
        firmographics.naics_description ||
        business.industry,
      // Employees
      number_of_employees_range:
        firmographics.number_of_employees_range ||
        business.number_of_employees_range,
      // Location
      country_name: firmographics.country_name || business.country_name,
      state_region_name:
        firmographics.region_name || business.state_region_name,
      city_name: firmographics.city_name || business.city_name,
      // Domain/Website
      domain: business.domain || extractDomain(firmographics.website),
      website: firmographics.website || business.website,
      // LinkedIn
      linkedin_company_url:
        firmographics.linkedin_profile || business.linkedin_company_url,
      linkedin_url:
        firmographics.linkedin_profile || business.linkedin_url,
      // Logo
      logo: firmographics.business_logo || business.logo,
      logo_url: firmographics.business_logo || business.logo_url,
      // Revenue
      yearly_revenue_range:
        firmographics.yearly_revenue_range || business.yearly_revenue_range,
    };
  });
}

// Helper to extract domain from website URL
function extractDomain(website?: string): string | undefined {
  if (!website) return undefined;
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

// ==================== PEOPLE API ====================

function buildPeopleFiltersPayload(
  filters: PeopleFilters
): FetchPeopleRequest["filters"] {
  const payload: FetchPeopleRequest["filters"] = {};

  // Array filters - map from PeopleFilters field to search API field
  const arrayFilterFields: (keyof PeopleFilters)[] = [
    "job_title",
    "job_level",
    "job_department",
    "company_name",
    "company_domain",
    "business_id",
    "country",
    "region_country_code",
    "city_region_country",
    "google_category",
    "naics_category",
    "linkedin_category",
    "company_size",
    "company_revenue",
    "company_tech_stack_tech",
    "company_tech_stack_categories",
  ];

  for (const field of arrayFilterFields) {
    const values = filters[field] as string[] | undefined;
    if (values?.length) {
      const searchApiField = PEOPLE_FILTER_TO_SEARCH_API_MAP[field] || field;
      payload[searchApiField] = { values };
    }
  }

  // Boolean filters
  if (filters.has_email !== undefined) {
    payload.has_email = { value: filters.has_email };
  }
  if (filters.has_phone !== undefined) {
    payload.has_phone = { value: filters.has_phone };
  }

  // Range filters
  if (filters.total_experience_months_min || filters.total_experience_months_max) {
    payload.total_experience_months = {
      gte: filters.total_experience_months_min,
      lte: filters.total_experience_months_max,
    };
  }

  // Name filters (single value as array)
  if (filters.full_name) {
    payload.full_name = { values: [filters.full_name] };
  }
  if (filters.first_name) {
    payload.first_name = { values: [filters.first_name] };
  }
  if (filters.last_name) {
    payload.last_name = { values: [filters.last_name] };
  }

  return payload;
}

export async function fetchPeople(
  apiKey: string,
  filters: PeopleFilters,
  options: {
    page?: number;
    pageSize?: number;
    size?: number;
  } = {}
): Promise<FetchPeopleResponse> {
  const { page = 1, pageSize = 50, size = 60000 } = options;

  const payload: FetchPeopleRequest = {
    mode: "full",
    size,
    page,
    page_size: pageSize,
    filters: buildPeopleFiltersPayload(filters),
  };

  console.log("Explorium people request payload:", JSON.stringify(payload, null, 2));

  // Note: Explorium API uses /prospects endpoint
  const response = await fetch(`${EXPLORIUM_API_URL}/prospects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("Explorium people response keys:", Object.keys(data));
  return data;
}

// Alias for backward compatibility
export const fetchProspects = fetchPeople;

export async function fetchPeopleStats(
  apiKey: string,
  filters: PeopleFilters
): Promise<FetchPeopleStatsResponse> {
  const payload = {
    filters: buildPeopleFiltersPayload(filters),
  };

  // Note: Explorium API uses /prospects/stats endpoint
  const response = await fetch(`${EXPLORIUM_API_URL}/prospects/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Alias for backward compatibility
export const fetchProspectsStats = fetchPeopleStats;

export async function fetchPeopleAutocomplete(
  apiKey: string,
  field: PeopleAutocompleteField,
  query: string,
  semanticSearch: boolean = false
): Promise<AutocompleteResponse[]> {
  const params = new URLSearchParams({
    field,
    query,
    ...(semanticSearch && { semantic_search: "true" }),
  });

  // Note: Explorium API uses /prospects/autocomplete endpoint
  const response = await fetch(
    `${EXPLORIUM_API_URL}/prospects/autocomplete?${params}`,
    {
      method: "GET",
      headers: {
        api_key: apiKey,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explorium API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Alias for backward compatibility
export const fetchProspectAutocomplete = fetchPeopleAutocomplete;

// Helper to get person ID
export function getPersonId(person: Person): string {
  return person.prospect_id || person.id || `${person.first_name}-${person.last_name}`;
}

// Helper to get person full name
export function getPersonFullName(person: Person): string {
  if (person.full_name) return person.full_name;
  const parts = [person.first_name, person.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
}

// Enrich people with company logos
export async function enrichPeopleWithCompanyLogos(
  apiKey: string,
  people: Person[]
): Promise<Person[]> {
  // Extract unique business IDs
  const businessIds = [...new Set(
    people
      .map((p) => p.business_id)
      .filter((id): id is string => !!id)
  )];

  if (businessIds.length === 0) {
    return people;
  }

  // Enrich in batches of 50 (API limit)
  const enrichmentMap = new Map<string, FirmographicsData>();

  for (let i = 0; i < businessIds.length; i += 50) {
    const batch = businessIds.slice(i, i + 50);
    try {
      const enrichmentData = await enrichBusinesses(apiKey, batch);
      if (enrichmentData.data) {
        for (const row of enrichmentData.data) {
          if (row.business_id && row.data) {
            enrichmentMap.set(row.business_id, row.data);
          }
        }
      }
    } catch (error) {
      console.error("Error enriching businesses batch:", error);
    }
  }

  return people.map((person) => {
    if (!person.business_id) return person;

    const firmographics = enrichmentMap.get(person.business_id);
    if (!firmographics) return person;

    return {
      ...person,
      company_name: firmographics.name || person.company_name,
      company_logo: firmographics.business_logo || person.company_logo,
      company_domain: person.company_domain || extractDomain(firmographics.website),
      company_linkedin_url: person.company_linkedin_url || firmographics.linkedin_profile,
    };
  });
}

// Alias for backward compatibility
export const enrichProspectsWithCompanyLogos = enrichPeopleWithCompanyLogos;
