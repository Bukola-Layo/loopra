"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Mail, Plus, Search, Calendar, Users, Trash2, XCircle, Loader2, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { anyToHtml } from "@/lib/email-builder";
import { toast } from "@/hooks/use-toast";

type Campaign = {
  id: string;
  title: string;
  subject: string;
  status: string;
  recipientCount: number;
  createdAt: string;
  sendAt: string | null;
  content?: string | null;
  contentType?: string | null;
};

function CampaignThumbnail({ content, contentType }: { content?: string | null; contentType?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (ref.current) {
      const w = ref.current.offsetWidth;
      setScale(Math.min(1, w / 600));
    }
  }, []);

  const html = content && contentType === "html" ? anyToHtml(content) : null;

  return (
    <div ref={ref} className="w-full h-full overflow-hidden relative bg-muted">
      {html ? (
        <iframe
          srcDoc={html}
          className="absolute top-0 left-0 border-0 origin-top-left"
          style={{
            width: "600px",
            height: "800px",
            transform: `scale(${scale})`,
          }}
          title="Email preview"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <Mail className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((res) => setCampaigns(res.campaigns ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreateCampaign() {
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Campaign",
          subject: "Your newsletter subject",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      router.push(`/dashboard/campaigns/${data.campaign.id}/edit`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Campaign deleted" });
    } catch {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled campaign?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "draft" } : c))
      );
      toast({ title: "Campaign cancelled" });
    } catch {
      toast({ title: "Failed to cancel campaign", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and send newsletters to your audience.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/templates">
            <Button variant="outline" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
          <Button className="gap-2" onClick={handleCreateCampaign} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {creating ? "Creating..." : "Create campaign"}
          </Button>
        </div>
      </div>

      {!loading && campaigns.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <p className="text-sm text-muted-foreground shrink-0">
            {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="No campaigns yet"
          description="Create your first newsletter campaign to start engaging with your audience."
          action={{
            label: "Create campaign",
            onClick: handleCreateCampaign,
          }}
        />
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No campaigns match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((c) => (
            <Card key={c.id} className="group overflow-hidden hover:border-primary/50 transition-colors h-full">
              <Link href={`/dashboard/campaigns/${c.id}`}>
                <div className="aspect-[4/3] overflow-hidden cursor-pointer">
                  <CampaignThumbnail content={c.content} contentType={c.contentType} />
                </div>
              </Link>
              <CardContent className="p-4 space-y-2">
                <Link href={`/dashboard/campaigns/${c.id}`}>
                  <h3 className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer">
                    {c.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  {c.subject}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {c.recipientCount}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex gap-1 pt-1">
                  {c.status === "scheduled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={(e) => { e.preventDefault(); handleCancel(c.id); }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7"
                    onClick={(e) => { e.preventDefault(); handleDelete(c.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
