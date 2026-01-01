"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Loader2, Home, Search, User, Building2, List, LucideIcon, Coins, Building, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageConfig {
  title: string;
  icon: LucideIcon;
}

interface PagePattern {
  pattern: RegExp;
  config: PageConfig;
}

const PAGE_PATTERNS: PagePattern[] = [
  { pattern: /^\/organizations\/[^/]+\/records\/companies$/, config: { title: "Companies", icon: Building } },
  { pattern: /^\/organizations\/[^/]+\/records\/people$/, config: { title: "People", icon: Users } },
  { pattern: /^\/organizations\/[^/]+\/searches$/, config: { title: "Searches", icon: Search } },
  { pattern: /^\/organizations\/[^/]+$/, config: { title: "Organization", icon: Building2 } },
];

const PAGE_CONFIG: Record<string, PageConfig> = {
  "/": { title: "Home", icon: Home },
  "/lists": { title: "Lists", icon: List },
  "/account": { title: "Account", icon: User },
  "/credits": { title: "Credits", icon: Coins },
};

function getPageConfig(pathname: string): PageConfig {
  if (PAGE_CONFIG[pathname]) {
    return PAGE_CONFIG[pathname];
  }

  for (const { pattern, config } of PAGE_PATTERNS) {
    if (pattern.test(pathname)) {
      return config;
    }
  }

  return { title: "Page", icon: Home };
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const pageConfig = getPageConfig(pathname);
  const PageIcon = pageConfig.icon;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <PageIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{pageConfig.title}</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-default border rounded-lg px-3 h-9">
                <Coins className="h-4 w-4" />
                <span>
                  <span className="font-medium text-foreground">8.500</span>
                  <span className="mx-1">/</span>
                  <span>10.000</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>8.500 credits used of 10.000 available</p>
            </TooltipContent>
          </Tooltip>
        </header>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
