"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationsPanel } from "@/components/layout/notifications-panel";

export function TopNav() {
  const { data: session } = useSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b bg-background px-6">
      <div className="rounded-full p-[1.5px]" style={{ background: "conic-gradient(from 0deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2), rgba(99,102,241,0.2))" }}>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-background"
          aria-label="Notifications"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground mt-0.5">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <div className="rounded-full p-[1.5px] shrink-0"
              style={{
                background: "conic-gradient(from 0deg, #6366f1, #ec4899, #6366f1)",
              }}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="bg-background text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email ?? ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
    </header>
  );
}
