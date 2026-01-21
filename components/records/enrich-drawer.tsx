"use client";

import { useState, useMemo } from "react";
import { Mail, Phone, Zap, Search, Cpu, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecordType = "people" | "companies";
export type PhoneEnrichMode = "quick" | "deep";

export interface PeopleEnrichOptions {
  email: boolean;
  phone: boolean;
  phoneMode: PhoneEnrichMode;
}

export interface CompanyEnrichOptions {
  technographics: boolean;
  fundingAcquisition: boolean;
}

export type EnrichOptions = PeopleEnrichOptions | CompanyEnrichOptions;

interface EnrichDrawerPropsBase {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
}

interface PeopleEnrichDrawerProps extends EnrichDrawerPropsBase {
  recordType: "people";
  onEnrich: (options: PeopleEnrichOptions) => void;
}

interface CompanyEnrichDrawerProps extends EnrichDrawerPropsBase {
  recordType: "companies";
  onEnrich: (options: CompanyEnrichOptions) => void;
}

type EnrichDrawerProps = PeopleEnrichDrawerProps | CompanyEnrichDrawerProps;

const PHONE_ENRICH_MODES = [
  { id: "quick" as PhoneEnrichMode, label: "Quick enrich (~5 secs)", credits: 5 },
  { id: "deep" as PhoneEnrichMode, label: "Deep enrich (~10 min)", credits: 10 },
];

export function EnrichDrawer({
  open,
  onOpenChange,
  recordType,
  selectedCount,
  onEnrich,
}: EnrichDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [phoneMode, setPhoneMode] = useState<PhoneEnrichMode>("quick");

  const [technographicsEnabled, setTechnographicsEnabled] = useState(false);
  const [fundingAcquisitionEnabled, setFundingAcquisitionEnabled] = useState(false);

  const emailCredits = 1;
  const phoneCredits = phoneMode === "quick" ? 5 : 10;
  const technographicsCredits = 1;
  const fundingAcquisitionCredits = 1;

  const totalCredits = useMemo(() => {
    if (recordType === "people") {
      let credits = 0;
      if (emailEnabled) credits += emailCredits * selectedCount;
      if (phoneEnabled) credits += phoneCredits * selectedCount;
      return credits;
    } else {
      let credits = 0;
      if (technographicsEnabled) credits += technographicsCredits * selectedCount;
      if (fundingAcquisitionEnabled) credits += fundingAcquisitionCredits * selectedCount;
      return credits;
    }
  }, [recordType, emailEnabled, phoneEnabled, phoneCredits, technographicsEnabled, fundingAcquisitionEnabled, selectedCount]);

  const selectedOptionsCount = useMemo(() => {
    if (recordType === "people") {
      return (emailEnabled ? 1 : 0) + (phoneEnabled ? 1 : 0);
    } else {
      return (technographicsEnabled ? 1 : 0) + (fundingAcquisitionEnabled ? 1 : 0);
    }
  }, [recordType, emailEnabled, phoneEnabled, technographicsEnabled, fundingAcquisitionEnabled]);

  const handleEnrich = () => {
    if (recordType === "people") {
      (onEnrich as (options: PeopleEnrichOptions) => void)({
        email: emailEnabled,
        phone: phoneEnabled,
        phoneMode,
      });
    } else {
      (onEnrich as (options: CompanyEnrichOptions) => void)({
        technographics: technographicsEnabled,
        fundingAcquisition: fundingAcquisitionEnabled,
      });
    }
  };

  const enrichmentLabel = recordType === "people" ? "People enrichment" : "Company enrichment";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-none flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <SheetTitle className="text-xl">Enrich data</SheetTitle>
              <Badge variant="secondary" className="rounded-full">
                {selectedCount} {recordType === "people" ? "contacts" : "companies"} selected
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="pl-9"
            />
          </div>

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-left">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
              <span className="font-medium">{enrichmentLabel}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <span>2 items · <span className="font-medium text-foreground">{selectedOptionsCount} selected</span></span>
              </div>

              {recordType === "people" ? (
                <div className="space-y-3">
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      emailEnabled && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          emailEnabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Mail className={cn(
                            "h-5 w-5",
                            emailEnabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Professional email</span>
                          <Badge variant="secondary" className="text-xs">
                            {emailCredits} / row
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={emailEnabled}
                        onCheckedChange={setEmailEnabled}
                      />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      phoneEnabled && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          phoneEnabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Phone className={cn(
                            "h-5 w-5",
                            phoneEnabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone number</span>
                          <Badge variant="secondary" className="text-xs">
                            ~{phoneCredits} / row
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={phoneEnabled}
                        onCheckedChange={setPhoneEnabled}
                      />
                    </div>

                    {phoneEnabled && (
                      <div className="mt-4 ml-12 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">Select enrichment mode</p>
                        <RadioGroup
                          value={phoneMode}
                          onValueChange={(value) => setPhoneMode(value as PhoneEnrichMode)}
                          className="gap-2"
                        >
                          {PHONE_ENRICH_MODES.map((mode) => (
                            <div key={mode.id} className="flex items-center gap-3">
                              <RadioGroupItem value={mode.id} id={mode.id} />
                              <Label
                                htmlFor={mode.id}
                                className="flex items-center gap-2 cursor-pointer font-normal"
                              >
                                <span>{mode.label}</span>
                                <Badge variant="outline" className="text-xs">
                                  {mode.credits}
                                </Badge>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      technographicsEnabled && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          technographicsEnabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Cpu className={cn(
                            "h-5 w-5",
                            technographicsEnabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Technographics</span>
                          <Badge variant="secondary" className="text-xs">
                            {technographicsCredits} / row
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={technographicsEnabled}
                        onCheckedChange={setTechnographicsEnabled}
                      />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      fundingAcquisitionEnabled && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          fundingAcquisitionEnabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <TrendingUp className={cn(
                            "h-5 w-5",
                            fundingAcquisitionEnabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Funding and acquisition</span>
                          <Badge variant="secondary" className="text-xs">
                            {fundingAcquisitionCredits} / row
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={fundingAcquisitionEnabled}
                        onCheckedChange={setFundingAcquisitionEnabled}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnrich}
            disabled={totalCredits === 0}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Enrich
            <Badge
              variant="secondary"
              className="bg-primary-foreground/20 text-primary-foreground ml-1"
            >
              {totalCredits}
            </Badge>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
