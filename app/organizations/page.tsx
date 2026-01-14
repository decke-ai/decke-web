"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Building2, ArrowRight, Upload } from "lucide-react";

export default function NewOrganizationPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isCheckingBackend, isAuthenticated, needsOnboarding, organization, backendUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organizationName, setOrganizationName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domain = user?.email?.split("@")[1] || "";

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    const handleRedirect = async () => {
      if (isAuthLoading || isCheckingBackend) return;
      if (!isAuthenticated) return;
      if (!organization) return;

      if (!needsOnboarding) {
        router.replace(`/organizations/${organization.id}/searches`);
      } else if (backendUser) {
        router.replace(`/organizations/${organization.id}/users/${backendUser.id}/onboardings`);
      } else {
        try {
          const response = await fetch("/api/authentication/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organization_id: organization.id }),
          });
          if (response.ok) {
            const data = await response.json();
            router.replace(`/organizations/${organization.id}/users/${data.user_id}/onboardings`);
          }
        } catch (err) {
          console.error("Failed to create user:", err);
        }
      }
    };
    handleRedirect();
  }, [isAuthLoading, isCheckingBackend, isAuthenticated, needsOnboarding, organization, backendUser, router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/authentication/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_name: organizationName.trim(),
          organization_logo: logoPreview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      const data = await response.json();

      if (data.stripe_checkout_url) {
        window.location.href = data.stripe_checkout_url;
      } else if (data.organization_id && data.user_id) {
        router.push(`/organizations/${data.organization_id}/users/${data.user_id}/onboardings`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isCheckingBackend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = "/auth/logout"}>
          Sign out
        </Button>
      </div>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome to Decke!
          </h1>
          <p className="text-muted-foreground">
            First, we need to setup your company details. Just fill in your
            company information and let us do the rest!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-background rounded-2xl border p-8">
            <div className="flex gap-8">
              <div className="flex flex-col items-center gap-4">
                <Label className="text-sm font-medium">Company logo</Label>
                <div
                  className="w-40 h-40 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <Avatar className="w-full h-full rounded-xl">
                      <AvatarImage
                        src={logoPreview}
                        alt="Company logo"
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary border-primary/30"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload photo
                </Button>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="organization-name">
                    Organization Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organization-name"
                    placeholder="Enter your company name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={domain}
                    disabled
                    className="h-12 bg-muted"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !organizationName.trim()}
              className="px-8"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
