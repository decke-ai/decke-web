"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, Users, Search, Plus, Upload, FileSpreadsheet, ExternalLink, MoreHorizontal, Trash2, User, Loader2, ChevronLeft, ChevronRight, Type, Calendar, UserCircle2, Settings, ListIcon } from "lucide-react";
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
import { Empty } from "@/components/ui/empty";
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
  total_pages?: number;
  page_number?: number;
  page_size?: number;
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
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

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

  const fetchLists = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("record_type", recordType);
      queryParams.set("page_size", "50");
      queryParams.set("page_number", page.toString());

      const response = await fetch(`/api/organizations/${organizationId}/lists?${queryParams.toString()}`);
      if (response.ok) {
        const data: ListResponse = await response.json();
        const fetchedLists = data.content || data.items || [];
        setLists(fetchedLists);
        setTotalElements(data.total_elements || fetchedLists.length);
        setTotalPages(data.total_pages || Math.ceil((data.total_elements || fetchedLists.length) / 50));
        setCurrentPage(data.page_number ?? page);
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
    fetchLists(0);
  }, [fetchLists]);

  const handleModeChange = (mode: ListMode) => {
    if (mode === listMode) return;
    setListMode(mode);
    setSearchQuery("");
    setCurrentPage(0);
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
        fetchLists(currentPage);
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
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-3">
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

            <span className="text-sm text-muted-foreground border rounded-lg px-3 h-9 flex items-center">
              {(searchQuery ? filteredLists.length : totalElements).toLocaleString("pt-BR")} lists
            </span>
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
                <Button variant="outline" className="h-9">
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

            <Button onClick={handleNewList} className="h-9">
              <Plus className="h-4 w-4" />
              New list
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden relative flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 overflow-auto">
            <Table className="w-max min-w-full">
              <TableHeader className="sticky top-0 z-20 bg-background after:absolute after:left-0 after:bottom-0 after:w-full after:h-px after:bg-border">
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                    <span className="flex items-center gap-1.5">
                      <Type className="h-3 w-3" />
                      Name
                    </span>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Creation date
                    </span>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Last update
                    </span>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                    <span className="flex items-center gap-1.5">
                      <UserCircle2 className="h-3 w-3" />
                      Owner
                    </span>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b w-12">
                    <span className="flex items-center gap-1.5">
                      <Settings className="h-3 w-3" />
                      Actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.length === 0 && !isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-[400px] p-0">
                      <Empty
                        icon={<ListIcon className="h-8 w-8 text-muted-foreground" />}
                        title="No lists yet"
                        description={`Create your first ${listMode === "companies" ? "company" : "people"} list to start organizing your data.`}
                        action={
                          <Button onClick={handleNewList} className="h-9">
                            <Plus className="h-4 w-4" />
                            New list
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLists.map((list) => (
                    <TableRow
                      key={list.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
                      onClick={() => router.push(`/organizations/${organizationId}/lists/${listMode}/${list.id}`)}
                    >
                      <TableCell className="font-medium py-1.5 border-r">{list.name}</TableCell>
                      <TableCell className="py-1.5 border-r">{formatDate(list.created_date)}</TableCell>
                      <TableCell className="py-1.5 border-r">{formatDate(list.updated_date)}</TableCell>
                      <TableCell className="py-1.5 border-r">
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
                      <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
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
                {/* Empty row for bottom border */}
                {filteredLists.length > 0 && (
                  <TableRow className="border-b hover:bg-transparent">
                    <TableCell colSpan={5} className="h-0 p-0" />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {!searchQuery && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLists(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLists(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
