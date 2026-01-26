"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Unplug,
  RefreshCw,
  Settings,
} from "lucide-react";
import { FaHubspot } from "react-icons/fa";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useParagon } from "@/hooks/use-paragon";
import { toast } from "sonner";

interface Integration {
  id: string;
  integration_type: string;
  level: string;
  enabled: boolean;
  credential_status: "VALID" | "INVALID";
  sync_status: "idle" | "syncing" | "success" | "error";
  last_sync_date?: string;
  last_sync_error?: string;
  metadata?: Record<string, unknown>;
  provider_data?: Record<string, unknown>;
  provider_id?: string;
  created_date: string;
}

export default function HubSpotAccountsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { isReady, isConnecting, connectIntegration, isIntegrationConnected } = useParagon();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations?integration_type=hubspot`
      );
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.content || []);
      }
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const filteredIntegrations = integrations.filter((integration) => {
    const name = (integration.metadata?.name as string) || integration.integration_type;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "available" && integration.credential_status === "VALID") ||
      (filterStatus === "needs_attention" && integration.credential_status === "INVALID") ||
      (filterStatus === "syncing" && integration.sync_status === "syncing");
    return matchesSearch && matchesFilter;
  });

  const handleConnectAccount = async () => {
    try {
      const alreadyConnectedInParagon = isIntegrationConnected("hubspot");

      if (!alreadyConnectedInParagon) {
        const connected = await connectIntegration("hubspot");
        if (!connected) {
          return;
        }
      }

      const response = await fetch(`/api/organizations/${organizationId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integration_type: "hubspot",
          level: "organization",
          metadata: {},
          provider_data: {},
        }),
      });

      if (response.ok) {
        toast.success("HubSpot connected successfully");
        fetchIntegrations();
      } else {
        toast.error("Failed to save integration");
      }
    } catch {
      toast.error("Failed to connect HubSpot");
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integrationId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Integration disconnected");
        fetchIntegrations();
      } else {
        toast.error("Failed to disconnect integration");
      }
    } catch {
      toast.error("Failed to disconnect integration");
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      setIsSyncing(integration.id);
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}/syncs`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential_status: integration.credential_status || "VALID",
            enabled: integration.enabled,
            provider_id: integration.provider_id || "",
          }),
        }
      );

      if (response.ok) {
        toast.success("Sync started");
        fetchIntegrations();
      } else {
        toast.error("Failed to start sync");
      }
    } catch {
      toast.error("Failed to start sync");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleBack = () => {
    router.push(`/organizations/${organizationId}/integrations`);
  };

  const getStatusBadge = (integration: Integration) => {
    if (integration.credential_status === "INVALID") {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Needs attention
        </Badge>
      );
    }
    if (integration.sync_status === "syncing") {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      );
    }
    if (integration.sync_status === "error") {
      return (
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    );
  };

  const getSyncStatusText = (integration: Integration) => {
    switch (integration.sync_status) {
      case "syncing":
        return "Syncing...";
      case "success":
        return "Synced";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <FaHubspot className="h-6 w-6 text-[#ff7a59]" />
          <h1 className="text-xl font-semibold">HubSpot accounts</h1>
          <Badge variant="secondary">{integrations.length} connected</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Connected</SelectItem>
              <SelectItem value="needs_attention">Needs attention</SelectItem>
              <SelectItem value="syncing">Syncing</SelectItem>
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
          <Button onClick={handleConnectAccount} disabled={!isReady || isConnecting}>
            {isConnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FaHubspot className="h-4 w-4 mr-2" />
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
                  Account
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Status
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Sync status
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Last sync
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-card">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading accounts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIntegrations.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-64 align-middle">
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <FaHubspot className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">No accounts connected</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your HubSpot account to sync your CRM data.
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
                filteredIntegrations.map((integration) => {
                  const name = (integration.metadata?.name as string) || "HubSpot Account";
                  return (
                    <TableRow key={integration.id} className="border-b">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <FaHubspot className="h-5 w-5 text-[#ff7a59]" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(integration.created_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">{getStatusBadge(integration)}</TableCell>
                      <TableCell className="py-3">{getSyncStatusText(integration)}</TableCell>
                      <TableCell className="py-3">{formatLastSync(integration.last_sync_date)}</TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleSync(integration)}
                              disabled={isSyncing === integration.id || integration.sync_status === "syncing"}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === integration.id ? "animate-spin" : ""}`} />
                              {isSyncing === integration.id ? "Syncing..." : "Sync now"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDisconnect(integration.id)}
                              className="text-destructive"
                            >
                              <Unplug className="h-4 w-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
