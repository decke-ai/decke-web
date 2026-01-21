"use client";

import { useState, useEffect } from "react";
import { BarChart3, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useAuth, SubscriptionStatus } from "@/contexts/auth-context";

type TabType = "usage" | "analytics";
type PeriodType = "week" | "month" | "year";

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

interface ConsumptionRecord {
  id: string;
  transaction: string;
  date: string;
  category: string;
  amount: number;
  expiresAt?: string;
}

const mockConsumptionHistory: ConsumptionRecord[] = [];

const mockMonthlyData = [
  { month: "01/24", company: 0, people: 0, aiTokens: 0 },
  { month: "02/24", company: 0, people: 0, aiTokens: 0 },
  { month: "03/24", company: 0, people: 0, aiTokens: 0 },
  { month: "04/24", company: 0, people: 0, aiTokens: 0 },
  { month: "05/24", company: 0, people: 0, aiTokens: 0 },
  { month: "06/24", company: 0, people: 0, aiTokens: 0 },
  { month: "07/24", company: 0, people: 0, aiTokens: 0 },
  { month: "08/24", company: 0, people: 0, aiTokens: 0 },
  { month: "09/24", company: 0, people: 0, aiTokens: 0 },
  { month: "10/24", company: 0, people: 0, aiTokens: 0 },
  { month: "11/24", company: 0, people: 0, aiTokens: 0 },
  { month: "12/24", company: 0, people: 0, aiTokens: 0 },
];

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

function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: "ACTIVE",
    trialing: "TRIAL",
    canceled: "CANCELED",
    past_due: "PAST DUE",
    grace_period: "GRACE PERIOD",
  };
  return labels[status] || status.toUpperCase();
}

function getStatusClassName(status: SubscriptionStatus): string {
  const classes: Record<SubscriptionStatus, string> = {
    active: "bg-green-100 text-green-700",
    trialing: "bg-blue-100 text-blue-700",
    canceled: "bg-gray-100 text-gray-700",
    past_due: "bg-red-100 text-red-700",
    grace_period: "bg-yellow-100 text-yellow-700",
  };
  return classes[status] || "bg-gray-100 text-gray-700";
}

function BarChart({ data }: { data: typeof mockMonthlyData }) {
  const maxValue = Math.max(...data.map(d => d.company + d.people + d.aiTokens), 1);
  const chartHeight = 200;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-[200px] px-4">
        {data.map((item, index) => {
          const companyHeight = (item.company / maxValue) * chartHeight;
          const peopleHeight = (item.people / maxValue) * chartHeight;
          const aiTokensHeight = (item.aiTokens / maxValue) * chartHeight;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex flex-col-reverse w-full max-w-[40px]">
                <div
                  className="bg-[#1e3a5f] rounded-t-sm"
                  style={{ height: `${companyHeight}px` }}
                />
                <div
                  className="bg-[#3b82f6]"
                  style={{ height: `${peopleHeight}px` }}
                />
                <div
                  className="bg-[#93c5fd] rounded-t-sm"
                  style={{ height: `${aiTokensHeight}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-4 mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-muted-foreground flex-1 text-center">
            {item.month}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#1e3a5f]" />
          <span className="text-sm text-muted-foreground">Company</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
          <span className="text-sm text-muted-foreground">People</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#93c5fd]" />
          <span className="text-sm text-muted-foreground">AI Tokens</span>
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("usage");
  const [chartPeriod, setChartPeriod] = useState<PeriodType>("year");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("30");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchBillingData();
  }, [organization?.id]);

  const filteredHistory = mockConsumptionHistory.filter((record) => {
    if (filterCategory === "all") return true;
    return record.category.toLowerCase() === filterCategory.toLowerCase();
  });

  const subscription = billingData?.subscription;
  const plan = billingData?.plan;

  const creditsUsed = 0;
  const creditsTotal = plan?.monthly_credit || 0;
  const creditsRemaining = creditsTotal - creditsUsed;

  const periodStart = subscription?.status === "trialing"
    ? subscription.trial_start
    : subscription?.current_period_start;
  const periodEnd = subscription?.status === "trialing"
    ? subscription.trial_end
    : subscription?.current_period_end;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="space-y-6">
        <div className="flex rounded-lg bg-muted p-1 border w-fit">
          <button
            onClick={() => setActiveTab("usage")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
              activeTab === "usage"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Credits Usage
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-colors",
              activeTab === "analytics"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Credits Analytics
          </button>
        </div>

        {activeTab === "usage" && (
          <Card>
            <CardHeader>
              <CardTitle>Credits Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-16 pb-6 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-xl font-semibold">{plan?.name || "No plan"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cycle</p>
                  <p className="text-xl font-semibold">
                    {periodStart && periodEnd
                      ? `${formatDate(periodStart)} – ${formatDate(periodEnd)}`
                      : "–"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {subscription ? (
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1",
                      getStatusClassName(subscription.status)
                    )}>
                      {getStatusLabel(subscription.status)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 bg-gray-100 text-gray-700">
                      NO SUBSCRIPTION
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Plan credits</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCredits(creditsUsed)} of {formatCredits(creditsTotal)}
                  </p>
                </div>
                <Progress
                  value={creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xl font-semibold">
                  {formatCredits(creditsRemaining)} remaining
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Credit bundles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    A flexible credit bundles for your needs. Buy credits to enrich data so you can use it whenever you need to. Bundle credits expire after 3 months.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Analytics</h2>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setChartPeriod("week")}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    chartPeriod === "week"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Week
                </button>
                <button
                  onClick={() => setChartPeriod("month")}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    chartPeriod === "month"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Month
                </button>
                <button
                  onClick={() => setChartPeriod("year")}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    chartPeriod === "year"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Year
                </button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <BarChart data={mockMonthlyData} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">History consumption</h2>
                <div className="flex items-center gap-3">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter: All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="load">Load</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="people">People</SelectItem>
                      <SelectItem value="ai tokens">AI Tokens</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Last 30 Days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                      <SelectItem value="365">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  record.amount > 0 ? "bg-green-500" : "bg-blue-500"
                                )}
                              />
                              <div>
                                <p className="font-medium">{record.transaction}</p>
                                <p className="text-xs text-muted-foreground">{record.date}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.category}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className={cn(
                                "font-medium",
                                record.amount > 0 ? "text-green-600" : ""
                              )}>
                                {record.amount > 0 ? "+" : ""}{record.amount.toLocaleString("en-US")}
                              </p>
                              {record.expiresAt && (
                                <p className="text-xs text-muted-foreground">
                                  Expires {record.expiresAt}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
