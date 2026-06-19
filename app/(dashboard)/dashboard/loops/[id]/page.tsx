"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/loops/builder/sidebar";
import { useFlowStore } from "@/store/use-flow-store";

const FlowBuilder = dynamic(
  () => import("@/components/loops/builder/flow-builder").then((m) => m.FlowBuilder),
  { ssr: false }
);
import { ArrowLeft, Save, Loader2, Play, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";

export default function LoopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [loopName, setLoopName] = useState("");
  const [loopStatus, setLoopStatus] = useState("");
  const [loopId, setLoopId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params?.id || loaded) return;
    setLoopId(params.id as string);
    setNodes([]);
    setEdges([]);

    fetch(`/api/loops/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.loop) {
          setLoopName(res.loop.name);
          setLoopStatus(res.loop.status);

          if (res.loop.description) {
            try {
              const graph = JSON.parse(res.loop.description);
              if (graph.nodes) setNodes(graph.nodes);
              if (graph.edges) setEdges(graph.edges);
            } catch {
              // description is not a graph JSON, skip
            }
          }
        }
      })
      .catch(() => setLoopName("Untitled"))
      .finally(() => setLoaded(true));
  }, [params?.id, loaded, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    if (!loopId) return;
    setIsSaving(true);
    try {
      const graphJson = JSON.stringify({ nodes, edges });
      const triggerNode = nodes.find((n) => n.type === "trigger");
      const triggerType = inferTriggerType(triggerNode);
      const otherNodes = nodes
        .filter((n) => n.type !== "trigger")
        .sort((a, b) => a.position.y - b.position.y);

      const actions = otherNodes.length > 0
        ? otherNodes.map((n, i) => ({
            sequence: i,
            type: inferActionType(n),
            config: {},
          }))
        : [{ sequence: 0, type: "send_email" as const, config: {} }];

      const res = await fetch(`/api/loops/${loopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: loopName,
          description: graphJson,
          trigger: { type: triggerType, config: {} },
          actions,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const result = await res.json();
      setLoopStatus(result.loop.status);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save loop. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, loopId, loopName]);

  const handlePublish = useCallback(async () => {
    if (!loopId) return;
    try {
      const res = await fetch(`/api/loops/${loopId}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to publish");
      const result = await res.json();
      setLoopStatus(result.loop.status);
    } catch (err) {
      console.error("Publish failed:", err);
      alert("Failed to publish loop.");
    }
  }, [loopId]);

  const handleDisable = useCallback(async () => {
    if (!loopId) return;
    try {
      const res = await fetch(`/api/loops/${loopId}/disable`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to disable");
      const result = await res.json();
      setLoopStatus(result.loop.status);
    } catch (err) {
      console.error("Disable failed:", err);
      alert("Failed to disable loop.");
    }
  }, [loopId]);

  const handleDelete = useCallback(async () => {
    if (!loopId) return;
    if (!confirm("Are you sure you want to delete this loop? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/loops/${loopId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard/loops");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete loop.");
    }
  }, [loopId, router]);

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-10 relative">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-gray-500 hover:text-gray-900">
            <Link href="/dashboard/loops">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <Input
              value={loopName}
              onChange={(e) => setLoopName(e.target.value)}
              className="h-7 text-sm font-semibold border-none px-0 focus-visible:ring-0"
            />
            <StatusBadge status={loopStatus || "disabled"} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loopStatus === "disabled" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-green-600 border-green-300 hover:bg-green-50"
              onClick={handlePublish}
            >
              <Play className="h-4 w-4" />
              Publish
            </Button>
          )}
          {loopStatus === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={handleDisable}
            >
              <Square className="h-4 w-4" />
              Disable
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/loops">Discard Changes</Link>
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-[#dd2d4a] hover:bg-[#dd2d4a]/90 text-white"
            onClick={handleSave}
            disabled={isSaving || !loaded}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Loop"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 w-full overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 relative h-full bg-gray-50/50">
          <FlowBuilder />
        </main>
      </div>
    </div>
  );
}

function inferTriggerType(node?: { data?: Record<string, unknown> }): string {
  const title = (node?.data?.title as string) ?? "";
  if (title.includes("Form")) return "form_submission";
  if (title.includes("Tag")) return "tag_added";
  if (title.includes("Subscriber")) return "subscriber_created";
  if (title.includes("Campaign")) return "campaign_opened";
  return "subscriber_created";
}

function inferActionType(node: { type?: string; data?: Record<string, unknown> }): string {
  if (node.type === "delay") return "delay";
  if (node.type === "condition") return "condition";
  const title = (node.data?.title as string) ?? "";
  if (title.includes("Email")) return "send_email";
  if (title.includes("Tag")) return "apply_tag";
  if (title.includes("Webhook")) return "webhook";
  return "send_email";
}
