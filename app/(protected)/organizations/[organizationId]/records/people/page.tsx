"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
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

type PeopleColumnId = "name" | "job_title" | "company" | "company_domain" | "company_linkedin" | "location" | "linkedin" | "experiences" | "skills" | "interests";

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

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<PeopleColumnId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("record_type", "person");
      params.set("page_size", "100");
      params.set("sort_field", "created_date");
      params.set("sort_direction", "desc");

      const response = await fetch(`/api/records?${params.toString()}`);
      if (response.ok) {
        const data: RecordResponse = await response.json();
        const records = data.content || data.items || [];
        const mappedPeople = records.map(mapRecordToPerson);
        setPeople(mappedPeople);
        setTotalElements(data.total_elements || records.length);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsDrawerOpen(true);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
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
          {filteredPeople.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No people found
            </div>
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

      <PersonDrawer
        person={selectedPerson}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
