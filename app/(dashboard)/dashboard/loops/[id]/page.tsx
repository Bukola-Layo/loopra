"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Play, Pause, Trash2 } from "lucide-react";
import Link from "next/link";

type Loop = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger: { id: string; type: string; config: Record<string, unknown> | null } | null;
  actions: Array<{ id: string; sequence: number; type: string; config: Record<string, unknown> | null }>;
  createdAt: string;
};

export default function LoopDetailPage() {
  const params = useParams();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/loops/${params.id}`)
      .then((r) => r.json())
      .then((res) => setLoop(res.loop ?? null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const updateStatus = async (status: string) => {
    if (!params?.id) return;
    const res = await fetch(`/api/loops/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLoop((prev) => prev ? { ...prev, status } as Loop : null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!loop) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Loop not found</p>
        <Link href="/dashboard/loops"><Button variant="outline" className="mt-4">Back to loops</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loops">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{loop.name}</h1>
          {loop.description && (
            <p className="text-sm text-muted-foreground">{loop.description}</p>
          )}
        </div>
        <StatusBadge status={loop.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trigger</CardTitle>
          </CardHeader>
          <CardContent>
            {loop.trigger ? (
              <div>
                <Badge>{loop.trigger.type.replace(/_/g, " ")}</Badge>
                {loop.trigger.config && (
                  <pre className="mt-2 text-xs text-muted-foreground">
                    {JSON.stringify(loop.trigger.config, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trigger configured</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actions ({loop.actions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loop.actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions configured</p>
            ) : (
              <div className="space-y-2">
                {loop.actions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{action.sequence}.</span>
                    <Badge variant="outline">{action.type.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {loop.status === "draft" && (
          <Button onClick={() => updateStatus("active")} className="gap-2">
            <Play className="h-4 w-4" /> Publish
          </Button>
        )}
        {loop.status === "active" && (
          <Button onClick={() => updateStatus("paused")} variant="outline" className="gap-2">
            <Pause className="h-4 w-4" /> Pause
          </Button>
        )}
        {loop.status === "paused" && (
          <Button onClick={() => updateStatus("active")} className="gap-2">
            <Play className="h-4 w-4" /> Resume
          </Button>
        )}
      </div>
    </div>
  );
}
