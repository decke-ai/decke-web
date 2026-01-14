"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const GOALS_OPTIONS = [
  {
    id: "crm",
    title: "Use Decke as my CRM",
    description: "Keep everything in one place by managing your records and deals in Decke",
  },
  {
    id: "campaigns",
    title: "Optimize campaigns with smart sequences and insights",
    description: "Maximize every engagement with AI-powered follow-ups to move deals forward",
  },
  {
    id: "leads",
    title: "Find and get in touch with leads",
    description: "Search our database of 200M+ contacts and test outbound campaigns with AI",
  },
  {
    id: "automations",
    title: "Set automations with Decke to simplify outreach",
    description: "Automatically identify potential new leads and get in touch with them at the right time",
  },
  {
    id: "exploring",
    title: "I'm just exploring Decke",
    description: "",
  },
];

const ROLE_OPTIONS = [
  "Sales Rep",
  "Founder",
  "Marketing",
  "Business Development",
  "Sales Leader",
  "Talent Acquisition",
  "Operations & Support",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  {
    id: "low",
    title: "Low",
    description: "I rarely use sales tech",
  },
  {
    id: "medium",
    title: "Medium",
    description: "I feel comfortable exploring sales tech",
  },
  {
    id: "high",
    title: "High",
    description: "I have confidence when using sales tech",
  },
];

const INDUSTRY_OPTIONS = [
  "IT (SaaS, Cloud, etc.)",
  "Retail",
  "E-commerce",
  "Financial Services",
  "Healthcare & Wellness",
  "Education",
  "Marketing",
  "HR & Recruiting",
  "Logistics & Transportation",
  "Industrial & Manufacturing",
  "Real Estate",
  "Consulting & Professional Services",
  "Other",
];

const ICP_OPTIONS = [
  {
    id: "c-level",
    title: "C-level (CEO, CFO, CMO, etc.)",
    description: "Decision makers with high strategic influence and final budget authority.",
  },
  {
    id: "hr-recruitment",
    title: "HR / Recruitment",
    description: "Talent acquisition and HR leaders focused on hiring tools, benefits, and org growth.",
  },
  {
    id: "directors-managers",
    title: "Directors and Managers",
    description: "Operational leaders who influence tools, processes, and vendor selection.",
  },
  {
    id: "it-engineering",
    title: "IT / Engineering",
    description: "Tech buyers and system owners focused on infrastructure, data, and security.",
  },
  {
    id: "analysts-specialists",
    title: "Analysts and Technical Specialists",
    description: "Hands-on professionals responsible for tool usage and evaluations.",
  },
  {
    id: "sales-marketing",
    title: "Sales and Marketing",
    description: "Revenue roles for outreach, growth, and engagement.",
  },
  {
    id: "founders-owners",
    title: "Founders and Owners",
    description: "Small business owners make purchasing decisions directly.",
  },
  {
    id: "procurement-buying",
    title: "Procurement / Buying",
    description: "Stakeholders manage contracts, vendor negotiations, and purchases.",
  },
];

