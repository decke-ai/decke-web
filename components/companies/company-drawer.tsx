"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Globe,
  ExternalLink,
  MapPin,
  Users,
  DollarSign,
  Factory,
  FileText,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  Hash,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Business, Person } from "@/lib/explorium/types";
import { cn } from "@/lib/utils";

interface CompanyDrawerProps {
  company: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "details" | "people" | "brazil";

interface BrazilEnrichment {
  document: string | null;
  domain: string;
  enrichment: Record<string, unknown> | null;
  score: number;
}

const getCompanyLogo = (company: Business): string | undefined => {
  return company.logo || company.logo_url;
};

const formatLocation = (company: Business): string => {
  const city = company.city_name || company.address?.city;
  const region = company.state_region_name || company.address?.state;
  const country = company.country_name || company.address?.country;

  const parts = [city, region, country].filter(Boolean);
  return parts.join(", ") || "-";
};

const getPersonFullName = (person: Person): string => {
  if (person.full_name) return person.full_name;
  const parts = [person.first_name, person.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
};

function CompanyDetails({ company }: { company: Business }) {
  const description = company.business_description || company.description;
  const linkedinUrl = company.linkedin_company_url || company.linkedin_url;

  return (
    <div className="space-y-6 px-4 pb-4">
      {description && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            Description
          </div>
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {(company.number_of_employees_range || company.employee_count || company.employee_range) && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Employees
            </div>
            <p className="text-sm">
              {company.number_of_employees_range ||
                company.employee_count?.toLocaleString("pt-BR") ||
                company.employee_range}
            </p>
          </div>
        )}

        {(company.yearly_revenue_range || company.revenue_range || company.revenue) && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Revenue
            </div>
            <p className="text-sm">
              {company.yearly_revenue_range ||
                company.revenue_range ||
                (company.revenue ? `$${company.revenue.toLocaleString("en-US")}` : "-")}
            </p>
          </div>
        )}

        {company.industry && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Factory className="h-4 w-4" />
              Industry
            </div>
            <p className="text-sm">{company.industry}</p>
          </div>
        )}

        {formatLocation(company) !== "-" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <p className="text-sm">{formatLocation(company)}</p>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Links</div>

        {company.domain && (
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Website</p>
              <p className="text-sm text-muted-foreground truncate">{company.domain}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        )}

        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">LinkedIn</p>
              <p className="text-sm text-muted-foreground truncate">
                {linkedinUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

const hasValue = (value: unknown): value is string | number | boolean => {
  return value !== null && value !== undefined && value !== "";
};

const formatCNPJ = (cnpj: string): string => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

function CompanyBrazil({ company, organizationId }: { company: Business; organizationId: string }) {
  const [data, setData] = useState<BrazilEnrichment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchBrazilData = useCallback(async () => {
    if (!company.domain) {
      setError("Company domain is required for enrichment");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/companies/enrichments/brazil?domain=${encodeURIComponent(company.domain)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch Brazil data");
      }

      const result = await response.json();
      setData(result);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Brazil data");
    } finally {
      setIsLoading(false);
    }
  }, [company.domain, organizationId]);

  if (!company.domain) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Company domain is required for Brazil enrichment</p>
      </div>
    );
  }

  if (!hasFetched && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Search for company data from Receita Federal do Brasil
        </p>
        <Button onClick={fetchBrazilData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4 mr-2" />
              Search CNPJ
            </>
          )}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Searching Receita Federal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={fetchBrazilData}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || !data.document) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">No CNPJ found for this company</p>
        <p className="text-xs text-muted-foreground mb-4">
          This company may not be Brazilian or the CNPJ could not be identified
        </p>
        <Button variant="outline" onClick={fetchBrazilData}>
          Search Again
        </Button>
      </div>
    );
  }

  const enrichment = data.enrichment || {};

  return (
    <div className="space-y-6 px-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Hash className="h-4 w-4" />
            CNPJ
          </div>
          <p className="text-lg font-mono font-semibold">{formatCNPJ(data.document)}</p>
        </div>
        {data.score > 0 && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="text-sm font-medium">{Math.round(data.score * 100)}%</div>
          </div>
        )}
      </div>

      <Separator />

      {Object.keys(enrichment).length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {hasValue(enrichment.razao_social) && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Razão Social
                </div>
                <p className="text-sm">{String(enrichment.razao_social)}</p>
              </div>
            )}

            {hasValue(enrichment.nome_fantasia) && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Nome Fantasia
                </div>
                <p className="text-sm">{String(enrichment.nome_fantasia)}</p>
              </div>
            )}

            {hasValue(enrichment.situacao_cadastral) && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Situação Cadastral</div>
                <p className="text-sm">{String(enrichment.situacao_cadastral)}</p>
              </div>
            )}

            {hasValue(enrichment.data_situacao_cadastral) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Data Situação
                </div>
                <p className="text-sm">{formatDate(String(enrichment.data_situacao_cadastral))}</p>
              </div>
            )}

            {hasValue(enrichment.data_abertura) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Data de Abertura
                </div>
                <p className="text-sm">{formatDate(String(enrichment.data_abertura))}</p>
              </div>
            )}

            {hasValue(enrichment.natureza_juridica) && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Natureza Jurídica</div>
                <p className="text-sm">{String(enrichment.natureza_juridica)}</p>
              </div>
            )}

            {hasValue(enrichment.porte) && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Porte</div>
                <p className="text-sm">{String(enrichment.porte)}</p>
              </div>
            )}

            {hasValue(enrichment.capital_social) && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Capital Social
                </div>
                <p className="text-sm">{formatCurrency(Number(enrichment.capital_social))}</p>
              </div>
            )}

            {hasValue(enrichment.cnae_principal) && (
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Factory className="h-4 w-4" />
                  CNAE Principal
                </div>
                <p className="text-sm">{String(enrichment.cnae_principal)}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Endereço</div>
            <div className="grid grid-cols-2 gap-4">
              {hasValue(enrichment.logradouro) && (
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Logradouro
                  </div>
                  <p className="text-sm">
                    {[String(enrichment.logradouro), hasValue(enrichment.numero) ? String(enrichment.numero) : null, hasValue(enrichment.complemento) ? String(enrichment.complemento) : null]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}

              {hasValue(enrichment.bairro) && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Bairro</div>
                  <p className="text-sm">{String(enrichment.bairro)}</p>
                </div>
              )}

              {hasValue(enrichment.cep) && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">CEP</div>
                  <p className="text-sm">{String(enrichment.cep)}</p>
                </div>
              )}

              {hasValue(enrichment.municipio) && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Município</div>
                  <p className="text-sm">{String(enrichment.municipio)}</p>
                </div>
              )}

              {hasValue(enrichment.uf) && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">UF</div>
                  <p className="text-sm">{String(enrichment.uf)}</p>
                </div>
              )}
            </div>
          </div>

          {(hasValue(enrichment.telefone) || hasValue(enrichment.email)) && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Contato</div>
                <div className="grid grid-cols-2 gap-4">
                  {hasValue(enrichment.telefone) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </div>
                      <p className="text-sm">{String(enrichment.telefone)}</p>
                    </div>
                  )}

                  {hasValue(enrichment.email) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <p className="text-sm">{String(enrichment.email)}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="pt-4">
        <Button variant="outline" size="sm" onClick={fetchBrazilData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            "Refresh Data"
          )}
        </Button>
      </div>
    </div>
  );
}

