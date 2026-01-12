"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface ListData {
  id: string;
  name: string;
  record_type: string;
}

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
}

function mapRecordToCompany(record: {
  id: string;
  record_id: string;
  values: Record<string, unknown>;
}): Business {
  const values = record.values || {};
  return {
    id: record.id,
    business_id: record.record_id,
    name: (values.name as string) || "",
    business_description: (values.business_description as string) || (values.description as string) || "",
    industry: (values.industry as string) || "",
    number_of_employees_range: (values.number_of_employees_range as string) || (values.employees as string) || "",
    yearly_revenue_range: (values.yearly_revenue_range as string) || (values.revenue as string) || "",
    city_name: (values.city_name as string) || (values.city as string) || "",
    state_region_name: (values.state_region_name as string) || (values.state as string) || "",
    country_name: (values.country_name as string) || (values.country as string) || "",
    domain: (values.domain as string) || "",
    linkedin_company_url: (values.linkedin_company_url as string) || (values.linkedin as string) || "",
  };
}

function mapRecordToPerson(record: {
  id: string;
  record_id: string;
  values: Record<string, unknown>;
}): Person {
  const values = record.values || {};
  return {
    id: record.id,
    prospect_id: record.record_id,
    first_name: (values.first_name as string) || "",
    last_name: (values.last_name as string) || "",
    full_name: (values.full_name as string) || `${values.first_name || ""} ${values.last_name || ""}`.trim(),
    job_title: (values.job_title as string) || "",
    company_name: (values.company_name as string) || "",
    company_domain: (values.company_domain as string) || "",
    company_linkedin_url: (values.company_linkedin_url as string) || "",
    city: (values.city as string) || "",
    region: (values.region as string) || (values.state as string) || "",
    country_name: (values.country_name as string) || (values.country as string) || "",
    linkedin_url: (values.linkedin_url as string) || "",
    skills: (values.skills as string[]) || [],
    experiences: (values.experiences as string[]) || [],
    interests: (values.interests as string[]) || [],
  };
}

export default function ListDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const organizationId = routeParams.organizationId as string;
  const { type, id } = use(paramsPromise);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenCompanyColumns, setHiddenCompanyColumns] = useState<CompanyColumnId[]>([]);
  const [hiddenPeopleColumns, setHiddenPeopleColumns] = useState<PeopleColumnId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState<ListData | null>(null);
  const [companies, setCompanies] = useState<Business[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isCompanyList = type === "companies";

  const fetchListData = useCallback(async () => {
    setIsLoading(true);
    try {
      const listResponse = await fetch(`/api/organizations/${organizationId}/lists/${id}`);
      if (listResponse.ok) {
        const list = await listResponse.json();
        setListData(list);
      }

      const recordsResponse = await fetch(`/api/organizations/${organizationId}/lists/${id}/records`);
      if (recordsResponse.ok) {
        const data: RecordResponse = await recordsResponse.json();
        const records = data.content || data.items || [];

        if (isCompanyList) {
          setCompanies(records.map(mapRecordToCompany));
        } else {
          setPeople(records.map(mapRecordToPerson));
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, id, isCompanyList]);

  useEffect(() => {
    fetchListData();
  }, [fetchListData]);

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

  if (!isLoading && !listData) {
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
            onClick={() => router.push(`/organizations/${organizationId}/lists`)}
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
            <h2 className="text-lg font-semibold">{listData?.name || "Loading..."}</h2>
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
            filteredCompanies.length === 0 && !isLoading ? (
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
            filteredPeople.length === 0 && !isLoading ? (
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
