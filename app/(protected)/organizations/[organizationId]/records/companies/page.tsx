"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Columns3, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyTable } from "@/components/companies/company-table";
import { CompanyDrawer } from "@/components/companies/company-drawer";
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

type CompanyColumnId = "name" | "description" | "industry" | "employees" | "revenue" | "location" | "domain" | "linkedin";

const COMPANY_COLUMNS: { id: CompanyColumnId; label: string }[] = [
  { id: "name", label: "Company Name" },
  { id: "description", label: "Company Description" },
  { id: "domain", label: "Company Domain" },
  { id: "employees", label: "Company Employees" },
  { id: "industry", label: "Company Industry" },
  { id: "linkedin", label: "Company LinkedIn" },
  { id: "location", label: "Company Location" },
  { id: "revenue", label: "Company Revenue" },
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
    industry: (values.industry as string) || (values.company_industry as string),
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
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          {companies.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No companies found
            </div>
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
    </div>
  );
}
