"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Eye, MousePointerClick, AlertTriangle, UserX } from "lucide-react";
import Link from "next/link";

type Analytics = {
  campaign: {
    title: string;
    subject: string;
    status: string;
  };
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  events: Array<{
    id: string;
    eventType: string;
    linkClicked: string | null;
    timestamp: string;
  }>;
};

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/campaigns/${params.id}/analytics`)
      .then((r) => r.json())
      .then((res) => setAnalytics(res))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Analytics not available</p>
        <Link href="/dashboard/campaigns">
          <Button variant="outline" className="mt-4">Back to campaigns</Button>
        </Link>
      </div>
    );
  }

  const { metrics, campaign, events } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/campaigns/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.opened}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.openRate}% open rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
            <MousePointerClick className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clicked}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.clickRate}% click rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounced</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bounced}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.bounceRate}% bounce rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unsubscribed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                >
                  <div className="shrink-0 mt-0.5">
                    {event.eventType === "open" && <Eye className="h-4 w-4 text-blue-500" />}
                    {event.eventType === "click" && <MousePointerClick className="h-4 w-4 text-green-500" />}
                    {event.eventType === "unsubscribe" && <UserX className="h-4 w-4 text-red-500" />}
                    {event.eventType === "bounce" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{event.eventType}</p>
                    {event.linkClicked && (
                      <p className="text-xs text-muted-foreground truncate">{event.linkClicked}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
