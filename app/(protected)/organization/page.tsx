"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Loader2, Upload } from "lucide-react";

export default function OrganizationPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [organizationName, setOrganizationName] = useState("Decke");
  const [domain] = useState("decke.com.br");
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum size is 5MB.");
      return;
    }

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOrganizationLogo(e.target?.result as string);
        setIsUploadingLogo(false);
      };
      reader.onerror = () => {
        setUploadError("Failed to read file. Please try again.");
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError("Failed to upload logo. Please try again.");
      setIsUploadingLogo(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateOrganization = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to update organization. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="grid grid-cols-[250px_1fr] gap-6">
        <div>
          <div className="border rounded-lg p-6 flex flex-col items-center gap-3">
            <Avatar className="h-32 w-32 rounded-lg">
              {organizationLogo && (
                <AvatarImage
                  src={organizationLogo}
                  alt={organizationName}
                  className="rounded-lg object-cover"
                />
              )}
              <AvatarFallback className="rounded-lg bg-muted">
                <Building2 className="h-16 w-16 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Profile picture</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleLogoChange}
              disabled={isUploadingLogo}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleChangeClick}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Change
                  <Upload className="h-4 w-4" />
                </>
              )}
            </Button>
            {uploadError && (
              <p className="text-xs text-destructive text-center">{uploadError}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Organization information</h2>
              <p className="text-sm text-muted-foreground">Manage your organization details</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Organization name</label>
                <Input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Domain</label>
                <Input
                  value={domain}
                  placeholder="domain.com"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-green-600">Organization updated successfully!</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleUpdateOrganization}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update organization"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
