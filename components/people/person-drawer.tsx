"use client";

import {
  User,
  Globe,
  ExternalLink,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Wrench,
  Heart,
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
import { Badge } from "@/components/ui/badge";
import { Person } from "@/lib/explorium/types";

interface PersonDrawerProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getPersonFullName = (person: Person): string => {
  if (person.full_name) return person.full_name;
  const parts = [person.first_name, person.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
};

const formatLocation = (person: Person): string => {
  const city = person.city;
  const region = person.region;
  const country = person.country_name || person.country;

  const parts = [city, region, country].filter(Boolean);
  return parts.join(", ") || "-";
};

export function PersonDrawer({ person, open, onOpenChange }: PersonDrawerProps) {
  if (!person) return null;

  const linkedinUrl = person.linkedin_url || person.linkedin_profile || person.linkedin;
  const companyLinkedinUrl = person.company_linkedin_url;
  const experiences = person.experiences || person.experience || person.past_experiences || person.work_experience || [];
  const skills = person.skills || person.skill || [];
  const interests = person.interests || person.interest || person.topics_of_interest || person.personal_interests || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[50%] sm:max-w-none overflow-y-auto">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              {person.profile_picture ? (
                <AvatarImage
                  src={person.profile_picture}
                  alt={getPersonFullName(person)}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{getPersonFullName(person)}</SheetTitle>
              {person.job_title && (
                <SheetDescription className="mt-1">
                  {person.job_title}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-6 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            {person.job_title && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Job Title
                </div>
                <p className="text-sm">{person.job_title}</p>
              </div>
            )}

            {person.company_name && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Company
                </div>
                <p className="text-sm">{person.company_name}</p>
              </div>
            )}

            {formatLocation(person) !== "-" && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <p className="text-sm">{formatLocation(person)}</p>
              </div>
            )}
          </div>

          {experiences.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Experiences
                </div>
                <div className="flex flex-wrap gap-2">
                  {experiences.map((exp, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {skills.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                  Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {interests.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Links</div>

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
                  <p className="text-sm font-medium">LinkedIn Profile</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {linkedinUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}

            {person.company_domain && (
              <a
                href={`https://${person.company_domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Company Website</p>
                  <p className="text-sm text-muted-foreground truncate">{person.company_domain}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}

            {companyLinkedinUrl && (
              <a
                href={companyLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Company LinkedIn</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {companyLinkedinUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
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
