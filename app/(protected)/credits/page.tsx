"use client";

import { useState } from "react";
import { BarChart3, CreditCard } from "lucide-react";
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

type TabType = "usage" | "analytics";
type PeriodType = "week" | "month" | "year";

interface PlanInfo {
  name: string;
  cycleStart: string;
  cycleEnd: string;
  status: "ACTIVATED" | "INACTIVE" | "PENDING";
  creditsUsed: number;
  creditsTotal: number;
}

interface ConsumptionRecord {
  id: string;
  transaction: string;
  date: string;
  category: string;
  amount: number;
  expiresAt?: string;
}

const mockPlanInfo: PlanInfo = {
  name: "Growth",
  cycleStart: "October 29",
  cycleEnd: "November 28",
  status: "ACTIVATED",
  creditsUsed: 8500,
  creditsTotal: 10000,
};

const mockConsumptionHistory: ConsumptionRecord[] = [
  {
    id: "1",
    transaction: "Plan credits",
    date: "15/09/2025",
    category: "Load",
    amount: 10000,
    expiresAt: "15/09/2026",
  },
  {
    id: "2",
    transaction: "Bundle credit",
    date: "10/09/2025",
    category: "Load",
    amount: 500,
  },
  {
    id: "3",
    transaction: "Company search",
    date: "08/09/2025",
    category: "Company",
    amount: -150,
  },
  {
    id: "4",
    transaction: "People search",
    date: "05/09/2025",
    category: "People",
    amount: -200,
  },
  {
    id: "5",
    transaction: "AI enrichment",
    date: "01/09/2025",
    category: "AI Tokens",
    amount: -75,
  },
];

const mockMonthlyData = [
  { month: "01/24", company: 2000, people: 3000, aiTokens: 1500 },
  { month: "02/24", company: 2500, people: 4000, aiTokens: 2000 },
  { month: "03/24", company: 3000, people: 5000, aiTokens: 2500 },
  { month: "04/24", company: 2800, people: 4500, aiTokens: 2200 },
  { month: "05/24", company: 3500, people: 5500, aiTokens: 3000 },
  { month: "06/24", company: 4000, people: 6000, aiTokens: 3500 },
  { month: "07/24", company: 4500, people: 7000, aiTokens: 4000 },
  { month: "08/24", company: 5000, people: 8000, aiTokens: 4500 },
  { month: "09/24", company: 4800, people: 7500, aiTokens: 4200 },
  { month: "10/24", company: 5500, people: 8500, aiTokens: 5000 },
  { month: "11/24", company: 6000, people: 9000, aiTokens: 5500 },
  { month: "12/24", company: 6500, people: 9500, aiTokens: 6000 },
];

function BarChart({ data }: { data: typeof mockMonthlyData }) {
  const maxValue = Math.max(...data.map(d => d.company + d.people + d.aiTokens));
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
  const [activeTab, setActiveTab] = useState<TabType>("usage");
  const [chartPeriod, setChartPeriod] = useState<PeriodType>("year");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("30");

  const filteredHistory = mockConsumptionHistory.filter((record) => {
    if (filterCategory === "all") return true;
    return record.category.toLowerCase() === filterCategory.toLowerCase();
  });

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
          <div className="border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-primary">Credits Usage</h2>

            <div className="flex items-start gap-16 pb-6 border-b">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-xl font-semibold">{mockPlanInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cycle</p>
                <p className="text-xl font-semibold">{mockPlanInfo.cycleStart} – {mockPlanInfo.cycleEnd}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1",
                  mockPlanInfo.status === "ACTIVATED" && "bg-green-100 text-green-700",
                  mockPlanInfo.status === "INACTIVE" && "bg-gray-100 text-gray-700",
                  mockPlanInfo.status === "PENDING" && "bg-yellow-100 text-yellow-700"
                )}>
                  {mockPlanInfo.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Plan credits</p>
                <p className="text-sm text-muted-foreground">
                  {mockPlanInfo.creditsUsed.toLocaleString("pt-BR")} of {mockPlanInfo.creditsTotal.toLocaleString("pt-BR")}
                </p>
              </div>
              <Progress
                value={(mockPlanInfo.creditsUsed / mockPlanInfo.creditsTotal) * 100}
                className="h-2"
              />
              <p className="text-xl font-semibold">
                {(mockPlanInfo.creditsTotal - mockPlanInfo.creditsUsed).toLocaleString("pt-BR")} remaining
              </p>
            </div>

            <div className="border rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Credit bundles</h3>
              <p className="text-muted-foreground">
                A flexible credit bundles for your needs. Buy credits to enrich data so you can use it whenever you need to. Bundle credits expire after 3 months.
              </p>
            </div>
          </div>
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

            <div className="border rounded-lg p-6">
              <BarChart data={mockMonthlyData} />
            </div>

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

              <div className="border rounded-lg overflow-hidden">
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
                                {record.amount > 0 ? "+" : ""}{record.amount.toLocaleString("pt-BR")}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
