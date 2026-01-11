"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Building2, Users, ChevronLeft, ChevronRight, Columns3, Sparkles, MoreVertical, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { CompanyTable } from "@/components/companies/company-table";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
import { SaveToListDialog } from "@/components/lists/save-to-list-dialog";
import { Business, Person } from "@/lib/explorium/types";
import { cn } from "@/lib/utils";

type SearchMode = "companies" | "people";

interface ApiCompany {
  company_id?: string;
  company_name?: string;
  company_domain?: string;
  company_description?: string;
  company_industry?: string;
  company_employee?: string;
  company_revenue?: string;
  company_city_name?: string;
  company_region_name?: string;
  company_country_name?: string;
  company_linkedin_url?: string;
  company_avatar?: string;
  company_address?: string;
  company_zip_code?: string;
}

const mapApiCompanyToBusiness = (apiCompany: ApiCompany): Business => ({
  business_id: apiCompany.company_id,
  id: apiCompany.company_id,
  name: apiCompany.company_name || "",
  domain: apiCompany.company_domain,
  description: apiCompany.company_description,
  business_description: apiCompany.company_description,
  industry: apiCompany.company_industry,
  employee_range: apiCompany.company_employee,
  number_of_employees_range: apiCompany.company_employee,
  revenue_range: apiCompany.company_revenue,
  yearly_revenue_range: apiCompany.company_revenue,
  city_name: apiCompany.company_city_name,
  state_region_name: apiCompany.company_region_name,
  country_name: apiCompany.company_country_name,
  linkedin_url: apiCompany.company_linkedin_url,
  linkedin_company_url: apiCompany.company_linkedin_url,
  logo: apiCompany.company_avatar,
  logo_url: apiCompany.company_avatar,
});

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

