"use client";

import { useState, useEffect, useCallback } from "react";
import { Info, Users, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Business, Person } from "@/lib/explorium/types";

interface List {
  id: string;
  name: string;
}

interface SaveToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedIds: string[];
  selectedItems: Business[] | Person[];
  entityType: "companies" | "people";
  organizationId: string;
  onSaveSuccess?: () => void;
}

function mapCompanyToValues(company: Business): Record<string, unknown> {
  return {
    // Company fields with company_ prefix for backend
    company_name: company.name,
    company_domain: company.domain,
    company_website: company.website,
    company_description: company.business_description || company.description,
    company_industry: company.linkedin_industry_category || company.industry,
    company_sub_industry: company.sub_industry,
    company_linkedin_category: company.linkedin_industry_category,
    company_employees: company.number_of_employees_range || company.employee_range,
    company_employee_count: company.employee_count,
    company_revenue_range: company.yearly_revenue_range || company.revenue_range,
    company_revenue: company.revenue,
    company_founded_year: company.founded_year,
    company_city_name: company.city_name || company.address?.city,
    company_state_region_name: company.state_region_name || company.address?.state,
    company_country_name: company.country_name || company.address?.country,
    company_country_code: company.address?.country_code,
    company_postal_code: company.address?.postal_code,
    company_street: company.address?.street,
    company_linkedin_url: company.linkedin_company_url || company.linkedin_url,
    company_facebook_url: company.facebook_url,
    company_twitter_url: company.twitter_url,
    company_avatar: company.logo || company.logo_url,
    company_phone: company.phone,
    company_email: company.email,
    company_technologies: company.technologies,
    company_keywords: company.keywords,

    // Legacy fields for backward compatibility
    name: company.name,
    domain: company.domain,
    website: company.website,
    business_description: company.business_description || company.description,
    description: company.description || company.business_description,
    industry: company.industry,
    sub_industry: company.sub_industry,
    linkedin_industry_category: company.linkedin_industry_category,
    number_of_employees_range: company.number_of_employees_range || company.employee_range,
    employee_range: company.employee_range || company.number_of_employees_range,
    employee_count: company.employee_count,
    yearly_revenue_range: company.yearly_revenue_range || company.revenue_range,
    revenue_range: company.revenue_range || company.yearly_revenue_range,
    revenue: company.revenue,
    founded_year: company.founded_year,
    city_name: company.city_name || company.address?.city,
    city: company.address?.city || company.city_name,
    state_region_name: company.state_region_name || company.address?.state,
    state: company.address?.state || company.state_region_name,
    region: company.address?.state || company.state_region_name,
    country_name: company.country_name || company.address?.country,
    country: company.address?.country || company.country_name,
    country_code: company.address?.country_code,
    postal_code: company.address?.postal_code,
    street: company.address?.street,
    linkedin_company_url: company.linkedin_company_url || company.linkedin_url,
    linkedin_url: company.linkedin_url || company.linkedin_company_url,
    facebook_url: company.facebook_url,
    twitter_url: company.twitter_url,
    logo: company.logo || company.logo_url,
    logo_url: company.logo_url || company.logo,
    phone: company.phone,
    email: company.email,
    technologies: company.technologies,
    keywords: company.keywords,
  };
}

function mapPersonToValues(person: Person): Record<string, unknown> {
  const fullName = person.full_name || `${person.first_name || ""} ${person.last_name || ""}`.trim();
  const linkedinUrl = person.linkedin_url || person.linkedin_profile || person.linkedin || "";
  const skills = person.skills || person.skill || [];
  const experiences = person.experiences || person.experience || person.past_experiences || person.work_experience || [];
  const interests = person.interests || person.interest || person.topics_of_interest || person.personal_interests || [];

  return {
    // Person fields (with person_ prefix for backend)
    person_name: fullName,
    person_first_name: person.first_name,
    person_last_name: person.last_name,
    person_job_title: person.job_title,
    person_job_level: person.job_level,
    person_job_department: person.job_department,
    person_city_name: person.city,
    person_region_name: person.region,
    person_country_name: person.country_name || person.country,
    person_linkedin_url: linkedinUrl,
    person_profile_picture: person.profile_picture,
    person_skills: skills,
    person_experiences: experiences,
    person_interests: interests,
    person_company_name: person.company_name,
    person_company_domain: person.company_domain,
    person_company_linkedin_url: person.company_linkedin_url,

    // Company fields (with company_ prefix for backend)
    company_name: person.company_name,
    company_domain: person.company_domain,
    company_linkedin_url: person.company_linkedin_url,
    company_avatar: person.company_logo,
    business_id: person.business_id,

    // Legacy fields (for backward compatibility)
    first_name: person.first_name,
    last_name: person.last_name,
    full_name: fullName,
    job_title: person.job_title,
    city: person.city,
    region: person.region,
    country_name: person.country_name || person.country,
    linkedin_url: linkedinUrl,
    profile_picture: person.profile_picture,
    skills: skills,
    experiences: experiences,
    interests: interests,
  };
}

