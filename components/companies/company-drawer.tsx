"use client";

import {
  Building2,
  Globe,
  ExternalLink,
  MapPin,
  Users,
  DollarSign,
  Factory,
  FileText,
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
import { Business } from "@/lib/explorium/types";

interface CompanyDrawerProps {
  company: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CompanyDrawer({ company, open, onOpenChange }: CompanyDrawerProps) {
  if (!company) return null;

  const description = company.business_description || company.description;
  const linkedinUrl = company.linkedin_company_url || company.linkedin_url;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
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

        <Separator className="my-4" />

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
      </SheetContent>
    </Sheet>
  );
}
