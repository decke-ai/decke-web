"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  ShieldCheck,
  Crown,
  Mail,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, UserProfile } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty } from "@/components/ui/empty";

interface OrganizationUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  profile: UserProfile | null;
  onboarding: boolean;
  created_date: string;
}

interface Invite {
  id: string;
  email: string;
  profile: UserProfile;
  status: "pending" | "accepted" | "expired" | "rejected";
  expiration_date: string;
  created_date: string;
}

const PROFILE_OPTIONS: { value: UserProfile; label: string; description: string }[] = [
  { value: "Owner", label: "Owner", description: "Full access to all settings and user management" },
  { value: "Administrator", label: "Administrator", description: "Can manage users and most settings" },
  { value: "Member", label: "Member", description: "Can view and use the platform" },
];

function getProfileIcon(profile: UserProfile | null) {
  switch (profile) {
    case "Owner":
      return <Crown className="h-4 w-4 text-amber-500" />;
    case "Administrator":
      return <ShieldCheck className="h-4 w-4 text-blue-500" />;
    default:
      return <Shield className="h-4 w-4 text-muted-foreground" />;
  }
}

function getProfileBadgeVariant(profile: UserProfile | null): "default" | "secondary" | "outline" {
  switch (profile) {
    case "Owner":
      return "default";
    case "Administrator":
      return "secondary";
    default:
      return "outline";
  }
}

function getInviteStatusBadge(status: Invite["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "accepted":
      return <Badge variant="default">Accepted</Badge>;
    case "expired":
      return <Badge variant="outline">Expired</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return null;
  }
}

export default function UsersPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { backendUser, organization } = useAuth();

  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmailPrefix, setInviteEmailPrefix] = useState("");
  const [inviteProfile, setInviteProfile] = useState<UserProfile>("Member");
  const [isInviting, setIsInviting] = useState(false);

  const organizationDomain = organization?.domain || "";

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [editProfile, setEditProfile] = useState<UserProfile>("Member");
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = backendUser?.profile === "Owner";

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`/api/organizations/${organizationId}/users`);
      if (!response.ok) return;
      const data = await response.json();
      setUsers(data.content || []);
    } catch (error) {
      if (error instanceof Error && error.message !== "Session expired") {
        toast.error("Failed to load users");
      }
    }
  }, [organizationId]);

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`/api/organizations/${organizationId}/invites`);
      if (!response.ok) return;
      const data = await response.json();
      setInvites(data.content || []);
    } catch (error) {
      if (error instanceof Error && error.message !== "Session expired") {
        toast.error("Failed to load invites");
      }
    }
  }, [organizationId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchInvites()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchUsers, fetchInvites]);

  const handleInviteUser = async () => {
    if (!inviteEmailPrefix.trim()) {
      toast.error("Please enter an email");
      return;
    }

    if (!inviteName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    const fullEmail = `${inviteEmailPrefix.trim()}@${organizationDomain}`;

    setIsInviting(true);
    try {
      const response = await fetchWithAuth(`/api/organizations/${organizationId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fullEmail,
          name: inviteName.trim(),
          profile: inviteProfile,
        }),
      });

      if (response.ok) {
        toast.success(`Invite sent to ${fullEmail}`);
        setIsInviteDialogOpen(false);
        setInviteName("");
        setInviteEmailPrefix("");
        setInviteProfile("Member");
        fetchInvites();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send invite");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Session expired") {
        toast.error("Failed to send invite");
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateUserProfile = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const response = await fetchWithAuth(
        `/api/organizations/${organizationId}/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: editProfile }),
        }
      );

      if (response.ok) {
        toast.success("User profile updated");
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Session expired") {
        toast.error("Failed to update user");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const response = await fetchWithAuth(
        `/api/organizations/${organizationId}/invites/${inviteId}`,
        { method: "DELETE" }
      );

      if (response.ok || response.status === 204) {
        toast.success("Invite revoked");
        fetchInvites();
      } else {
        toast.error("Failed to revoke invite");
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Session expired") {
        toast.error("Failed to revoke invite");
      }
    }
  };

  const openEditDialog = (user: OrganizationUser) => {
    setSelectedUser(user);
    setEditProfile(user.profile || "Member");
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = invites.filter((invite) =>
    invite.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvites = filteredInvites.filter((i) => i.status === "pending");

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage team members and their access
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite user
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {users.length} {users.length === 1 ? "member" : "members"}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">
                Members ({users.length})
              </TabsTrigger>
              <TabsTrigger value="invites">
                Pending invites ({pendingInvites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-2">
              {filteredUsers.length === 0 ? (
                <Empty
                  icon={<Users className="h-8 w-8 text-muted-foreground" />}
                  title="No users found"
                  description={searchQuery ? "Try a different search term" : "No users in this organization yet"}
                />
              ) : (
                <div className="border rounded-lg divide-y">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {user.avatar && (
                            <AvatarImage src={user.avatar} alt={user.name || user.email} />
                          )}
                          <AvatarFallback>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.name || user.email.split("@")[0]}
                            </span>
                            {user.id === backendUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={getProfileBadgeVariant(user.profile)}>
                          {getProfileIcon(user.profile)}
                          <span className="ml-1">{user.profile || "Member"}</span>
                        </Badge>

                        {isOwner && user.id !== backendUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Change role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invites" className="space-y-2">
              {pendingInvites.length === 0 ? (
                <Empty
                  icon={<Mail className="h-8 w-8 text-muted-foreground" />}
                  title="No pending invites"
                  description="Invite team members to join your organization"
                />
              ) : (
                <div className="border rounded-lg divide-y">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {invite.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{invite.email}</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Invited as {invite.profile}</span>
                            <span>·</span>
                            <span>
                              Expires {new Date(invite.expiration_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getInviteStatusBadge(invite.status)}

                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRevokeInvite(invite.id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Revoke invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="flex">
                <Input
                  type="text"
                  value={inviteEmailPrefix}
                  onChange={(e) => setInviteEmailPrefix(e.target.value)}
                  placeholder="colleague"
                  className="rounded-r-none"
                />
                <div className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm">
                  @{organizationDomain}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={inviteProfile}
                onValueChange={(value) => setInviteProfile(value as UserProfile)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isInviting || !inviteName.trim() || !inviteEmailPrefix.trim()}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change user role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={editProfile}
                onValueChange={(value) => setEditProfile(value as UserProfile)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUserProfile} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
