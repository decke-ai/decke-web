"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, Users, Search, Plus, Upload, FileSpreadsheet, ExternalLink, MoreHorizontal, Trash2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ListMode = "companies" | "people";

interface ListItem {
  id: string;
  name: string;
  record_type: string;
  created_date: string;
  updated_date: string;
  created_user_id?: string;
}

interface ListResponse {
  content?: ListItem[];
  items?: ListItem[];
  total_elements?: number;
}

interface UserItem {
  id: string;
  name?: string;
  avatar?: string;
}

interface UsersResponse {
  content?: UserItem[];
  items?: UserItem[];
}

export default function ListsPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [listMode, setListMode] = useState<ListMode>("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [lists, setLists] = useState<ListItem[]>([]);
  const [users, setUsers] = useState<Map<string, UserItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const recordType = listMode === "companies" ? "company" : "person";

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/users`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        const usersList = data.content || data.items || [];
        const usersMap = new Map<string, UserItem>();
        usersList.forEach((user) => {
          usersMap.set(user.id, user);
        });
        setUsers(usersMap);
      }
    } catch {
    }
  }, [organizationId]);

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/lists?record_type=${recordType}`);
      if (response.ok) {
        const data: ListResponse = await response.json();
        setLists(data.content || data.items || []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, recordType]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleModeChange = (mode: ListMode) => {
    if (mode === listMode) return;
    setListMode(mode);
    setSearchQuery("");
  };

  const handleImportCSV = () => {
  };

  const handleImportLinkedIn = () => {
  };

  const handleNewList = () => {
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/lists/${listId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchLists();
      }
    } catch {
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg bg-muted p-1 border">
            <button
              onClick={() => handleModeChange("companies")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                listMode === "companies"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="h-4 w-4" />
              Companies
            </button>
            <button
              onClick={() => handleModeChange("people")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                listMode === "people"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              People
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
                className="pl-9 w-64"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import from CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportLinkedIn}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import from LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleNewList}>
              <Plus className="h-4 w-4" />
              New list
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Creation date</TableHead>
                <TableHead>Last update</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLists.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No lists found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLists.map((list) => (
                  <TableRow
                    key={list.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/organizations/${organizationId}/lists/${listMode}/${list.id}`)}
                  >
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>{formatDate(list.created_date)}</TableCell>
                    <TableCell>{formatDate(list.updated_date)}</TableCell>
                    <TableCell>
                      {list.created_user_id && users.get(list.created_user_id) ? (
                        <Avatar className="h-8 w-8 rounded-lg">
                          {users.get(list.created_user_id)?.avatar && (
                            <AvatarImage
                              src={users.get(list.created_user_id)?.avatar}
                              alt={users.get(list.created_user_id)?.name || "User"}
                              className="rounded-lg"
                            />
                          )}
                          <AvatarFallback className="rounded-lg bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteList(list.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
