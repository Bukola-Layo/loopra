"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Search, Upload, Download, ChevronRight } from "lucide-react";
import Link from "next/link";

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  tags: Array<{ tag: string }>;
  createdAt: string;
};

export default function AudiencePage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audience?limit=10")
      .then((r) => r.json())
      .then((res) => {
        setSubscribers(res.subscribers ?? []);
        setTotal(res.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "unsubscribed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audience</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscribers and segments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button>Add subscriber</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-green-600">{activeCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-muted-foreground">{unsubscribedCount}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search subscribers..." className="pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No subscribers yet"
          description="Add subscribers manually, import a CSV, or create a signup form to start building your audience."
          action={{
            label: "Add subscriber",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="rounded-md border">
          {subscribers.map((sub) => (
            <Link
              key={sub.id}
              href={`/dashboard/audience/subscribers/${sub.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {sub.firstName || sub.lastName
                    ? `${sub.firstName ?? ""} ${sub.lastName ?? ""}`.trim()
                    : sub.email}
                </p>
                {sub.firstName && <p className="text-xs text-muted-foreground truncate">{sub.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                {sub.tags?.slice(0, 2).map((t) => (
                  <Badge key={t.tag} variant="secondary" className="text-xs">
                    {t.tag}
                  </Badge>
                ))}
                <Badge
                  variant={sub.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {sub.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
