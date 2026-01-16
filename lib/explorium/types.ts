export interface Business {
  business_id?: string;
  id?: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  sub_industry?: string;
  employee_count?: number;
  employee_range?: string;
  revenue?: number;
  revenue_range?: string;
  founded_year?: number;
  description?: string;
  logo?: string;
  logo_url?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postal_code?: string;
  };
  technologies?: string[];
  keywords?: string[];
  sic_codes?: string[];
  naics_codes?: string[];
  // Explorium API specific fields
  country_name?: string;
  city_name?: string;
  state_region_name?: string;
  number_of_employees_range?: string;
  yearly_revenue_range?: string;
  business_description?: string;
  business_type?: string;
  linkedin_company_url?: string;
  linkedin_industry_category?: string;
}

// BusinessFilters uses the same field names as the autocomplete API
// The buildFiltersPayload function maps these to the correct search API field names
export interface BusinessFilters {
  // Basic filters
  name?: string;
  domain?: string[];

  // Location filters (autocomplete field names)
  country?: string[]; // autocomplete: country -> search: country_code
  region_country_code?: string[]; // autocomplete: region_country_code -> search: region_country_code
  city_region_country?: string[]; // autocomplete & search: city_region_country

  // Industry filters (autocomplete field names)
  google_category?: string[]; // autocomplete & search: google_category
  naics_category?: string[]; // autocomplete & search: naics_category
  linkedin_category?: string[]; // autocomplete: linkedin_category -> search: linkedin_industry

  // Company attributes (autocomplete field names)
  company_size?: string[]; // autocomplete: company_size -> search: employee_range
  company_revenue?: string[]; // autocomplete: company_revenue -> search: revenue_range
  number_of_locations?: string[]; // autocomplete & search: number_of_locations
  company_age?: string[]; // autocomplete & search: company_age

  // Technology filters (autocomplete field names)
  company_tech_stack_tech?: string[]; // autocomplete: company_tech_stack_tech -> search: tech_stack
  company_tech_stack_categories?: string[]; // autocomplete & search: company_tech_stack_categories

  // Job filters (autocomplete field names)
  job_title?: string[]; // autocomplete & search: job_title
  job_department?: string[]; // autocomplete & search: job_department
  job_level?: string[]; // autocomplete & search: job_level

  // Other filters
  business_intent_topics?: string[]; // autocomplete & search: business_intent_topics

  // Range filters
  founded_year_min?: number;
  founded_year_max?: number;
}

export interface FetchBusinessesRequest {
  mode: "full";
  size?: number;
  page?: number;
  page_size?: number;
  filters?: Record<string, { values?: string[] } | { min?: number; max?: number }>;
  exclude?: string[];
  search_after?: string[];
}

export interface FetchBusinessesResponse {
  businesses?: Business[];
  results?: Business[];
  data?: Business[];
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface FetchBusinessesStatsResponse {
  total?: number;
  total_results?: number;
  total_elements?: number;
  filters_breakdown?: Record<string, Record<string, number>>;
}

export interface BusinessStats {
  total_count?: number;
  total_results?: number;
  filters_breakdown?: Record<string, Record<string, number>>;
}

export type AutocompleteField =
  | "country"
  | "country_code"
  | "region_country_code"
  | "google_category"
  | "naics_category"
  | "linkedin_category"
  | "company_tech_stack_tech"
  | "company_tech_stack_categories"
  | "job_title"
  | "company_size"
  | "company_revenue"
  | "number_of_locations"
  | "company_age"
  | "job_department"
  | "job_level"
  | "city_region_country"
  | "company_name"
  | "business_intent_topics";

export interface AutocompleteResponse {
  query: string;
  label: string;
  value: string;
}

// Person types for People search (internally we use Person/People, Explorium uses Prospect)
export interface Person {
  prospect_id?: string;
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  job_title?: string;
  job_level?: string;
  job_department?: string;
  linkedin_url?: string;
  linkedin_profile?: string;
  linkedin?: string;
  // Company information
  company_name?: string;
  company_domain?: string;
  company_linkedin_url?: string;
  company_logo?: string;
  business_id?: string;
  // Location
  country?: string;
  country_name?: string;
  region?: string;
  city?: string;
  // Experience
  total_experience_months?: number;
  current_position_months?: number;
  // Additional fields
  profile_picture?: string;
  seniority?: string;
  // Arrays (with alternate field names from API)
  experiences?: string[];
  experience?: string[];
  past_experiences?: string[];
  work_experience?: string[];
  skills?: string[];
  skill?: string[];
  interests?: string[];
  interest?: string[];
  topics_of_interest?: string[];
  personal_interests?: string[];
}

// Alias for Explorium API compatibility
export type Prospect = Person;

export interface PeopleFilters {
  // Name filters
  first_name?: string;
  last_name?: string;
  full_name?: string;

