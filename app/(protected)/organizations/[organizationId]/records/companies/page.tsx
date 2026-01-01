"use client";

import { useState, useRef } from "react";
import { Search, Columns3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Mock data representing deduplicated companies from all lists
const mockCompanies: Business[] = [
  {
    id: "1",
    business_id: "biz_001",
    name: "Nubank",
    business_description: "Digital bank and financial services company",
    industry: "Financial Services",
    number_of_employees_range: "5,001-10,000",
    yearly_revenue_range: "$1B-$5B",
    city_name: "São Paulo",
    state_region_name: "São Paulo",
    country_name: "Brazil",
    domain: "nubank.com.br",
    linkedin_company_url: "https://linkedin.com/company/nubank",
  },
  {
    id: "2",
    business_id: "biz_002",
    name: "iFood",
    business_description: "Food delivery platform",
    industry: "Technology",
    number_of_employees_range: "1,001-5,000",
    yearly_revenue_range: "$500M-$1B",
    city_name: "São Paulo",
    state_region_name: "São Paulo",
    country_name: "Brazil",
    domain: "ifood.com.br",
    linkedin_company_url: "https://linkedin.com/company/ifood",
  },
  {
    id: "3",
    business_id: "biz_003",
    name: "VTEX",
    business_description: "Enterprise digital commerce platform",
    industry: "Software",
    number_of_employees_range: "1,001-5,000",
    yearly_revenue_range: "$100M-$500M",
    city_name: "Rio de Janeiro",
    state_region_name: "Rio de Janeiro",
    country_name: "Brazil",
    domain: "vtex.com",
    linkedin_company_url: "https://linkedin.com/company/vtex",
  },
  {
    id: "4",
    business_id: "biz_004",
    name: "QuintoAndar",
    business_description: "Real estate technology platform",
    industry: "Real Estate Technology",
    number_of_employees_range: "501-1,000",
    yearly_revenue_range: "$50M-$100M",
    city_name: "São Paulo",
    state_region_name: "São Paulo",
    country_name: "Brazil",
    domain: "quintoandar.com.br",
    linkedin_company_url: "https://linkedin.com/company/quintoandar",
  },
  {
    id: "5",
    business_id: "biz_005",
    name: "Loft",
    business_description: "Proptech company for buying and selling real estate",
    industry: "Real Estate",
    number_of_employees_range: "501-1,000",
    yearly_revenue_range: "$50M-$100M",
    city_name: "São Paulo",
    state_region_name: "São Paulo",
    country_name: "Brazil",
    domain: "loft.com.br",
    linkedin_company_url: "https://linkedin.com/company/loftbr",
  },
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<CompanyColumnId[]>([]);
  const [isLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Filter companies by search query
  const filteredCompanies = mockCompanies.filter((company) =>
    company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
            {filteredCompanies.length.toLocaleString("pt-BR")} companies
          </span>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="pl-9 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          {filteredCompanies.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No companies found
            </div>
          ) : (
            <CompanyTable
              companies={filteredCompanies}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              hiddenColumns={hiddenColumns}
              onCompanyClick={handleCompanyClick}
            />
          )}
        </div>
      </div>

      <CompanyDrawer
        company={selectedCompany}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
