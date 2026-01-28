"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Columns3, Loader2, ChevronLeft, ChevronRight, Building2, Zap, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyTable, TECHNOGRAPHICS_COLUMNS, BRAZIL_COLUMNS, CompanyColumnId } from "@/components/companies/company-table";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { EnrichDrawer, CompanyEnrichOptions } from "@/components/records/enrich-drawer";
import { ExportDrawer } from "@/components/records/export-drawer";
import { Empty } from "@/components/ui/empty";
import { Business } from "@/lib/explorium/types";

interface RecordResponse {
  content?: Array<{
    id: string;
    record_id: string;
    record_type: string;
    values: Record<string, unknown>;
    created_date: string;
    updated_date: string;
  }>;
  items?: Array<{
    id: string;
    record_id: string;
    record_type: string;
    values: Record<string, unknown>;
    created_date: string;
    updated_date: string;
  }>;
  total_elements?: number;
  total_pages?: number;
  page_number?: number;
  page_size?: number;
}

const COMPANY_COLUMNS: { id: CompanyColumnId; label: string }[] = [
  { id: "name", label: "Company Name" },
  { id: "description", label: "Company Description" },
  { id: "domain", label: "Company Domain" },
  { id: "employees", label: "Company Employees" },
  { id: "industry", label: "Company Industry" },
  { id: "linkedin", label: "Company LinkedIn" },
  { id: "location", label: "Company Location" },
  { id: "revenue", label: "Company Revenue" },
  ...TECHNOGRAPHICS_COLUMNS.map((col) => ({ id: col.id, label: col.label })),
  ...BRAZIL_COLUMNS.map((col) => ({ id: col.id, label: col.label })),
];

function mapRecordToCompany(record: {
  id: string;
  record_id: string;
  values: Record<string, unknown>;
}): Business {
  const values = record.values || {};
  return {
    id: record.id,
    business_id: record.record_id,
    name: (values.name as string) || (values.company_name as string) || "",
    domain: (values.domain as string) || (values.company_domain as string) || "",
    website: (values.website as string) || (values.company_website as string),
    description: (values.description as string) || (values.business_description as string) || (values.company_description as string),
    business_description: (values.business_description as string) || (values.description as string) || (values.company_description as string),
    industry: (values.company_linkedin_category as string) || (values.industry as string) || (values.company_industry as string),
    sub_industry: (values.sub_industry as string) || (values.company_sub_industry as string),
    employee_range: (values.employee_range as string) || (values.number_of_employees_range as string) || (values.company_employee as string),
    number_of_employees_range: (values.number_of_employees_range as string) || (values.employee_range as string) || (values.company_employee as string),
    employee_count: (values.employee_count as number) || (values.company_employee_count as number),
    revenue_range: (values.revenue_range as string) || (values.yearly_revenue_range as string) || (values.company_revenue as string),
    yearly_revenue_range: (values.yearly_revenue_range as string) || (values.revenue_range as string) || (values.company_revenue as string),
    revenue: (values.revenue as number) || (values.company_revenue_amount as number),
    founded_year: (values.founded_year as number) || (values.company_founded_year as number),
    city_name: (values.city_name as string) || (values.city as string) || (values.company_city_name as string) || (values.company_city as string),
    state_region_name: (values.state_region_name as string) || (values.state as string) || (values.region as string) || (values.company_region_name as string) || (values.company_state as string),
    country_name: (values.country_name as string) || (values.country as string) || (values.company_country_name as string) || (values.company_country as string),
    linkedin_company_url: (values.linkedin_company_url as string) || (values.linkedin_url as string) || (values.company_linkedin_url as string),
    linkedin_url: (values.linkedin_url as string) || (values.linkedin_company_url as string) || (values.company_linkedin_url as string),
    facebook_url: (values.facebook_url as string) || (values.company_facebook_url as string),
    twitter_url: (values.twitter_url as string) || (values.company_twitter_url as string),
    logo: (values.logo as string) || (values.logo_url as string) || (values.company_avatar as string) || (values.company_logo as string) || (values.company_logo_url as string),
    logo_url: (values.logo_url as string) || (values.logo as string) || (values.company_avatar as string) || (values.company_logo_url as string) || (values.company_logo as string),
    phone: (values.phone as string) || (values.company_phone as string),
    email: (values.email as string) || (values.company_email as string),
    technologies: (values.technologies as string[]) || (values.company_technologies as string[]),
    keywords: (values.keywords as string[]) || (values.company_keywords as string[]),
    address: {
      street: (values.street as string) || (values.company_street as string),
      city: (values.city as string) || (values.city_name as string) || (values.company_city as string) || (values.company_city_name as string),
      state: (values.state as string) || (values.region as string) || (values.state_region_name as string) || (values.company_state as string) || (values.company_region_name as string),
      country: (values.country as string) || (values.country_name as string) || (values.company_country as string) || (values.company_country_name as string),
      country_code: (values.country_code as string) || (values.company_country_code as string),
      postal_code: (values.postal_code as string) || (values.company_postal_code as string),
    },
    company_technology_analytic: (values.company_technology_analytic as string[]) || undefined,
    company_technology_collaboration: (values.company_technology_collaboration as string[]) || undefined,
    company_technology_communication: (values.company_technology_communication as string[]) || undefined,
    company_technology_computer_network: (values.company_technology_computer_network as string[]) || undefined,
    company_technology_customer_management: (values.company_technology_customer_management as string[]) || undefined,
    company_technology_devops_and_development: (values.company_technology_devops_and_development as string[]) || undefined,
    company_technology_ecommerce: (values.company_technology_ecommerce as string[]) || undefined,
    company_technology_finance_and_accounting: (values.company_technology_finance_and_accounting as string[]) || undefined,
    company_technology_health: (values.company_technology_health as string[]) || undefined,
    company_technology_management: (values.company_technology_management as string[]) || undefined,
    company_technology_marketing: (values.company_technology_marketing as string[]) || undefined,
    company_technology_operation_management: (values.company_technology_operation_management as string[]) || undefined,
    company_technology_operation_software: (values.company_technology_operation_software as string[]) || undefined,
    company_technology_people: (values.company_technology_people as string[]) || undefined,
    company_technology_platform_and_storage: (values.company_technology_platform_and_storage as string[]) || undefined,
    company_technology_product_and_design: (values.company_technology_product_and_design as string[]) || undefined,
    company_technology_productivity_and_operation: (values.company_technology_productivity_and_operation as string[]) || undefined,
    company_technology_programming_language_and_framework: (values.company_technology_programming_language_and_framework as string[]) || undefined,
    company_technology_sale: (values.company_technology_sale as string[]) || undefined,
    company_technology_security: (values.company_technology_security as string[]) || undefined,
    company_technology_test: (values.company_technology_test as string[]) || undefined,
    brazil_enrichment: buildBrazilEnrichment(values),
  };
}