  // Job filters
  job_title?: string[];
  job_level?: string[];
  job_department?: string[];

  // Company filters
  company_name?: string[];
  company_domain?: string[];
  business_id?: string[];

  // Location filters
  country?: string[];
  region_country_code?: string[];
  city_region_country?: string[];

  // Industry filters (from company)
  google_category?: string[];
  naics_category?: string[];
  linkedin_category?: string[];

  // Company attributes
  company_size?: string[];
  company_revenue?: string[];

  // Technology filters
  company_tech_stack_tech?: string[];
  company_tech_stack_categories?: string[];

  // Boolean filters
  has_email?: boolean;
  has_phone?: boolean;

  // Experience range
  total_experience_months_min?: number;
  total_experience_months_max?: number;
}

// Alias for Explorium API compatibility
export type ProspectFilters = PeopleFilters;

export interface FetchPeopleRequest {
  mode: "full" | "ids";
  size?: number;
  page?: number;
  page_size?: number;
  filters?: Record<string, { values?: string[]; value?: boolean } | { gte?: number; lte?: number }>;
}

// Alias for Explorium API compatibility
export type FetchProspectsRequest = FetchPeopleRequest;

export interface FetchPeopleResponse {
  prospects?: Person[];
  people?: Person[];
  results?: Person[];
  data?: Person[];
  total: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

// Alias for Explorium API compatibility
export type FetchProspectsResponse = FetchPeopleResponse;

export interface FetchPeopleStatsResponse {
  total?: number;
  total_results?: number;
  total_elements?: number;
  filters_breakdown?: Record<string, Record<string, number>>;
}

// Alias for Explorium API compatibility
export type FetchProspectsStatsResponse = FetchPeopleStatsResponse;

export type PeopleAutocompleteField =
  | "job_title"
  | "job_level"
  | "job_department"
  | "company_name"
  | "country"
  | "region_country_code"
  | "city_region_country"
  | "google_category"
  | "naics_category"
  | "linkedin_category"
  | "company_size"
  | "company_revenue"
  | "company_tech_stack_tech"
  | "company_tech_stack_categories";

// Alias for Explorium API compatibility
export type ProspectAutocompleteField = PeopleAutocompleteField;

export const PEOPLE_FILTER_TO_SEARCH_API_MAP: Record<string, string> = {
  // Location
  country: "country_code",
  region_country_code: "region_country_code",
  city_region_country: "city_region_country",

  // Job
  job_title: "job_title",
  job_level: "job_level",
  job_department: "job_department",

  // Company
  company_name: "company_name",
  company_domain: "company_domain",
  business_id: "business_id",

  // Industry
  google_category: "google_category",
  naics_category: "naics_category",
  linkedin_category: "linkedin_industry",

  // Company attributes
  company_size: "employee_range",
  company_revenue: "revenue_range",

  // Technology
  company_tech_stack_tech: "tech_stack",
  company_tech_stack_categories: "company_tech_stack_categories",
};

// Alias for Explorium API compatibility
export const PROSPECT_FILTER_TO_SEARCH_API_MAP = PEOPLE_FILTER_TO_SEARCH_API_MAP;

// Mapping from autocomplete/BusinessFilters field to search API field
// Some fields have the same name, others need to be mapped
export const FILTER_TO_SEARCH_API_MAP: Record<string, string> = {
  // Location
  country: "country_code",
  region_country_code: "region_country_code",
  city_region_country: "city_region_country",

  // Industry
  google_category: "google_category",
  naics_category: "naics_category",
  linkedin_category: "linkedin_industry",

  // Company attributes
  company_size: "employee_range",
  company_revenue: "revenue_range",
  number_of_locations: "number_of_locations",
  company_age: "company_age",

  // Technology
  company_tech_stack_tech: "tech_stack",
  company_tech_stack_categories: "company_tech_stack_categories",

  // Jobs
  job_title: "job_title",
  job_department: "job_department",
  job_level: "job_level",

  // Other
  business_intent_topics: "business_intent_topics",
  domain: "domain",
};

export const AUTOCOMPLETE_FIELD_TO_BACKEND_MAP: Record<string, string> = {
  country: "company_country_name",
  country_code: "company_country_iso_alpha_2",
  region_country_code: "company_region_code",
  city_region_country: "company_city_name",
  google_category: "company_google_category",
  naics_category: "company_naics",
  linkedin_category: "company_linkedin_category",
  company_tech_stack_tech: "company_technology_stack",
  company_tech_stack_categories: "company_technology_stack_category",
  company_size: "company_size",
  company_revenue: "company_revenue",
  company_age: "company_age",
  number_of_locations: "company_locations",
  job_title: "person_job_title",
  job_department: "person_job_department",
  job_level: "person_job_level",
  business_intent_topics: "company_intent_topic",
  company_name: "company_name",
};
