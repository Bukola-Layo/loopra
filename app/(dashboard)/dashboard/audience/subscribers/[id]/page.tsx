"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Calendar } from "lucide-react";
import Link from "next/link";

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  customFields: Record<string, unknown> | null;
  tags: Array<{ tag: string }>;
  createdAt: string;
  lastEngagedAt: string | null;
};

export default function SubscriberDetailPage() {
  const params = useParams();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/audience/${params.id}`)
      .then((r) => r.json())
      .then((res) => setSubscriber(res.subscriber ?? null))
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

  if (!subscriber) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Subscriber not found</p>
        <Link href="/dashboard/audience"><Button variant="outline" className="mt-4">Back to audience</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/audience">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {subscriber.firstName || subscriber.lastName
              ? `${subscriber.firstName ?? ""} ${subscriber.lastName ?? ""}`.trim()
              : subscriber.email}
          </h1>
          {subscriber.firstName && (
            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
          )}
        </div>
        <Badge
          variant={subscriber.status === "active" ? "default" : "secondary"}
        >
          {subscriber.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{subscriber.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Subscribed {new Date(subscriber.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriber.tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscriber.tags.map((t) => (
                  <Badge key={t.tag} variant="secondary">{t.tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {subscriber.customFields && Object.keys(subscriber.customFields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(subscriber.customFields).map(([key, value]) => (
                <div key={key} className="flex text-sm">
                  <span className="text-muted-foreground w-32">{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
