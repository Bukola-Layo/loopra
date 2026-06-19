"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { GitFork, Plus } from "lucide-react";
import Link from "next/link";
import { FeatureDiscovery } from "@/components/onboarding/feature-discovery";
import { useOnboardingStore } from "@/store/use-onboarding-store";

type Loop = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger: { type: string } | null;
  actions: Array<{ id: string; type: string; sequence: number }>;
  createdAt: string;
};

export default function LoopsPage() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);

  const { showOverlay, isStepCompleted, isOverlayDismissed, completeStep } =
    useOnboardingStore();

  useEffect(() => {
    fetch("/api/loops")
      .then((r) => r.json())
      .then((res) => setLoops(res.loops ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && loops.length === 0 && !isStepCompleted("build_loop") && !isOverlayDismissed("build_loop")) {
      showOverlay("build_loop");
    }
  }, [loading, loops.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loops</h1>
          <p className="text-muted-foreground mt-1">
            Build automation workflows triggered by subscriber actions.
          </p>
        </div>
        <Link href="/dashboard/loops/new" onClick={() => {
          completeStep("build_loop");
          showOverlay("publish_share");
        }}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create loop
          </Button>
        </Link>
      </div>

      <FeatureDiscovery featureId="loops" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : loops.length === 0 ? (
        <EmptyState
          icon={<GitFork className="h-8 w-8" />}
          title="No loops yet"
          description="Create your first automation loop to automatically engage with your subscribers."
          action={{
            label: "Create loop",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {loops.map((loop) => (
            <Link
              key={loop.id}
              href={`/dashboard/loops/${loop.id}`}
              className="rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden"
            >
              <img
                className="w-full h-32 object-cover border-b"
                src="/images/illustrations/loop.png"
                alt=""
              />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">{loop.name}</h3>
                  </div>
                  <StatusBadge status={loop.status} />
                </div>
                {loop.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {loop.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
