"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, Columns3, Loader2, ChevronLeft, ChevronRight, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
import { EnrichDrawer, PeopleEnrichOptions } from "@/components/records/enrich-drawer";
import { Empty } from "@/components/ui/empty";
import { Person } from "@/lib/explorium/types";

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

import { PeopleColumnId } from "@/components/people/people-table";

const PEOPLE_COLUMNS: { id: PeopleColumnId; label: string }[] = [
  { id: "name", label: "Person Name" },
  { id: "professional_email", label: "Person Email" },
  { id: "phone", label: "Person Phone" },
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

function mapRecordToPerson(record: {
  id: string;
  record_id: string;
  values: Record<string, unknown>;
}): Person {
  const values = record.values || {};
  const personName = (values.person_name as string) || (values.full_name as string) || "";
  const nameParts = personName.split(" ");
  const firstName = (values.person_first_name as string) || (values.first_name as string) || nameParts[0] || "";
  const lastName = (values.person_last_name as string) || (values.last_name as string) || nameParts.slice(1).join(" ") || "";

  return {
    id: record.id,
    prospect_id: record.record_id,
    first_name: firstName,
    last_name: lastName,
    full_name: personName || `${firstName} ${lastName}`.trim(),
    job_title: (values.person_job_title as string) || (values.job_title as string) || "",
    job_level: (values.person_job_level as string) || (values.job_level as string) || "",
    job_department: (values.person_job_department as string) || (values.job_department as string) || "",
    company_name: (values.company_name as string) || (values.person_company_name as string) || "",
    company_domain: (values.company_domain as string) || (values.person_company_domain as string) || "",
    company_linkedin_url: (values.company_linkedin_url as string) || (values.person_company_linkedin_url as string) || "",
    company_logo: (values.company_avatar as string) || (values.company_logo as string) || (values.business_logo as string) || "",
    business_id: (values.business_id as string) || "",
    city: (values.person_city_name as string) || (values.city as string) || "",
    region: (values.person_region_name as string) || (values.region as string) || (values.state as string) || "",
    country_name: (values.person_country_name as string) || (values.country_name as string) || (values.country as string) || "",
    country: (values.person_country_name as string) || (values.country as string) || (values.country_name as string) || "",
    linkedin_url: (values.person_linkedin_url as string) || (values.linkedin_url as string) || (values.linkedin_profile as string) || "",
    linkedin_profile: (values.person_linkedin_url as string) || (values.linkedin_profile as string) || (values.linkedin_url as string) || "",
    profile_picture: (values.person_profile_picture as string) || (values.profile_picture as string) || "",
    skills: (values.person_skills as string[]) || (values.skills as string[]) || [],
    experiences: (values.person_experiences as string[]) || (values.experiences as string[]) || [],
    interests: (values.person_interests as string[]) || (values.interests as string[]) || [],
  };
}

export default function PeoplePage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<PeopleColumnId[]>(["professional_email", "phone"]);
  const [isLoading, setIsLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEnrichDrawerOpen, setIsEnrichDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchPeople = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("record_type", "person");
      queryParams.set("page_size", "50");
      queryParams.set("page_number", page.toString());
      queryParams.set("sort_field", "created_date");
      queryParams.set("sort_direction", "desc");

      const response = await fetch(`/api/organizations/${organizationId}/records?${queryParams.toString()}`);
      if (response.ok) {
        const data: RecordResponse = await response.json();
        const records = data.content || data.items || [];
        const mappedPeople = records.map(mapRecordToPerson);
        setPeople(mappedPeople);
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
    fetchPeople(0);
  }, [fetchPeople]);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsDrawerOpen(true);
  };

  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrich = async (options: PeopleEnrichOptions) => {
    if (!options.email && !options.phone) {
      toast.error("Please select at least one enrichment option");
      return;
    }

    setIsEnriching(true);
    setIsEnrichDrawerOpen(false);

    try {
      let enrichmentType: "email" | "phone" | "both" = "both";
      if (options.email && !options.phone) {
        enrichmentType = "email";
      } else if (!options.email && options.phone) {
        enrichmentType = "phone";
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/people/enrichments/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person_ids: selectedIds,
            enrichment_type: enrichmentType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enrich contacts");
      }

      const data = await response.json();

      setPeople((prev) =>
        prev.map((person) => {
          const enrichedData = data.contacts?.find(
            (c: { person_id: string }) => c.person_id === person.id
          );
          if (enrichedData) {
            return {
              ...person,
              professional_email: enrichedData.professional_email,
              professional_email_status: enrichedData.professional_email_status,
              emails: enrichedData.emails,
              mobile_phone: enrichedData.mobile_phone,
              phone_numbers: enrichedData.phone_numbers,
              email_enriched_date: enrichedData.email_enriched_date,
              phone_enriched_date: enrichedData.phone_enriched_date,
            };
          }
          return person;
        })
      );

      if (options.email && hiddenColumns.includes("professional_email")) {
        setHiddenColumns((prev) => prev.filter((col) => col !== "professional_email"));
      }
      if (options.phone && hiddenColumns.includes("phone")) {
        setHiddenColumns((prev) => prev.filter((col) => col !== "phone"));
      }

      const results = [];
      if (data.total_with_email > 0) {
        results.push(`${data.total_with_email} with email`);
      }
      if (data.total_with_phone > 0) {
        results.push(`${data.total_with_phone} with phone`);
      }

      toast.success(
        `Enrichment completed: ${results.join(", ")} (${data.credits_consumed} credits used)`
      );

      setSelectedIds([]);
    } catch {
      toast.error("Failed to enrich contacts");
    } finally {
      setIsEnriching(false);
    }
  };

  const toggleColumn = (columnId: PeopleColumnId) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const filteredPeople = people.filter((person) =>
    person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {PEOPLE_COLUMNS.filter((c) => c.id !== "name").map((column) => (
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
            {(searchQuery ? filteredPeople.length : totalElements).toLocaleString("pt-BR")} people
          </span>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              className="h-9"
              onClick={() => setIsEnrichDrawerOpen(true)}
            >
              <Zap className="h-4 w-4" />
              Enrichment
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col relative">
        {(isLoading || isEnriching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              {isEnriching && (
                <span className="text-sm text-muted-foreground">Enriching contacts...</span>
              )}
            </div>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          {filteredPeople.length === 0 && !isLoading ? (
            <Empty
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="No people records yet"
              description="Save people from the search page to see them here."
            />
          ) : (
            <PeopleTable
              people={filteredPeople}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              hiddenColumns={hiddenColumns}
              onPersonClick={handlePersonClick}
            />
          )}
        </div>
      </div>

      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPeople(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPeople(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <PersonDrawer
        person={selectedPerson}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <EnrichDrawer
        open={isEnrichDrawerOpen}
        onOpenChange={setIsEnrichDrawerOpen}
        recordType="people"
        selectedCount={selectedIds.length}
        onEnrich={handleEnrich}
      />
    </div>
  );
}
