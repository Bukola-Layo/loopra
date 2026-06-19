"use client";

import { useOnboardingStore } from "@/store/use-onboarding-store";

export function OnboardingProgress() {
  const { completedCount, totalSteps, isOnboardingComplete } =
    useOnboardingStore();

  if (isOnboardingComplete()) return null;

  const progress = Math.round((completedCount() / totalSteps()) * 100);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Audience Growth Setup</p>
        <span className="text-xs text-muted-foreground">
          {completedCount()} of {totalSteps()} steps completed
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
