"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  current: number;
  limit: number;
  format?: (n: number) => string;
};

export function UsageMeter({ label, current, limit, format }: Props) {
  const percentage = limit === -1 ? 0 : Math.min(100, (current / limit) * 100);
  const isUnlimited = limit === -1;
  const isOverLimit = !isUnlimited && current >= limit;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium",
            isOverLimit && "text-destructive",
            isUnlimited && "text-muted-foreground"
          )}
        >
          {format ? format(current) : current.toLocaleString()}
          {isUnlimited ? "" : ` / ${format ? format(limit) : limit.toLocaleString()}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isOverLimit
                ? "bg-destructive"
                : percentage > 80
                ? "bg-amber-500"
                : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
