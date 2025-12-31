"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Search, Plus, Upload, FileSpreadsheet, ExternalLink, MoreHorizontal, Trash2, User } from "lucide-react";
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
  createdAt: Date;
  updatedAt: Date;
  owner: {
    name: string;
    picture?: string;
  };
}

// Mock data for demonstration
const mockCompanyLists: ListItem[] = [
  {
    id: "1",
    name: "Tech Startups Brazil",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-20"),
    owner: { name: "John Doe", picture: undefined },
  },
  {
    id: "2",
    name: "Enterprise Clients",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-03-18"),
    owner: { name: "Jane Smith", picture: undefined },
  },
  {
    id: "3",
    name: "Fintech Companies",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-25"),
    owner: { name: "Carlos Silva", picture: undefined },
  },
];

const mockPeopleLists: ListItem[] = [
  {
    id: "1",
    name: "Decision Makers",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-03-22"),
    owner: { name: "John Doe", picture: undefined },
  },
  {
    id: "2",
    name: "HR Directors",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-03-19"),
    owner: { name: "Jane Smith", picture: undefined },
  },
];

export default function ListsPage() {
  const router = useRouter();
  const [listMode, setListMode] = useState<ListMode>("companies");
  const [searchQuery, setSearchQuery] = useState("");

  const handleModeChange = (mode: ListMode) => {
    if (mode === listMode) return;
    setListMode(mode);
    setSearchQuery("");
  };

  const handleImportCSV = () => {
    console.log("Import from CSV");
  };

  const handleImportLinkedIn = () => {
    console.log("Import from LinkedIn");
  };

  const handleNewList = () => {
    console.log("Create new list");
  };

  const handleDeleteList = (listId: string) => {
    console.log("Delete list", listId);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const lists = listMode === "companies" ? mockCompanyLists : mockPeopleLists;
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

        <div className="border rounded-lg overflow-hidden">
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
              {filteredLists.length === 0 ? (
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
                    onClick={() => router.push(`/lists/${listMode}/${list.id}`)}
                  >
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>{formatDate(list.createdAt)}</TableCell>
                    <TableCell>{formatDate(list.updatedAt)}</TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        {list.owner.picture && (
                          <AvatarImage src={list.owner.picture} alt={list.owner.name} />
                        )}
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
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