export function SaveToListDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedIds,
  selectedItems,
  entityType,
  organizationId,
  onSaveSuccess,
}: SaveToListDialogProps) {
  const [addToList, setAddToList] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  const recordType = entityType === "companies" ? "company" : "person";

  const fetchLists = useCallback(async () => {
    setIsLoadingLists(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/lists?record_type=${recordType}`);
      if (response.ok) {
        const data = await response.json();
        setLists(data.content || data.items || []);
      }
    } catch {
    } finally {
      setIsLoadingLists(false);
    }
  }, [organizationId, recordType]);

  useEffect(() => {
    if (open) {
      fetchLists();
    }
  }, [open, fetchLists]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsCreatingList(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName.trim(),
          record_type: recordType,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to create list");
        return;
      }

      const newList = await response.json();
      setLists((prev) => [...prev, newList]);
      setSelectedListId(newList.id);
      setNewListName("");
      setShowCreateList(false);
      toast.success("List created successfully");
    } catch {
      toast.error("Failed to create list");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const items = selectedItems.map((item) => {
        const id = entityType === "companies"
          ? (item as Business).business_id || (item as Business).id
          : (item as Person).prospect_id || (item as Person).id;
        const values = entityType === "companies"
          ? mapCompanyToValues(item as Business)
          : mapPersonToValues(item as Person);
        return { id, values };
      });

      for (const item of items) {
        const recordsResponse = await fetch(`/api/organizations/${organizationId}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            record_type: recordType,
            values: item.values,
          }),
        });

        if (!recordsResponse.ok) {
          const errorData = await recordsResponse.json();
          if (recordsResponse.status !== 409 && !errorData?.error?.includes("already exists")) {
            continue;
          }
        }
      }

      if (addToList && selectedListId) {
        const response = await fetch(`/api/organizations/${organizationId}/lists/${selectedListId}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              values: item.values,
            })),
          }),
        });

        if (!response.ok) {
          toast.error("Failed to add items to list");
          return;
        }
      }

      toast.success(`${selectedCount} ${entityLabel} saved successfully`);
      onSaveSuccess?.();
      onOpenChange(false);
      resetState();
    } catch {
      toast.error("Failed to save items");
    } finally {
      setIsSaving(false);
    }
  };

  const resetState = () => {
    setAddToList(false);
    setSelectedListId("");
    setShowCreateList(false);
    setNewListName("");
    setLists([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const entityLabel = entityType === "companies" ? "companies" : "contacts";
  const hasLists = lists.length > 0;

  return (
    <>
      <Dialog open={open && !showCreateList} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Save</DialogTitle>
            <DialogDescription>
              Choose how you want to save your results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {selectedCount} {entityLabel} selected
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                These {entityLabel} will be added to Records
              </span>
              <span className="ml-auto text-green-500">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={addToList}
                  onCheckedChange={setAddToList}
                />
                <span className="text-sm">Add to a list</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>

              {addToList && (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedListId}
                    onValueChange={setSelectedListId}
                    disabled={isLoadingLists || !hasLists}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue
                        placeholder={
                          isLoadingLists
                            ? "Loading..."
                            : hasLists
                              ? "Select..."
                              : "No lists available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowCreateList(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (addToList && !selectedListId)}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Create new list</DialogTitle>
            <DialogDescription>
              Create a new list to add the results to.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Input
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateList();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateList(false);
                setNewListName("");
              }}
              disabled={isCreatingList}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={isCreatingList || !newListName.trim()}
            >
              {isCreatingList && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
