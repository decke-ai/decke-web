"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { User, Eye, EyeOff, Upload, Loader2, Shield, Monitor } from "lucide-react";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [email] = useState(user?.email || "");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPicture(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("picture", file);

      const response = await fetch("/api/user/picture", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Failed to upload picture");
        return;
      }

      await refreshUser();
    } catch {
      setUploadError("Failed to upload picture. Please try again.");
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error || "Failed to update profile");
        return;
      }

      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="grid grid-cols-[250px_1fr] gap-6">
        <div>
          <div className="border rounded-lg p-6 flex flex-col items-center gap-3">
            <Avatar className="h-32 w-32 rounded-lg">
              {user?.picture && (
                <AvatarImage
                  src={user.picture}
                  alt={user?.name || "User"}
                  className="rounded-lg object-cover"
                />
              )}
              <AvatarFallback className="rounded-lg bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Profile picture</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handlePictureChange}
              disabled={isUploadingPicture}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleChangeClick}
              disabled={isUploadingPicture}
            >
              {isUploadingPicture ? (
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
              <h2 className="text-lg font-semibold">Personal information</h2>
              <p className="text-sm text-muted-foreground">Change your personal info below</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Full name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 (11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  value={email}
                  placeholder="email@example.com"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {profileError && (
                  <p className="text-sm text-destructive">{profileError}</p>
                )}
                {profileSuccess && (
                  <p className="text-sm text-green-600">Profile updated successfully!</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update credentials"
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Change your password credentials</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">New password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Confirm password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600">Password updated successfully!</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring an additional code sent by email during login
              </p>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Disabled</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is not using two-factor authentication
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <Switch />
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-primary">How it works?</p>
              <ul className="text-sm text-primary space-y-1">
                <li>• During login, you will receive a code by email</li>
                <li>• Enter the code to complete access to your account</li>
                <li>• Codes expire in 5 minutes for enhanced security</li>
              </ul>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Trusted Devices</h2>
              <p className="text-sm text-muted-foreground">
                Manage devices that have access to your account without 2FA
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium text-muted-foreground">No trusted devices found</p>
              <p className="text-sm text-muted-foreground">
                When you login with 2FA enabled, your devices will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