function CompanyPeople({ company, organizationId }: { company: Business; organizationId: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const companyId = company.business_id || company.id;

  const fetchPeople = useCallback(async (page: number) => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/people/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filters: {
              business_id: [companyId],
            },
            page,
            pageSize,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || data.results || []);
        setTotalElements(data.total || 0);
        setTotalPages(data.total_pages || Math.ceil((data.total || 0) / pageSize));
        setCurrentPage(data.page ?? page);
      }
    } catch {
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, organizationId]);

  useEffect(() => {
    fetchPeople(0);
  }, [fetchPeople]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Company ID is required to search for people</p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No people found for this company</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2">
        <span className="text-sm text-muted-foreground">
          {totalElements.toLocaleString("pt-BR")} people found
        </span>
      </div>

      <div className="flex-1 overflow-auto px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead className="w-[200px]">Job Title</TableHead>
              <TableHead className="w-[150px]">LinkedIn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person, index) => {
              const linkedinUrl = person.linkedin_url || person.linkedin_profile || person.linkedin;
              return (
                <TableRow key={person.id || person.prospect_id || index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 rounded">
                        {person.profile_picture ? (
                          <AvatarImage
                            src={person.profile_picture}
                            alt={getPersonFullName(person)}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="rounded bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {getPersonFullName(person)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate">
                      {person.job_title || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {linkedinUrl ? (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Profile
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
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
    </div>
  );
}

export function CompanyDrawer({ company, open, onOpenChange }: CompanyDrawerProps) {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [activeTab, setActiveTab] = useState<TabType>("details");

  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open, company]);

  if (!company) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[50%] sm:max-w-none flex flex-col p-0">
        <div className="px-6 pt-6">
          <SheetHeader className="pb-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                {getCompanyLogo(company) ? (
                  <AvatarImage
                    src={getCompanyLogo(company)}
                    alt={company.name}
                    className="object-contain"
                  />
                ) : null}
                <AvatarFallback className="rounded-lg bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl">{company.name}</SheetTitle>
                {company.industry && (
                  <SheetDescription className="mt-1">
                    {company.industry}
                  </SheetDescription>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="flex items-center gap-1 mt-4 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === "details"
                  ? "bg-[#30302f] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </span>
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === "people"
                  ? "bg-[#30302f] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                People
              </span>
            </button>
            <button
              onClick={() => setActiveTab("brazil")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === "brazil"
                  ? "bg-[#30302f] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                Brazil
              </span>
            </button>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto">
          {activeTab === "details" && <CompanyDetails company={company} />}
          {activeTab === "people" && <CompanyPeople company={company} organizationId={organizationId} />}
          {activeTab === "brazil" && <CompanyBrazil company={company} organizationId={organizationId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
