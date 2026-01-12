"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, Building2, Users, ChevronLeft, ChevronRight, ListPlus, Columns3, MoreVertical, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CompanyFilters } from "@/components/companies/company-filters";
import { CompanyTable } from "@/components/companies/company-table";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { PeopleFiltersComponent } from "@/components/people/people-filters";
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
import { SaveToListDialog } from "@/components/lists/save-to-list-dialog";
import {
  BusinessFilters,
  Business,
  FetchBusinessesStatsResponse,
  PeopleFilters,
  Person,
  FetchPeopleStatsResponse,
} from "@/lib/explorium/types";
import { mergeEnrichmentData, EnrichmentResponse } from "@/lib/explorium/client";
import { cn } from "@/lib/utils";

const INITIAL_PAGE_SIZE = 50;

type SearchMode = "companies" | "people";

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

export default function SearchPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [searchMode, setSearchMode] = useState<SearchMode>("companies");

  const [companyFilters, setCompanyFilters] = useState<BusinessFilters>({});
  const [companies, setCompanies] = useState<Business[]>([]);
  const [companyStats, setCompanyStats] = useState<FetchBusinessesStatsResponse | null>(null);

  const [peopleFilters, setPeopleFilters] = useState<PeopleFilters>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleStats, setPeopleStats] = useState<FetchPeopleStatsResponse | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hiddenCompanyColumns, setHiddenCompanyColumns] = useState<CompanyColumnId[]>([]);
  const [hiddenPeopleColumns, setHiddenPeopleColumns] = useState<PeopleColumnId[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCompanyClick = (company: Business) => {
    setSelectedCompany(company);
    setIsCompanyDrawerOpen(true);
  };

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDrawerOpen(true);
  };

  const getPageNumbers = (): (number | "ellipsis-start" | "ellipsis-end")[] => {
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

    if (currentPage > 2) {
      pages.push("ellipsis-start");
    }

    const startPage = Math.max(1, currentPage - 1);
    const endPage = currentPage + 1;

    for (let i = startPage; i <= endPage; i++) {
      if (i >= 1) {
        pages.push(i);
      }
    }

    if (hasMore) {
      pages.push("ellipsis-end");
    }

    return pages;
  };

  const handleModeChange = (mode: SearchMode) => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setSelectedIds([]);
    setCurrentPage(1);
    setHasMore(false);
  };

  const fetchCompanyStats = async (searchFilters: BusinessFilters) => {
    try {
      const response = await fetch("/api/companies/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: searchFilters }),
      });
      if (response.ok) {
        const data = await response.json();
        setCompanyStats(data);
      }
    } catch (error) {
      console.error("Error fetching company stats:", error);
    }
  };

  const enrichCompanies = async (businesses: Business[]): Promise<Business[]> => {
    const businessIds = businesses
      .map((b) => b.business_id || b.id)
      .filter((id): id is string => !!id);

    if (businessIds.length === 0) return businesses;

    try {
      const response = await fetch("/api/companies/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessIds }),
      });

      if (response.ok) {
        const enrichmentData: EnrichmentResponse = await response.json();
        return mergeEnrichmentData(businesses, enrichmentData);
      }
    } catch (error) {
      console.error("Error enriching companies:", error);
    }

    return businesses;
  };

  const handleSearchCompanies = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: companyFilters,
          page: 1,
          pageSize: INITIAL_PAGE_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const businesses: Business[] =
          data.businesses || data.results || data.data || [];

        const enrichedBusinesses = await enrichCompanies(businesses);
        setCompanies(enrichedBusinesses);

        const total = data.total ?? data.total_results ?? 0;
        const totalPages = data.total_pages ?? Math.ceil(total / INITIAL_PAGE_SIZE);
        setHasMore(totalPages > 1);

        fetchCompanyStats(companyFilters);
      } else {
        const error = await response.json();
        console.error("Search error:", error);
        setCompanies([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error searching companies:", error);
      setCompanies([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [companyFilters]);

  const fetchCompaniesPage = useCallback(async (page: number) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: companyFilters,
          page,
          pageSize: INITIAL_PAGE_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newBusinesses: Business[] =
          data.businesses || data.results || data.data || [];

        const enrichedBusinesses = await enrichCompanies(newBusinesses);
        setCompanies(enrichedBusinesses);
        setCurrentPage(page);

        const total = data.total ?? data.total_results ?? 0;
        const totalPages = data.total_pages ?? Math.ceil(total / INITIAL_PAGE_SIZE);
        setHasMore(page < totalPages);

        scrollContainerRef.current?.scrollTo({ top: 0 });
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyFilters]);

  const fetchPeopleStats = async (searchFilters: PeopleFilters) => {
    try {
      const response = await fetch("/api/people/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: searchFilters }),
      });
      if (response.ok) {
        const data = await response.json();
        setPeopleStats(data);
      }
    } catch (error) {
      console.error("Error fetching people stats:", error);
    }
  };

  const handleSearchPeople = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: peopleFilters,
          page: 1,
          pageSize: INITIAL_PAGE_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const peopleList: Person[] =
          data.people || data.prospects || data.results || data.data || [];

        setPeople(peopleList);

        const total = data.total ?? data.total_results ?? 0;
        const totalPages = data.total_pages ?? Math.ceil(total / INITIAL_PAGE_SIZE);
        setHasMore(totalPages > 1);

        fetchPeopleStats(peopleFilters);
      } else {
        const error = await response.json();
        console.error("Search error:", error);
        setPeople([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error searching people:", error);
      setPeople([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [peopleFilters]);

  const fetchPeoplePage = useCallback(async (page: number) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: peopleFilters,
          page,
          pageSize: INITIAL_PAGE_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newPeople: Person[] =
          data.people || data.prospects || data.results || data.data || [];

        setPeople(newPeople);
        setCurrentPage(page);

        const total = data.total ?? data.total_results ?? 0;
        const totalPages = data.total_pages ?? Math.ceil(total / INITIAL_PAGE_SIZE);
        setHasMore(page < totalPages);

        scrollContainerRef.current?.scrollTo({ top: 0 });
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    } finally {
      setIsLoading(false);
    }
  }, [peopleFilters]);

  const handleSearch = useCallback(() => {
    if (searchMode === "companies") {
      handleSearchCompanies();
    } else {
      handleSearchPeople();
    }
  }, [searchMode, handleSearchCompanies, handleSearchPeople]);

  const goToPage = (page: number) => {
    if (isLoading) return;
    if (searchMode === "companies") {
      fetchCompaniesPage(page);
    } else {
      fetchPeoplePage(page);
    }
  };

  const handleClearFilters = () => {
    if (searchMode === "companies") {
      setCompanyFilters({});
    } else {
      setPeopleFilters({});
    }
  };

  const handleSaveToList = () => {
    setIsSaveDialogOpen(true);
  };

  const handleSaveSuccess = () => {
    setSelectedIds([]);
  };

  const toggleCompanyColumn = (columnId: CompanyColumnId) => {
    setHiddenCompanyColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const togglePeopleColumn = (columnId: PeopleColumnId) => {
    setHiddenPeopleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  useEffect(() => {
    if (searchMode === "companies") {
      handleSearchCompanies();
    } else {
      handleSearchPeople();
    }
  }, [searchMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        handleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSearch, isLoading]);

  const totalResults = searchMode === "companies"
    ? (companyStats?.total ?? companyStats?.total_results ?? 0)
    : (peopleStats?.total ?? peopleStats?.total_results ?? 0);

  const entityLabel = searchMode === "companies" ? "Companies" : "People";

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between h-10 flex-shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-sm">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto p-4">
                  {searchMode === "companies" ? (
                    <CompanyFilters
                      filters={companyFilters}
                      onChange={setCompanyFilters}
                      onClear={handleClearFilters}
                    />
                  ) : (
                    <PeopleFiltersComponent
                      filters={peopleFilters}
                      onChange={setPeopleFilters}
                      onClear={handleClearFilters}
                    />
                  )}
                </div>
                <div className="p-4 border-t">
                  <Button
                    onClick={() => {
                      handleSearch();
                      setIsFiltersOpen(false);
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Apply filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <Columns3 className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {searchMode === "companies"
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

            <div className="flex rounded-lg bg-muted p-1 border">
                <button
                  onClick={() => handleModeChange("companies")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    searchMode === "companies"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Companies
                </button>
                <button
                  onClick={() => handleModeChange("people")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    searchMode === "people"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                  People
                </button>
              </div>

              <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
                {totalResults.toLocaleString("pt-BR")} {entityLabel.toLowerCase()}
              </span>
              {selectedIds.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2">
                      {selectedIds.length} selected
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleSaveToList}>
                      <ListPlus className="h-4 w-4 mr-2" />
                      Save
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              {searchMode === "companies" ? (
                <CompanyTable
                  companies={companies}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  hiddenColumns={hiddenCompanyColumns}
                  onCompanyClick={handleCompanyClick}
                  startIndex={(currentPage - 1) * INITIAL_PAGE_SIZE}
                />
              ) : (
                <PeopleTable
                  people={people}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  hiddenColumns={hiddenPeopleColumns}
                  onPersonClick={handlePersonClick}
                  startIndex={(currentPage - 1) * INITIAL_PAGE_SIZE}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center h-12 flex-shrink-0 mt-3 gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((page, index) =>
              page === "ellipsis-start" || page === "ellipsis-end" ? (
                <span key={`${page}-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(page)}
                  disabled={isLoading}
                >
                  {page}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!hasMore || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
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

      <SaveToListDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        entityType={searchMode}
        organizationId={organizationId}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
