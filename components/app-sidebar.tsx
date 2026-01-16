"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LogOut,
  ChevronDown,
  Search,
  PanelLeftClose,
  PanelLeft,
  User,
  Building2,
  List,
  Building,
  Users,
  Coins,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAnalytics } from "@/hooks/use-analytics";
import { useOrganization } from "@/hooks/use-organization";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const { trackUserSignOut } = useAnalytics();
  const { organizationId } = useOrganization();

  const isCollapsed = state === "collapsed";

  const handleSignOut = () => {
    if (user) {
      trackUserSignOut({
        user_id: user.id,
        user_email: user.email,
      });
    }
    window.location.href = "/auth/logout";
  };

  const homeNavItems = [
    { title: "Home", icon: Home, href: "/" },
  ];

  const dataNavItems = [
    { title: "Searches", icon: Search, href: `/organizations/${organizationId}/searches` },
    { title: "Lists", icon: List, href: `/organizations/${organizationId}/lists` },
  ];

  const recordsNavItems = [
    { title: "Companies", icon: Building, href: `/organizations/${organizationId}/records/companies` },
    { title: "People", icon: Users, href: `/organizations/${organizationId}/records/people` },
  ];

  return (
    <Sidebar collapsible="icon" className="bg-white">
      <SidebarHeader className="p-2">
        {/* Collapse button - Notion style */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={isCollapsed ? "w-full justify-center" : "w-full justify-between"}
              tooltip={isCollapsed ? user?.name || user?.email : undefined}
            >
              <div className={isCollapsed ? "flex items-center justify-center" : "flex items-center gap-2"}>
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  {user?.picture && (
                    <AvatarImage
                      src={user.picture}
                      alt={user?.name || "User"}
                      className="rounded-lg"
                    />
                  )}
                  <AvatarFallback className="rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate w-full">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user?.email}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="mr-2 h-4 w-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/organizations/${organizationId}`}>
                <Building2 className="mr-2 h-4 w-4" />
                Organization
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/credits">
                <Coins className="mr-2 h-4 w-4" />
                Credits
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {homeNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {isCollapsed ? (
            <div className="mx-2 my-2 border-t border-border" />
          ) : (
            <SidebarGroupLabel>Prospects</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {dataNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {isCollapsed ? (
            <div className="mx-2 my-2 border-t border-border" />
          ) : (
            <SidebarGroupLabel>Records</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {recordsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
