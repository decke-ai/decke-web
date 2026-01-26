"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Search,
  MoreVertical,
  Linkedin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Unplug,
  RefreshCw,
  Settings,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParagon } from "@/hooks/use-paragon";

interface LinkedInAccount {
  id: string;
  name: string;
  subtitle: string;
  avatar?: string;
  accountType: "LinkedIn Free" | "LinkedIn Premium" | "Sales Navigator";
  status: "available" | "needs_attention" | "disconnected";
  requestLimits: string;
  messageLimits: string;
}

export default function LinkedInAccountsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { isReady, isLoading, isConnecting, integrations, connectIntegration } = useParagon();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const linkedInIntegration = integrations.find(
    (i) => i.name.toLowerCase().includes("linkedin")
  );

  const accounts: LinkedInAccount[] = linkedInIntegration?.connected
    ? [
        {
          id: "1",
          name: linkedInIntegration.name,
          subtitle: "Connected via Paragon",
          accountType: "LinkedIn Free",
          status: "available",
          requestLimits: "40/hour",
          messageLimits: "40/hour",
        },
      ]
    : [];

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || account.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalSeats = 3;
  const usedSeats = accounts.length;

  const handleConnectAccount = () => {
    connectIntegration("linkedin");
  };

  const handleBack = () => {
    router.push(`/organizations/${organizationId}/channels`);
  };

  const getStatusBadge = (status: LinkedInAccount["status"]) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case "needs_attention":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs attention
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
            <Unplug className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Linkedin className="h-6 w-6 text-[#0A66C2]" />
          <h1 className="text-xl font-semibold">LinkedIn accounts</h1>
          <Badge variant="secondary">{usedSeats}/{totalSeats} seats used</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="needs_attention">Needs attention</SelectItem>
              <SelectItem value="disconnected">Disconnected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Purchase more seats
          </Button>
          <Button onClick={handleConnectAccount} disabled={isLoading || !isReady || isConnecting}>
            {isConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Linkedin className="h-4 w-4 mr-2" />
            )}
            Connect account
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="w-max min-w-full">
            <TableHeader className="sticky top-0 z-20 bg-card">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Name
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Account type
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Status
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Request limits
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Message limits
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading accounts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-64 align-middle">
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <Linkedin className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">No accounts connected</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your LinkedIn account to start importing contacts.
                        </p>
                      </div>
                      <Button onClick={handleConnectAccount} disabled={isConnecting || !isReady}>
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Connect account
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="border-b">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={account.avatar} />
                          <AvatarFallback>
                            {account.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.subtitle}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                        {account.accountType}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="py-3">{account.requestLimits}</TableCell>
                    <TableCell className="py-3">{account.messageLimits}</TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Unplug className="h-4 w-4 mr-2" />
                            Disconnect
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-sync
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure sending limits
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Clock className="h-4 w-4 mr-2" />
                            Account schedule
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
