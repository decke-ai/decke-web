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
import { PeopleTable } from "@/components/people/people-table";
import { PersonDrawer } from "@/components/people/person-drawer";
import { Person } from "@/lib/explorium/types";

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

// Mock data representing deduplicated people from all lists
const mockPeople: Person[] = [
  {
    id: "1",
    prospect_id: "prs_001",
    first_name: "David",
    last_name: "Vélez",
    full_name: "David Vélez",
    job_title: "CEO & Founder",
    company_name: "Nubank",
    company_domain: "nubank.com.br",
    company_linkedin_url: "https://linkedin.com/company/nubank",
    city: "São Paulo",
    region: "São Paulo",
    country_name: "Brazil",
    linkedin_url: "https://linkedin.com/in/davidvelez",
    skills: ["Leadership", "Fintech", "Strategy"],
    experiences: ["Goldman Sachs", "Sequoia Capital"],
    interests: ["Financial Inclusion", "Technology"],
  },
  {
    id: "2",
    prospect_id: "prs_002",
    first_name: "Fabricio",
    last_name: "Bloisi",
    full_name: "Fabricio Bloisi",
    job_title: "CEO",
    company_name: "iFood",
    company_domain: "ifood.com.br",
    company_linkedin_url: "https://linkedin.com/company/ifood",
    city: "São Paulo",
    region: "São Paulo",
    country_name: "Brazil",
    linkedin_url: "https://linkedin.com/in/fabriciobloisi",
    skills: ["Management", "E-commerce", "Operations"],
    experiences: ["Movile", "Playkids"],
    interests: ["Food Tech", "Logistics"],
  },
  {
    id: "3",
    prospect_id: "prs_003",
    first_name: "Mariano",
    last_name: "Gomide",
    full_name: "Mariano Gomide",
    job_title: "Co-founder & Co-CEO",
    company_name: "VTEX",
    company_domain: "vtex.com",
    company_linkedin_url: "https://linkedin.com/company/vtex",
    city: "Rio de Janeiro",
    region: "Rio de Janeiro",
    country_name: "Brazil",
    linkedin_url: "https://linkedin.com/in/marianogomide",
    skills: ["E-commerce", "SaaS", "Product"],
    experiences: ["VTEX"],
    interests: ["Digital Commerce", "Innovation"],
  },
  {
    id: "4",
    prospect_id: "prs_004",
    first_name: "Gabriel",
    last_name: "Braga",
    full_name: "Gabriel Braga",
    job_title: "CEO & Co-founder",
    company_name: "QuintoAndar",
    company_domain: "quintoandar.com.br",
    company_linkedin_url: "https://linkedin.com/company/quintoandar",
    city: "São Paulo",
    region: "São Paulo",
    country_name: "Brazil",
    linkedin_url: "https://linkedin.com/in/gabrielbraga",
    skills: ["Real Estate", "Product Management", "Growth"],
    experiences: ["Google", "McKinsey"],
    interests: ["PropTech", "Urban Development"],
  },
  {
    id: "5",
    prospect_id: "prs_005",
    first_name: "Florian",
    last_name: "Hagenbuch",
    full_name: "Florian Hagenbuch",
    job_title: "Co-founder",
    company_name: "Loft",
    company_domain: "loft.com.br",
    company_linkedin_url: "https://linkedin.com/company/loftbr",
    city: "São Paulo",
    region: "São Paulo",
    country_name: "Brazil",
    linkedin_url: "https://linkedin.com/in/florianhagenbuch",
    skills: ["Entrepreneurship", "Real Estate", "Investment"],
    experiences: ["Printi", "BCG"],
    interests: ["Real Estate Technology", "Startups"],
  },
];

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<PeopleColumnId[]>([]);
  const [isLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Filter people by search query
  const filteredPeople = mockPeople.filter((person) =>
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
            {filteredPeople.length.toLocaleString("pt-BR")} people
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
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
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
