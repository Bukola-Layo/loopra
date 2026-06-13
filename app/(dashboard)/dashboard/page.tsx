"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, GitFork, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DashboardData = {
  metrics: {
    subscribers: number;
    activeSubscribers: number;
    campaigns: number;
    sentCampaigns: number;
    forms: number;
  };
  recentCampaigns: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentSubscribers: Array<{ id: string; email: string; firstName: string | null; createdAt: string }>;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your audience and campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.metrics?.subscribers ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.metrics?.activeSubscribers ?? 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaigns Sent
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.metrics?.sentCampaigns ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.metrics?.campaigns ?? 0} total created
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Forms
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.metrics?.forms ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.metrics?.sentCampaigns ? "—" : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Send a campaign to see stats
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/campaigns">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="h-4 w-4" />
                Send a newsletter
              </Button>
            </Link>
            <Link href="/dashboard/forms">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Create a signup form
              </Button>
            </Link>
            <Link href="/dashboard/loops">
              <Button variant="outline" className="w-full justify-start gap-2">
                <GitFork className="h-4 w-4" />
                Build a Loop
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (data?.recentCampaigns?.length ?? 0) > 0 || (data?.recentSubscribers?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {data?.recentCampaigns?.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.status}</p>
                    </div>
                  </div>
                ))}
                {data?.recentSubscribers?.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{s.email}</p>
                      <p className="text-xs text-muted-foreground">New subscriber</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No recent activity to show.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your dashboard will populate once you start engaging with your audience.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
