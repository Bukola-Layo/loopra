"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Tags, Plus, Users } from "lucide-react";

type Segment = {
  id: string;
  name: string;
  criteria: Record<string, unknown> | null;
  _count: { members: number };
  createdAt: string;
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => r.json())
      .then((res) => setSegments(res.segments ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">
            Group subscribers based on shared attributes or behavior.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create segment
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-8 w-8" />}
          title="No segments yet"
          description="Create segments to group your subscribers by tags, activity, or custom criteria."
          action={{
            label: "Create segment",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <CardTitle className="text-base">{segment.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{segment._count.members} members</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