type OnboardingData = {
  goals: string[];
  role: string;
  customRole: string;
  experience: string;
  industry: string[];
  icp: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: isAuthLoading, isAuthenticated, refreshUser } = useAuth();

  const organizationId = params.organizationId as string;
  const userId = params.userId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    role: "",
    customRole: "",
    experience: "",
    industry: [],
    icp: [],
  });

  const totalSteps = 5;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && (!organizationId || !userId)) {
      router.replace("/organizations");
    }
  }, [isAuthLoading, isAuthenticated, organizationId, userId, router]);

  const handleGoalToggle = (goalId: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const handleRoleSelect = (role: string) => {
    setData((prev) => ({
      ...prev,
      role,
      customRole: role === "Other" ? prev.customRole : "",
    }));
  };

  const handleExperienceSelect = (experience: string) => {
    setData((prev) => ({ ...prev, experience }));
  };

  const handleIndustryToggle = (industry: string) => {
    setData((prev) => ({
      ...prev,
      industry: prev.industry.includes(industry)
        ? prev.industry.filter((i) => i !== industry)
        : [...prev.industry, industry],
    }));
  };

  const handleIcpToggle = (icpId: string) => {
    setData((prev) => ({
      ...prev,
      icp: prev.icp.includes(icpId)
        ? prev.icp.filter((i) => i !== icpId)
        : [...prev.icp, icpId],
    }));
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0:
        return data.goals.length > 0;
      case 1:
        return data.role && (data.role !== "Other" || data.customRole.trim());
      case 2:
        return !!data.experience;
      case 3:
        return data.industry.length > 0;
      case 4:
        return data.icp.length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/authentication/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: userId,
          onboarding: {
            goals: data.goals,
            role: data.role === "Other" ? data.customRole : data.role,
            experience_level: data.experience,
            industry: data.industry,
            icp: data.icp,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save onboarding data");
      }

      await refreshUser();
      window.location.href = `/organizations/${organizationId}/searches`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || !organizationId || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = "/auth/logout"}>
          Sign out
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="h-1 bg-muted rounded-full mb-12 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-primary mb-2">
                What would you like to do with Decke
              </h1>
              <p className="text-muted-foreground">
                We'll use your input to recommend the best strategy to reach your goals.
                Select all that apply
              </p>
            </div>
            <div className="space-y-3">
              {GOALS_OPTIONS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    data.goals.includes(goal.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{goal.title}</div>
                  {goal.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-primary mb-2">
                What best describes you
              </h1>
              <p className="text-muted-foreground">
                We'll use this information to recommend the most relevant features for you
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all text-sm",
                    data.role === role
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            {data.role === "Other" && (
              <div className="max-w-md mx-auto">
                <Input
                  placeholder="Insert your role"
                  value={data.customRole}
                  onChange={(e) => setData((prev) => ({ ...prev, customRole: e.target.value }))}
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-primary mb-2">
                What's your level of experience using sales tech
              </h1>
              <p className="text-muted-foreground">
                We'll use this information to recommend the most relevant features for you
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {EXPERIENCE_OPTIONS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => handleExperienceSelect(exp.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-center",
                    data.experience === exp.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex justify-center mb-3">
                    {exp.id === "low" && (
                      <div className="flex items-end gap-1 h-8">
                        <div className="w-2 h-3 bg-primary rounded-sm" />
                        <div className="w-2 h-5 bg-muted rounded-sm" />
                        <div className="w-2 h-8 bg-muted rounded-sm" />
                      </div>
                    )}
                    {exp.id === "medium" && (
                      <div className="flex items-end gap-1 h-8">
                        <div className="w-2 h-3 bg-primary rounded-sm" />
                        <div className="w-2 h-5 bg-primary rounded-sm" />
                        <div className="w-2 h-8 bg-muted rounded-sm" />
                      </div>
                    )}
                    {exp.id === "high" && (
                      <div className="flex items-end gap-1 h-8">
                        <div className="w-2 h-3 bg-primary rounded-sm" />
                        <div className="w-2 h-5 bg-primary rounded-sm" />
                        <div className="w-2 h-8 bg-primary rounded-sm" />
                      </div>
                    )}
                  </div>
                  <div className="font-medium">{exp.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {exp.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-primary mb-2">
                What is your company's industry?
              </h1>
              <p className="text-muted-foreground">
                Choose the option that best represents your company's sector — this helps
                tailor search filters and AI suggestions.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {INDUSTRY_OPTIONS.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  onClick={() => handleIndustryToggle(industry)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all text-sm",
                    data.industry.includes(industry)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-primary mb-2">
                Who is your ideal customer? (ICP)
              </h1>
              <p className="text-muted-foreground">
                This helps Decke tailor search results, campaign targeting, and AI message
                generation. You can select multiple options.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ICP_OPTIONS.map((icp) => (
                <button
                  key={icp.id}
                  type="button"
                  onClick={() => handleIcpToggle(icp.id)}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-all",
                    data.icp.includes(icp.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium text-sm">{icp.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {icp.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canContinue() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === totalSteps - 1 ? (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