export default function AISearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("companies");
  const [query, setQuery] = useState("");

  const [companies, setCompanies] = useState<Business[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [displayedMessage, setDisplayedMessage] = useState("");

  useEffect(() => {
    if (!progressMessage) {
      setDisplayedMessage("");
      return;
    }

    setDisplayedMessage("");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < progressMessage.length) {
        setDisplayedMessage(progressMessage.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [progressMessage]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isQueryPanelCollapsed, setIsQueryPanelCollapsed] = useState(false);
  const [hiddenCompanyColumns, setHiddenCompanyColumns] = useState<CompanyColumnId[]>([]);
  const [hiddenPeopleColumns, setHiddenPeopleColumns] = useState<PeopleColumnId[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Business | null>(null);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSearchMode(mode);
    setSelectedIds([]);
    setCurrentPage(1);
    setHasMore(false);
    setCompanies([]);
    setPeople([]);
    setTotalResults(0);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setIsStreaming(true);
    setProgressMessage("Initializing search...");
    setCurrentPage(1);
    setCompanies([]);
    setPeople([]);
    setTotalResults(0);

    const endpoint = searchMode === "companies"
      ? "/api/organizations/default/ai-search/companies"
      : "/api/organizations/default/ai-search/people";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search error:", errorText);
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) {
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith(": ping")) continue;

            if (trimmedLine.startsWith("event:")) {
              currentEvent = trimmedLine.slice(6).trim();
              continue;
            }

            if (trimmedLine.startsWith("data:")) {
              const dataStr = trimmedLine.slice(5).trim();

              if (currentEvent === "progress") {
                setProgressMessage(dataStr);
                const totalMatch = dataStr.match(/Found (\d+) total/);
                if (totalMatch) {
                  setTotalResults(parseInt(totalMatch[1], 10));
                }
              } else if (currentEvent === "done" && dataStr.startsWith("{")) {
                try {
                  const jsonData = JSON.parse(dataStr);

                  if (searchMode === "companies") {
                    const apiCompanies: ApiCompany[] = jsonData.content || jsonData.data || [];
                    const businesses = apiCompanies.map(mapApiCompanyToBusiness);
                    setCompanies(businesses);
                    if (jsonData.total) {
                      setTotalResults(jsonData.total);
                    }
                  } else {
                    const peopleList: Person[] = jsonData.content || jsonData.data || [];
                    setPeople(peopleList);
                    if (jsonData.total) {
                      setTotalResults(jsonData.total);
                    }
                  }
                  setProgressMessage("");
                } catch (e) {
                  console.error("Error parsing done event data:", e);
                }
              }

              currentEvent = "";
            }
          }
        }
      } else {
        const data = await response.json();

        if (searchMode === "companies") {
          const apiCompanies: ApiCompany[] = data.content || data.data || data.businesses || data.results || [];
          const businesses = apiCompanies.map(mapApiCompanyToBusiness);
          setCompanies(businesses);
          setPeople([]);
        } else {
          const peopleList: Person[] = data.content || data.people || data.prospects || data.results || data.data || [];
          setPeople(peopleList);
          setCompanies([]);
        }

        const apiData = data.content || data.data || data.businesses || data.results || [];
        const total = data.total ?? data.total_results ?? apiData.length;
        setTotalResults(total);
        const totalPages = data.total_pages ?? Math.ceil(total / 50);
        setHasMore(totalPages > 1);
        setIsLoading(false);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error searching:", error);
      }
      setIsLoading(false);
    } finally {
      setIsStreaming(false);
    }
  };

  const goToPage = async (page: number) => {
    if (isLoading || isStreaming || !query.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setProgressMessage("Loading page...");

    const endpoint = searchMode === "companies"
      ? "/api/organizations/default/ai-search/companies"
      : "/api/organizations/default/ai-search/people";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), page }),
      });

      if (!response.ok) {
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) {
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith(": ping")) continue;

            if (trimmedLine.startsWith("event:")) {
              currentEvent = trimmedLine.slice(6).trim();
              continue;
            }

            if (trimmedLine.startsWith("data:")) {
              const dataStr = trimmedLine.slice(5).trim();

              if (currentEvent === "progress") {
                setProgressMessage(dataStr);
                const totalMatch = dataStr.match(/Found (\d+) total/);
                if (totalMatch) {
                  setTotalResults(parseInt(totalMatch[1], 10));
                }
              } else if (currentEvent === "done" && dataStr.startsWith("{")) {
                try {
                  const jsonData = JSON.parse(dataStr);

                  if (searchMode === "companies") {
                    const apiCompanies: ApiCompany[] = jsonData.content || jsonData.data || [];
                    const businesses = apiCompanies.map(mapApiCompanyToBusiness);
                    setCompanies(businesses);
                    if (jsonData.total) {
                      setTotalResults(jsonData.total);
                    }
                  } else {
                    const peopleList: Person[] = jsonData.content || jsonData.data || [];
                    setPeople(peopleList);
                    if (jsonData.total) {
                      setTotalResults(jsonData.total);
                    }
                  }
                  setProgressMessage("");
                } catch (e) {
                  console.error("Error parsing done event data:", e);
                }
              }

              currentEvent = "";
            }
          }
        }

        setCurrentPage(page);
        setHasMore(true);
        scrollContainerRef.current?.scrollTo({ top: 0 });
      } else {
        const data = await response.json();

        if (searchMode === "companies") {
          const apiCompanies: ApiCompany[] = data.content || data.data || data.businesses || data.results || [];
          const businesses = apiCompanies.map(mapApiCompanyToBusiness);
          setCompanies(businesses);
        } else {
          const peopleList: Person[] = data.content || data.people || data.prospects || data.results || data.data || [];
          setPeople(peopleList);
        }

        setCurrentPage(page);
        const total = data.total ?? data.total_results ?? 0;
        const totalPages = data.total_pages ?? Math.ceil(total / 50);
        setHasMore(page < totalPages);

        scrollContainerRef.current?.scrollTo({ top: 0 });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setIsLoading(false);
    } finally {
      setIsStreaming(false);
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

  const entityLabel = searchMode === "companies" ? "Companies" : "People";

  return (
    <div className="flex h-full">
      <div
        className={cn(
          "border-r flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out",
          isQueryPanelCollapsed ? "w-0 border-r-0" : "w-80"
        )}
      >
        <div className="w-80 flex flex-col h-full">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">AI Search</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <Textarea
              placeholder="Describe the companies or people you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Use natural language to describe your ideal prospects. For example: &quot;SaaS companies in the US with 50-200 employees&quot; or &quot;Marketing directors at fintech startups&quot;
            </p>
          </div>

          <div className="p-4">
            <Button
              onClick={handleSearch}
              disabled={isLoading || isStreaming || !query.trim()}
              className="w-full"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isStreaming ? "Searching..." : "Search with AI"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between h-10 flex-shrink-0 mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsQueryPanelCollapsed(!isQueryPanelCollapsed)}
              >
                {isQueryPanelCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>

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
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
                    {selectedIds.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
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
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Columns3 className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
            </div>
          </div>

          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col relative">
            {(isLoading || isStreaming) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  {displayedMessage || "Searching..."}
                </p>
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
                />
              ) : (
                <PeopleTable
                  people={people}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  hiddenColumns={hiddenPeopleColumns}
                  onPersonClick={handlePersonClick}
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
              disabled={currentPage === 1 || isLoading || isStreaming}
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
                  disabled={isLoading || isStreaming}
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
              disabled={!hasMore || isLoading || isStreaming}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