function buildBrazilEnrichment(values: Record<string, unknown>): Business["brazil_enrichment"] | undefined {
  const existingEnrichment = values.brazil_enrichment as Business["brazil_enrichment"];
  if (existingEnrichment) {
    return existingEnrichment;
  }

  const cnpj = values.company_cnpj as string | undefined;
  const capitalSocial = values.company_share_capital as number | undefined;
  const primaryCnae = values.company_cnae_primary || values.company_primary_cnae;
  const secondaryCnaes = values.company_cnae_secondary || values.company_secondary_cnae || values.company_secondary_cnaes;
  const establishmentIdentifier = values.company_establishment_identifier;
  const activityStartDate = values.company_activity_start_date as string | undefined;
  const legalNature = values.company_legal_nature;
  const economicSector = values.company_economic_sector as string | undefined;
  const mei = values.company_mei as boolean | undefined;
  const simples = values.company_simples as boolean | undefined;
  const registrationStatus = values.company_registration_status;
  const registrationStatusDate = values.company_registration_status_date as string | undefined;
  const partners = values.company_partner || values.company_partners;

  const hasAnyBrazilData = cnpj || capitalSocial !== undefined || primaryCnae || secondaryCnaes ||
    establishmentIdentifier || activityStartDate || legalNature || economicSector !== undefined ||
    mei !== undefined || simples !== undefined || registrationStatus || registrationStatusDate || partners;

  if (!hasAnyBrazilData) {
    return undefined;
  }

  return {
    document: cnpj || null,
    domain: (values.domain as string) || "",
    score: 1,
    enrichment: {
      cnpj,
      capital_social: capitalSocial,
      cnae_principal: primaryCnae,
      cnae_secundarios: secondaryCnaes,
      establishment_identifier: establishmentIdentifier,
      activity_start_date: activityStartDate,
      legal_nature: legalNature,
      economic_sector: economicSector,
      simples: {
        mei_option: mei,
        simples_option: simples,
      },
      registration_status: registrationStatus,
      registration_status_date: registrationStatusDate,
      partners,
    },
  };
}

