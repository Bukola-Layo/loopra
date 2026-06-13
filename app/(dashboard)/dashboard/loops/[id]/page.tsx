"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LoopBuilder } from "@/components/loops/loop-builder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ArrowLeft,
  Play,
  Pause,
  GitFork,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Loop = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger: { id: string; type: string; config: Record<string, unknown> | null } | null;
  actions: Array<{
    id: string;
    sequence: number;
    type: string;
    config: Record<string, unknown> | null;
  }>;
  createdAt: string;
};

type Execution = {
  id: string;
  status: string;
  triggeredAt: string;
  lastError: string | null;
  subscriber: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  eventLogs: Array<{
    id: string;
    status: string;
    error: string | null;
    timestamp: string;
    action: { type: string; sequence: number };
  }>;
};

export default function LoopDetailPage() {
  const params = useParams();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editor");
  const [isSaving, setIsSaving] = useState(false);

  const fetchLoop = () => {
    if (!params?.id) return;
    fetch(`/api/loops/${params.id}`)
      .then((r) => r.json())
      .then((res) => setLoop(res.loop ?? null))
      .finally(() => setLoading(false));
  };

  const fetchExecutions = () => {
    if (!params?.id) return;
    fetch(`/api/loops/${params.id}/executions`)
      .then((r) => r.json())
      .then((res) => setExecutions(res.executions ?? []));
  };

  useEffect(() => {
    fetchLoop();
  }, [params?.id]);

  useEffect(() => {
    if (activeTab === "executions") {
      fetchExecutions();
    }
  }, [activeTab, params?.id]);

  const updateStatus = async (status: string) => {
    if (!params?.id) return;
    const res = await fetch(`/api/loops/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLoop((prev) => (prev ? { ...prev, status } as Loop : null));
    }
  };

  const handleSave = async (data: {
    name: string;
    description: string;
    trigger: { type: string; config: Record<string, unknown> };
    actions: Array<{
      id: string;
      sequence: number;
      type: string;
      config: Record<string, unknown>;
    }>;
  }) => {
    if (!params?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/loops/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          trigger: data.trigger,
          actions: data.actions.map((a) => ({
            sequence: a.sequence,
            type: a.type,
            config: a.config,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to update loop");

      const result = await res.json();
      setLoop(result.loop);
    } catch (err) {
      console.error("Failed to save loop:", err);
    } finally {
      setIsSaving(false);
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
        <Link href="/dashboard/loops">
          <Button variant="outline" className="mt-4">
            Back to loops
          </Button>
        </Link>
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
        <div className="flex items-center gap-3">
          <StatusBadge status={loop.status} />
          {loop.status === "draft" && (
            <Button onClick={() => updateStatus("active")} className="gap-2">
              <Play className="h-4 w-4" /> Publish
            </Button>
          )}
          {loop.status === "active" && (
            <Button
              onClick={() => updateStatus("paused")}
              variant="outline"
              className="gap-2"
            >
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-6">
          <LoopBuilder
            initialName={loop.name}
            initialDescription={loop.description ?? ""}
            initialTrigger={
              loop.trigger
                ? {
                    type: loop.trigger.type,
                    config: loop.trigger.config ?? {},
                  }
                : { type: "", config: {} }
            }
            initialActions={
              loop.actions.map((a) => ({
                id: a.id,
                sequence: a.sequence,
                type: a.type,
                config: a.config ?? {},
              })) ?? []
            }
            onSave={handleSave}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="executions" className="mt-6">
          <ExecutionsTab
            executions={executions}
            onRefresh={fetchExecutions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExecutionsTab({
  executions,
  onRefresh,
}: {
  executions: Execution[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Execution History</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {executions.length === 0 ? (
        <EmptyState
          icon={<GitFork className="h-8 w-8" />}
          title="No executions yet"
          description="Executions will appear here when this loop is triggered by subscriber activity."
        />
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <Card key={execution.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ExecutionStatusIcon status={execution.status} />
                    <span className="font-medium text-sm">
                      {execution.subscriber?.email ?? "Unknown subscriber"}
                    </span>
                  </div>
                  <StatusBadge status={execution.status} />
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  Triggered{" "}
                  {new Date(execution.triggeredAt).toLocaleString()}
                </div>

                {execution.lastError && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-3">
                    {execution.lastError}
                  </div>
                )}

                {execution.eventLogs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Action Log:
                    </p>
                    {execution.eventLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <ActionStatusIcon status={log.status} />
                        <span className="text-muted-foreground">
                          {log.action.sequence}.
                        </span>
                        <span>{log.action.type.replace(/_/g, " ")}</span>
                        {log.error && (
                          <span className="text-destructive ml-2">
                            {log.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function ActionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-red-500" />;
    case "running":
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}
