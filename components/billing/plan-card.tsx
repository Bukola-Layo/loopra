"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
};

type Props = {
  plan: Plan;
  currentPlanSlug?: string;
  onSelect: (planId: string) => void;
  loading?: boolean;
};

export function PlanCard({ plan, currentPlanSlug, onSelect, loading }: Props) {
  const isCurrent = currentPlanSlug === plan.slug;
  const isFree = plan.slug === "free";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-6 transition-all",
        isCurrent
          ? "border-primary ring-1 ring-primary bg-primary/5"
          : "hover:border-primary/50"
      )}
    >
      {isCurrent && (
        <div className="absolute -top-2.5 left-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-medium text-primary-foreground">
          Current
        </div>
      )}

      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {plan.price === 0 ? "Free" : `$${plan.price}`}
        </span>
        {plan.price > 0 && (
          <span className="text-sm text-muted-foreground">/{plan.billingCycle}</span>
        )}
      </div>

      <ul className="mt-6 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        variant={isCurrent ? "outline" : "default"}
        onClick={() => onSelect(plan.id)}
        disabled={isCurrent || loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isCurrent ? (
          "Current Plan"
        ) : isFree ? (
          "Downgrade"
        ) : (
          "Upgrade"
        )}
      </Button>
    </div>
  );
}
