"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  FormInput,
  GitFork,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavGroup = {
  label: string;
  icon: React.ElementType;
  children: Array<{
    label: string;
    href: string;
    icon: React.ElementType;
  }>;
};

const navGroups: NavGroup[] = [
  {
    label: "Audience",
    icon: Users,
    children: [
      { label: "Pages", href: "/dashboard/audience/pages", icon: ExternalLink },
      { label: "Forms", href: "/dashboard/audience/forms", icon: FormInput },
      { label: "Subscribers", href: "/dashboard/audience", icon: Users },
    ],
  },
];

const bottomNavItems = [
  {
    label: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Mail,
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: FileText,
  },
  {
    label: "Loops",
    href: "/dashboard/loops",
    icon: GitFork,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

function SidebarNav({
  collapsed = false,
  onItemClick,
}: {
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
      <Link
        href="/dashboard"
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname === "/dashboard"
            ? "bg-sidebar-selected text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-muted",
          collapsed && "justify-center px-2"
        )}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0" />
        {!collapsed && <span>Dashboard</span>}
      </Link>

      {navGroups.map((group) => (
        <NavGroupSection
          key={group.label}
          group={group}
          collapsed={collapsed}
          pathname={pathname}
          onItemClick={onItemClick}
        />
      ))}

      {bottomNavItems.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-selected text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-muted",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}

      <Link
        href="/dashboard/settings"
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          pathname.startsWith("/dashboard/settings")
            ? "bg-sidebar-selected text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-muted",
          collapsed && "justify-center px-2"
        )}
      >
        <Settings className="h-5 w-5 shrink-0" />
        {!collapsed && <span>Settings</span>}
      </Link>
    </nav>
  );
}

function NavGroupSection({
  group,
  collapsed,
  pathname,
  onItemClick,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  const isGroupActive = group.children.some(
    (child) => pathname === child.href || pathname.startsWith(child.href)
  );
  const [expanded, setExpanded] = useState(collapsed ? false : isGroupActive);

  return (
    <div>
      <button
        onClick={() => !collapsed && setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-sidebar-foreground hover:bg-sidebar-muted",
          collapsed && "justify-center px-2"
        )}
      >
        <group.icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </>
        )}
      </button>
      {!collapsed && expanded && (
        <div className="ml-2 mt-1 space-y-0.5 border-l pl-2">
          {group.children.map((child) => {
            const isChildActive =
              pathname === child.href || pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isChildActive
                    ? "bg-sidebar-selected text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-muted"
                )}
              >
                <child.icon className="h-4 w-4 shrink-0" />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar transition-all duration-200 z-10",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard">
            <img
              src="/images/illustrations/loopra-logo.svg"
              alt="Loopra"
              className="h-7 w-auto"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
      <Separator />
      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar">
        <div className="flex h-16 items-center px-4">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <img
              src="/images/illustrations/loopra-logo.svg"
              alt="Loopra"
              className="h-7 w-auto"
            />
          </Link>
        </div>
        <Separator />
        <SidebarNav collapsed={false} onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
