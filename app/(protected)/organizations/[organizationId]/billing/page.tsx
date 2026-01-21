"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@/contexts/auth-context";

interface Plan {
  id: string;
  name: string;
  description?: string;
  features: string[];
  monthly_credit: number;
  monthly_price: number;
}

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan_id: string;
  trial_start?: string | null;
  trial_end?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
}

interface BillingData {
  subscription: Subscription | null;
  plan: Plan | null;
}

const STRIPE_BILLING_URL = "https://billing.stripe.com/p/login/dRmaEY7sH6rg3jvb583gk00";

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCredits(credits: number): string {
  return credits.toLocaleString("en-US");
}

function getStatusBadge(status: SubscriptionStatus) {
  const statusConfig: Record<SubscriptionStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-700 border-blue-200" },
    canceled: { label: "Canceled", className: "bg-gray-100 text-gray-700 border-gray-200" },
    past_due: { label: "Past Due", className: "bg-red-100 text-red-700 border-red-200" },
    grace_period: { label: "Grace Period", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };

  const config = statusConfig[status] || statusConfig.canceled;
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function BillingPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/billing`);
        if (!response.ok) {
          throw new Error("Failed to fetch billing data");
        }
        const data = await response.json();
        setBillingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (organizationId) {
      fetchBillingData();
    }
  }, [organizationId]);

  const handleManagePlan = () => {
    window.open(STRIPE_BILLING_URL, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const { subscription, plan } = billingData || {};

  if (!subscription || !plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">No subscription found</p>
        <Button onClick={handleManagePlan}>
          Subscribe
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  const periodStart = subscription.status === "trialing"
    ? subscription.trial_start
    : subscription.current_period_start;
  const periodEnd = subscription.status === "trialing"
    ? subscription.trial_end
    : subscription.current_period_end;

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            {getStatusBadge(subscription.status)}
          </div>
          {periodStart && periodEnd && (
            <p className="text-sm text-muted-foreground">
              {formatDate(periodStart)} - {formatDate(periodEnd)}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-2xl font-semibold">
              {formatCredits(plan.monthly_credit)} credits per month
            </p>
          </div>

          {plan.features && plan.features.length > 0 && (
            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-green-100 p-1">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={handleManagePlan} className="w-full">
            Manage Plan
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
