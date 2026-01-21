"use client";

import { Plus, ShoppingCart, Linkedin, MessageCircle, ChevronDown, Loader2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Empty } from "@/components/ui/empty";
import { useParagon } from "@/hooks/use-paragon";

export default function IntegrationsPage() {
  const { isReady, isLoading, isConnecting, integrations, error, connectIntegration } = useParagon();

  const handleConnectLinkedIn = () => {
    connectIntegration("linkedin");
  };


  const handlePurchaseSeats = () => {
  };

  const linkedInIntegration = integrations.find(
    (i) => i.name.toLowerCase().includes("linkedin")
  );

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-end h-10 flex-shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9" disabled={isLoading || !isReady || isConnecting}>
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Connect account
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleConnectLinkedIn}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
                <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="h-9" onClick={handlePurchaseSeats}>
            <ShoppingCart className="h-4 w-4" />
            Purchase more seats
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="w-max min-w-full">
            <TableHeader className="sticky top-0 z-20 bg-card after:absolute after:left-0 after:bottom-0 after:w-full after:h-px after:bg-border">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-card border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                  Account
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-card border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                  Type
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-card border-b after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                  Status
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-card border-b">
                  Connected at
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading integrations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0">
                    <Empty
                      icon={<Plug className="h-8 w-8 text-muted-foreground" />}
                      title="Failed to load integrations"
                      description={error}
                    />
                  </TableCell>
                </TableRow>
              ) : integrations.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-[calc(100vh-220px)] align-middle">
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <Plug className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">No accounts connected</p>
                        <p className="text-sm text-muted-foreground">Connect an account to start using integrations.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                integrations.map((integration) => (
                  <TableRow key={integration.id} className="border-b">
                    <TableCell className="py-1.5 border-r font-medium">
                      <div className="flex items-center gap-2">
                        {integration.name.toLowerCase().includes("linkedin") ? (
                          <Linkedin className="h-4 w-4" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        {integration.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 border-r">
                      {integration.name.toLowerCase().includes("linkedin") ? "LinkedIn" : integration.name}
                    </TableCell>
                    <TableCell className="py-1.5 border-r">
                      <span className={integration.connected ? "text-green-600" : "text-muted-foreground"}>
                        {integration.connected ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      -
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