export default function CompaniesPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<CompanyColumnId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Business[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEnrichDrawerOpen, setIsEnrichDrawerOpen] = useState(false);
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchCompanies = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("record_type", "company");
      queryParams.set("page_size", "50");
      queryParams.set("page_number", page.toString());
      queryParams.set("sort_field", "created_date");
      queryParams.set("sort_direction", "desc");

      const response = await fetch(`/api/organizations/${organizationId}/records?${queryParams.toString()}`);
      if (response.ok) {
        const data: RecordResponse = await response.json();
        const records = data.content || data.items || [];
        const mappedCompanies = records.map(mapRecordToCompany);
        setCompanies(mappedCompanies);
        setTotalElements(data.total_elements || records.length);
        setTotalPages(data.total_pages || Math.ceil((data.total_elements || records.length) / 50));
        setCurrentPage(data.page_number ?? page);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCompanies(0);
  }, [fetchCompanies]);

  const handleCompanyClick = (company: Business) => {
    setSelectedCompany(company);
    setIsDrawerOpen(true);
  };

  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrich = async (options: CompanyEnrichOptions) => {
    if (!options.technographics && !options.fundingAcquisition && !options.brazilReceitaFederal) {
      toast.error("Please select at least one enrichment option");
      return;
    }

    setIsEnriching(true);
    setIsEnrichDrawerOpen(false);

    try {
      if (options.technographics) {
        const response = await fetch(
          `/api/organizations/${organizationId}/companies/enrichments/technographics`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company_ids: selectedIds }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to enrich technographics");
        }

        const data = await response.json();
        toast.success(
          `Enrichment completed: ${data.total_with_data} of ${data.total_requested} companies enriched (${data.credits_consumed} credits used)`
        );
      }

      if (options.fundingAcquisition) {
        toast.info("Funding and acquisition enrichment coming soon");
      }

      if (options.brazilReceitaFederal) {
        const selectedCompanies = companies.filter((c) =>
          selectedIds.includes(c.id || c.business_id || "")
        );

        let enrichedCount = 0;
        let errorCount = 0;

        for (const company of selectedCompanies) {
          if (!company.domain) {
            errorCount++;
            continue;
          }

          try {
            const response = await fetch(
              `/api/organizations/${organizationId}/companies/enrichments/brazil?domain=${encodeURIComponent(company.domain)}`
            );

            if (response.ok) {
              const data = await response.json();
              if (data.enrichment) {
                enrichedCount++;
              }
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }

        if (enrichedCount > 0) {
          toast.success(
            `Brazil enrichment completed: ${enrichedCount} of ${selectedCompanies.length} companies enriched`
          );
        }
        if (errorCount > 0) {
          toast.warning(
            `${errorCount} companies could not be enriched (missing domain or API error)`
          );
        }
      }

      setSelectedIds([]);
      await fetchCompanies(currentPage);
    } catch {
      toast.error("Failed to enrich companies");
    } finally {
      setIsEnriching(false);
    }
  };

  const toggleColumn = (columnId: CompanyColumnId) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-3 h-10">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {COMPANY_COLUMNS.filter((c) => c.id !== "name").map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center justify-between"
                >
                  <span>{column.label}</span>
                  <Switch
                    checked={!hiddenColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
            {totalElements.toLocaleString("pt-BR")} companies
          </span>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setIsExportDrawerOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Export to CRM
              </Button>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setIsEnrichDrawerOpen(true)}
              >
                <Zap className="h-4 w-4" />
                Enrichment
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col relative">
        {(isLoading || isEnriching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              {isEnriching && (
                <span className="text-sm text-muted-foreground">Enriching companies...</span>
              )}
            </div>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          {companies.length === 0 && !isLoading ? (
            <Empty
              icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
              title="No company records yet"
              description="Save companies from the search page to see them here."
            />
          ) : (
            <CompanyTable
              companies={companies}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              hiddenColumns={hiddenColumns}
              onCompanyClick={handleCompanyClick}
            />
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompanies(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompanies(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CompanyDrawer
        company={selectedCompany}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <EnrichDrawer
        open={isEnrichDrawerOpen}
        onOpenChange={setIsEnrichDrawerOpen}
        recordType="companies"
        selectedCount={selectedIds.length}
        onEnrich={handleEnrich}
      />

      <ExportDrawer
        open={isExportDrawerOpen}
        onOpenChange={setIsExportDrawerOpen}
        organizationId={organizationId}
        recordType="companies"
        selectedRecords={companies
          .filter((c) => selectedIds.includes(c.id || c.business_id || ""))
          .map((c) => ({ ...c, id: c.id || c.business_id || "" }))}
        onExportComplete={() => setSelectedIds([])}
      />
    </div>
  );
}
