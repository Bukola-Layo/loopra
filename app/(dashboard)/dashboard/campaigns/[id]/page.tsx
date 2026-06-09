"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Send, Clock, Copy, BarChart3 } from "lucide-react";
import Link from "next/link";

type Campaign = {
  id: string;
  title: string;
  subject: string;
  content: string | null;
  status: string;
  recipientCount: number;
  sendAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((res) => setCampaign(res.campaign ?? null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/dashboard/campaigns"><Button variant="outline" className="mt-4">Back to campaigns</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.recipientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{campaign.status}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {campaign.status === "draft" && (
          <>
            <Button className="gap-2">
              <Send className="h-4 w-4" /> Send now
            </Button>
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" /> Schedule
            </Button>
          </>
        )}
        <Button variant="outline" className="gap-2">
          <Copy className="h-4 w-4" /> Duplicate
        </Button>
        <Link href={`/dashboard/campaigns/${campaign.id}/analytics`}>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Button>
        </Link>
      </div>

      {campaign.content && (
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {campaign.content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
