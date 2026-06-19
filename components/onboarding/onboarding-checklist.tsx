"use client";

import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: "create_page" as const, label: "Create your first Page" },
  { id: "add_subscriber" as const, label: "Add your first Subscriber" },
  { id: "create_campaign" as const, label: "Create a Campaign" },
  { id: "build_loop" as const, label: "Build a Loop" },
  { id: "publish_share" as const, label: "Publish & Share" },
];

export function OnboardingChecklist() {
  const router = useRouter();
  const {
    completedSteps,
    completedCount,
    totalSteps,
    isOnboardingComplete,
    checklistCollapsed,
    toggleChecklist,
  } = useOnboardingStore();

  if (isOnboardingComplete()) return null;

  const progress = Math.round((completedCount() / totalSteps()) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="rounded-xl border bg-card shadow-lg">
        <button
          type="button"
          onClick={toggleChecklist}
          className="flex w-full items-center gap-3 px-4 py-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Welcome to Loopra</p>
            <p className="text-xs text-muted-foreground">
              Complete setup ({completedCount()}/{totalSteps()})
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              !checklistCollapsed && "rotate-180"
            )}
          />
        </button>

        {!checklistCollapsed && (
          <div className="px-4 pb-4 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ul className="space-y-1">
              {STEPS.map((step) => {
                const done = completedSteps.includes(step.id);
                return (
                  <li
                    key={step.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                      done
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </div>
                    {step.label}
                  </li>
                );
              })}
            </ul>

            <Button
              size="sm"
              className="w-full mt-2"
              onClick={() => router.push("/dashboard/audience/pages")}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
