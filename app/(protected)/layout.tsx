"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Loader2, Home, Search, User, Building2, List, LucideIcon, Coins, Building, Users, Plug, CreditCard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BillingData {
  subscription: {
    id: string;
    status: string;
    plan_id: string;
  } | null;
  plan: {
    id: string;
    name: string;
    monthly_credit: number;
  } | null;
}

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
  { pattern: /^\/organizations\/[^/]+\/lists(\/.*)?$/, config: { title: "Lists", icon: List } },
  { pattern: /^\/organizations\/[^/]+\/integrations$/, config: { title: "Integrations", icon: Plug } },
  { pattern: /^\/organizations\/[^/]+\/billing$/, config: { title: "Billing", icon: CreditCard } },
  { pattern: /^\/organizations\/[^/]+$/, config: { title: "Organization", icon: Building2 } },
];

const PAGE_CONFIG: Record<string, PageConfig> = {
  "/": { title: "Home", icon: Home },
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
  const router = useRouter();
  const { isAuthenticated, isLoading, isCheckingBackend, needsOnboarding, needsSubscription, organization, backendUser } = useAuth();

  const pageConfig = getPageConfig(pathname);
  const PageIcon = pageConfig.icon;

  const STRIPE_BILLING_URL = "https://billing.stripe.com/p/login/dRmaEY7sH6rg3jvb583gk00";

  const [billingData, setBillingData] = useState<BillingData | null>(null);

  useEffect(() => {
    async function fetchBillingData() {
      if (!organization?.id) return;

      try {
        const response = await fetch(`/api/organizations/${organization.id}/billing`);
        if (response.ok) {
          const data = await response.json();
          setBillingData(data);
        }
      } catch {
        // Silent fail
      }
    }

    if (organization?.id) {
      fetchBillingData();
    }
  }, [organization?.id]);

  const creditsUsed = 0;
  const creditsTotal = billingData?.plan?.monthly_credit || 0;
  const creditsRemaining = creditsTotal - creditsUsed;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading || isCheckingBackend) return;
    if (!isAuthenticated) return;

    if (!organization) {
      router.replace("/organizations");
    } else if (needsSubscription) {
      window.location.href = STRIPE_BILLING_URL;
    } else if (needsOnboarding && backendUser) {
      router.replace(`/organizations/${organization.id}/users/${backendUser.id}/onboardings`);
    }
  }, [isLoading, isCheckingBackend, isAuthenticated, needsOnboarding, needsSubscription, organization, backendUser, router]);

  useEffect(() => {
    if (isLoading || isCheckingBackend) return;
    if (!isAuthenticated) return;
    if (needsOnboarding) return;

    if (organization && pathname === "/") {
      router.replace(`/organizations/${organization.id}/searches`);
    }
  }, [isLoading, isCheckingBackend, isAuthenticated, needsOnboarding, organization, pathname, router]);

  if (isLoading || isCheckingBackend) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !organization) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden flex flex-col">
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <PageIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{pageConfig.title}</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-default border rounded-lg px-3 h-9">
                <Coins className="h-4 w-4" />
                <span>
                  <span className="font-medium text-foreground">{creditsRemaining.toLocaleString("en-US")}</span>
                  <span className="mx-1">/</span>
                  <span>{creditsTotal.toLocaleString("en-US")}</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{creditsRemaining.toLocaleString("en-US")} credits remaining of {creditsTotal.toLocaleString("en-US")} available</p>
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
