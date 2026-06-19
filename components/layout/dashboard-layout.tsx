"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingChecklist, OnboardingOverlay, FloatingHelp } from "@/components/onboarding";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <OnboardingChecklist />
      <OnboardingOverlay />
      <FloatingHelp />
      <Toaster />
    </SessionProvider>
  );
}
