"use client";

import { useState, useEffect } from "react";
import { Info, Users, Plus, Loader2 } from "lucide-react";
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
    name: company.name,
    domain: company.domain,
    business_description: company.business_description || company.description,
    industry: company.industry,
    number_of_employees_range: company.number_of_employees_range || company.employee_range,
    yearly_revenue_range: company.yearly_revenue_range || company.revenue_range,
    city_name: company.city_name || company.address?.city,
    state_region_name: company.state_region_name || company.address?.state,
    country_name: company.country_name || company.address?.country,
    linkedin_company_url: company.linkedin_company_url || company.linkedin_url,
  };
}

function mapPersonToValues(person: Person): Record<string, unknown> {
  return {
    first_name: person.first_name,
    last_name: person.last_name,
    full_name: person.full_name,
    job_title: person.job_title,
    job_level: person.job_level,
    job_department: person.job_department,
    company_name: person.company_name,
    company_domain: person.company_domain,
    company_linkedin_url: person.company_linkedin_url,
    city: person.city,
    region: person.region,
    country_name: person.country_name || person.country,
    linkedin_url: person.linkedin_url,
    skills: person.skills,
    experiences: person.experiences,
    interests: person.interests,
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

  useEffect(() => {
    if (open && addToList) {
      fetchLists();
    }
  }, [open, addToList, entityType]);

  const fetchLists = async () => {
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
  };

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
        return;
      }

      const newList = await response.json();
      setLists((prev) => [...prev, newList]);
      setSelectedListId(newList.id);
      setNewListName("");
      setShowCreateList(false);
    } catch {
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
        return { record_id: id, values };
      });

      const recordsResponse = await fetch(`/api/organizations/${organizationId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: recordType,
          items,
        }),
      });

      if (!recordsResponse.ok) {
        return;
      }

      if (addToList && selectedListId) {
        const response = await fetch(`/api/organizations/${organizationId}/lists/${selectedListId}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
          }),
        });

        if (!response.ok) {
          return;
        }
      }

      onSaveSuccess?.();
      onOpenChange(false);
      resetState();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const resetState = () => {
    setAddToList(false);
    setSelectedListId("");
    setShowCreateList(false);
    setNewListName("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const entityLabel = entityType === "companies" ? "companies" : "contacts";

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
                    disabled={isLoadingLists}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={isLoadingLists ? "Loading..." : "Select..."} />
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
