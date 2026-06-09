"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Mail, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

type Campaign = {
  id: string;
  title: string;
  subject: string;
  status: string;
  recipientCount: number;
  createdAt: string;
  sendAt: string | null;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((res) => setCampaigns(res.campaigns ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and send newsletters to your audience.
          </p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="No campaigns yet"
          description="Create your first newsletter campaign to start engaging with your audience."
          action={{
            label: "Create campaign",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="rounded-md border">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/campaigns/${c.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {c.subject}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{c.recipientCount} recipients</span>
                <StatusBadge status={c.status} />
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
