"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Columns3, Loader2, Building2, Users } from "lucide-react";
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
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
import { Business, Person } from "@/lib/explorium/types";

type CompanyColumnId = "name" | "description" | "industry" | "employees" | "revenue" | "location" | "domain" | "linkedin";
type PeopleColumnId = "name" | "job_title" | "company" | "company_domain" | "company_linkedin" | "location" | "linkedin" | "experiences" | "skills" | "interests";

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

const PEOPLE_COLUMNS: { id: PeopleColumnId; label: string }[] = [
  { id: "name", label: "Person Name" },
  { id: "company", label: "Company Name" },
  { id: "company_domain", label: "Company Domain" },
  { id: "company_linkedin", label: "Company LinkedIn" },
  { id: "experiences", label: "Person Experiences" },
  { id: "interests", label: "Person Interests" },
  { id: "job_title", label: "Person Job Title" },
  { id: "linkedin", label: "Person LinkedIn" },
  { id: "location", label: "Person Location" },
  { id: "skills", label: "Person Skills" },
];

interface CompanyListData {
  id: string;
  name: string;
  companies: Business[];
}

interface PeopleListData {
  id: string;
  name: string;
  people: Person[];
}

const mockCompanyLists: Record<string, CompanyListData> = {
  "1": {
    id: "1",
    name: "Tech Startups Brazil",
    companies: [
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
    ],
  },
  "2": {
    id: "2",
    name: "Enterprise Clients",
    companies: [
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
    ],
  },
  "3": {
    id: "3",
    name: "Fintech Companies",
    companies: [
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
    ],
  },
};

const mockPeopleLists: Record<string, PeopleListData> = {
  "1": {
    id: "1",
    name: "Decision Makers",
    people: [
      {
        id: "1",
        prospect_id: "prospect_001",
        first_name: "João",
        last_name: "Silva",
        full_name: "João Silva",
        job_title: "CEO",
        job_level: "C-Level",
        job_department: "Executive",
        company_name: "Tech Corp",
        company_domain: "techcorp.com",
        company_linkedin_url: "https://linkedin.com/company/techcorp",
        city: "São Paulo",
        region: "São Paulo",
        country_name: "Brazil",
        linkedin_url: "https://linkedin.com/in/joaosilva",
        experiences: ["Tech Corp - CEO", "Startup Inc - CTO"],
        skills: ["Leadership", "Strategy", "Technology"],
        interests: ["Innovation", "Startups"],
      },
      {
        id: "2",
        prospect_id: "prospect_002",
        first_name: "Maria",
        last_name: "Santos",
        full_name: "Maria Santos",
        job_title: "VP of Sales",
        job_level: "VP",
        job_department: "Sales",
        company_name: "Sales Pro",
        company_domain: "salespro.com",
        company_linkedin_url: "https://linkedin.com/company/salespro",
        city: "Rio de Janeiro",
        region: "Rio de Janeiro",
        country_name: "Brazil",
        linkedin_url: "https://linkedin.com/in/mariasantos",
        experiences: ["Sales Pro - VP Sales", "BigCorp - Sales Director"],
        skills: ["Sales", "Negotiation", "Team Management"],
        interests: ["Sales Technology", "CRM"],
      },
    ],
  },
  "2": {
    id: "2",
    name: "HR Directors",
    people: [
      {
        id: "3",
        prospect_id: "prospect_003",
        first_name: "Ana",
        last_name: "Costa",
        full_name: "Ana Costa",
        job_title: "HR Director",
        job_level: "Director",
        job_department: "Human Resources",
        company_name: "HR Solutions",
        company_domain: "hrsolutions.com",
        company_linkedin_url: "https://linkedin.com/company/hrsolutions",
        city: "Belo Horizonte",
        region: "Minas Gerais",
        country_name: "Brazil",
        linkedin_url: "https://linkedin.com/in/anacosta",
        experiences: ["HR Solutions - HR Director", "People Co - HR Manager"],
        skills: ["HR Management", "Recruiting", "Employee Relations"],
        interests: ["HR Tech", "Employee Engagement"],
      },
    ],
  },
};

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const router = useRouter();
  const { type, id } = use(params);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenCompanyColumns, setHiddenCompanyColumns] = useState<CompanyColumnId[]>([]);
  const [hiddenPeopleColumns, setHiddenPeopleColumns] = useState<PeopleColumnId[]>([]);
  const [isLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isCompanyList = type === "companies";
  const listData = isCompanyList ? mockCompanyLists[id] : mockPeopleLists[id];

  const handleCompanyClick = (company: Business) => {
    setSelectedCompany(company);
    setIsCompanyDrawerOpen(true);
  };

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDrawerOpen(true);
  };

  const toggleCompanyColumn = (columnId: CompanyColumnId) => {
    setHiddenCompanyColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((colId) => colId !== columnId)
        : [...prev, columnId]
    );
  };

  const togglePeopleColumn = (columnId: PeopleColumnId) => {
    setHiddenPeopleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((colId) => colId !== columnId)
        : [...prev, columnId]
    );
  };

  const companies = isCompanyList && listData ? (listData as CompanyListData).companies : [];
  const people = !isCompanyList && listData ? (listData as PeopleListData).people : [];

  const filteredCompanies = companies.filter((company) =>
    company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPeople = people.filter((person) =>
    person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!listData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">List not found</p>
      </div>
    );
  }

  const totalItems = isCompanyList ? filteredCompanies.length : filteredPeople.length;
  const entityLabel = isCompanyList ? "companies" : "people";

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/lists")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            {isCompanyList ? (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Users className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="text-lg font-semibold">{listData.name}</h2>
          </div>

          <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
            {totalItems.toLocaleString("pt-BR")} {entityLabel}
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
              placeholder={`Search ${entityLabel}...`}
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
              {isCompanyList
                ? COMPANY_COLUMNS.filter((c) => c.id !== "name").map((column) => (
                    <DropdownMenuItem
                      key={column.id}
                      onSelect={(e) => e.preventDefault()}
                      className="flex items-center justify-between"
                    >
                      <span>{column.label}</span>
                      <Switch
                        checked={!hiddenCompanyColumns.includes(column.id)}
                        onCheckedChange={() => toggleCompanyColumn(column.id)}
                      />
                    </DropdownMenuItem>
                  ))
                : PEOPLE_COLUMNS.filter((c) => c.id !== "name").map((column) => (
                    <DropdownMenuItem
                      key={column.id}
                      onSelect={(e) => e.preventDefault()}
                      className="flex items-center justify-between"
                    >
                      <span>{column.label}</span>
                      <Switch
                        checked={!hiddenPeopleColumns.includes(column.id)}
                        onCheckedChange={() => togglePeopleColumn(column.id)}
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
          {isCompanyList ? (
            filteredCompanies.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No companies found
              </div>
            ) : (
              <CompanyTable
                companies={filteredCompanies}
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                hiddenColumns={hiddenCompanyColumns}
                onCompanyClick={handleCompanyClick}
              />
            )
          ) : (
            filteredPeople.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No people found
              </div>
            ) : (
              <PeopleTable
                people={filteredPeople}
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                hiddenColumns={hiddenPeopleColumns}
                onPersonClick={handlePersonClick}
              />
            )
          )}
        </div>
      </div>

      <CompanyDrawer
        company={selectedCompany}
        open={isCompanyDrawerOpen}
        onOpenChange={setIsCompanyDrawerOpen}
      />

      <PersonDrawer
        person={selectedPerson}
        open={isPersonDrawerOpen}
        onOpenChange={setIsPersonDrawerOpen}
      />
    </div>
  );
}
