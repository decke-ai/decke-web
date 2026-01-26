"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { FaHubspot } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ExportRecordType = "people" | "companies";

interface Integration {
  id: string;
  integration_type: string;
  enabled: boolean;
  credential_status: "VALID" | "INVALID";
}

interface ExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  recordType: ExportRecordType;
  selectedRecords: Array<{
    id: string;
    [key: string]: unknown;
  }>;
  onExportComplete?: () => void;
}

export function ExportDrawer({
  open,
  onOpenChange,
  organizationId,
  recordType,
  selectedRecords,
  onExportComplete,
}: ExportDrawerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [exportResults, setExportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations?enabled=true`
      );
      if (response.ok) {
        const data = await response.json();
        const validIntegrations = (data.content || []).filter(
          (i: Integration) => i.credential_status === "VALID"
        );
        setIntegrations(validIntegrations);
      }
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open) {
      fetchIntegrations();
      setExportResults(null);
      setSelectedIntegration(null);
    }
  }, [open, fetchIntegrations]);

  const handleExport = async () => {
    if (!selectedIntegration) return;

    setIsExporting(true);
    setExportResults(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${selectedIntegration.integration_type}/exports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            record_ids: selectedRecords.map((r) => r.id),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const successCount = recordType === "companies"
          ? (data.companies_created || 0) + (data.companies_updated || 0)
          : (data.contacts_created || 0) + (data.contacts_updated || 0);
        const createdCount = recordType === "companies" ? data.companies_created : data.contacts_created;
        const updatedCount = recordType === "companies" ? data.companies_updated : data.contacts_updated;

        setExportResults({
          success: successCount,
          failed: data.errors?.length || 0,
          errors: data.errors || [],
        });

        const resultParts = [];
        if (createdCount > 0) resultParts.push(`${createdCount} created`);
        if (updatedCount > 0) resultParts.push(`${updatedCount} updated`);

        toast.success(`Export completed: ${resultParts.join(", ")} in ${getIntegrationName(selectedIntegration.integration_type)}`);
        if (onExportComplete) {
          onExportComplete();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Export failed" }));
        setExportResults({
          success: 0,
          failed: selectedRecords.length,
          errors: [errorData.error || "Export failed"],
        });
        toast.error(errorData.error || "Failed to export records");
      }
    } catch {
      setExportResults({
        success: 0,
        failed: selectedRecords.length,
        errors: ["Failed to connect to server"],
      });
      toast.error("Failed to export records");
    } finally {
      setIsExporting(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "hubspot":
        return <FaHubspot className="h-5 w-5 text-[#ff7a59]" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const getIntegrationName = (type: string) => {
    switch (type) {
      case "hubspot":
        return "HubSpot";
      case "salesforce":
        return "Salesforce";
      default:
        return type;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-none flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              <SheetTitle className="text-xl">Export to CRM</SheetTitle>
              <Badge variant="secondary" className="rounded-full">
                {selectedRecords.length} {recordType === "people" ? "contacts" : "companies"} selected
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No integrations available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a CRM integration in Settings to export records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Select a CRM to export the selected {recordType}:
              </p>

              {integrations.map((integration) => {
                const isSelected = selectedIntegration?.id === integration.id;

                return (
                  <button
                    key={integration.id}
                    onClick={() => setSelectedIntegration(integration)}
                    disabled={isExporting}
                    className={cn(
                      "w-full rounded-lg border p-4 transition-colors text-left",
                      isSelected && "border-primary bg-primary/5",
                      !isSelected && "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                          {getIntegrationIcon(integration.integration_type)}
                        </div>
                        <div>
                          <span className="font-medium">
                            {getIntegrationName(integration.integration_type)}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {exportResults && (
            <div className="mt-6 p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium mb-2">Export Results</h4>
              <div className="space-y-2 text-sm">
                {exportResults.success > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {exportResults.success} {recordType === "people" ? "contacts" : "companies"} exported successfully
                  </div>
                )}
                {exportResults.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {exportResults.failed} {recordType === "people" ? "contacts" : "companies"} failed to export
                  </div>
                )}
                {exportResults.errors.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {exportResults.errors.slice(0, 3).map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {exportResults ? "Close" : "Cancel"}
          </Button>
          {!exportResults && (
            <Button
              onClick={handleExport}
              disabled={!selectedIntegration || isExporting || selectedRecords.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Export
                  <Badge
                    variant="secondary"
                    className="bg-primary-foreground/20 text-primary-foreground ml-1"
                  >
                    {selectedRecords.length}
                  </Badge>
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
