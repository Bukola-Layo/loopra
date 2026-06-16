"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/loops/builder/sidebar";
import { FlowBuilder } from "@/components/loops/builder/flow-builder";
import { useFlowStore } from "@/store/use-flow-store";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewLoopPage() {
  const router = useRouter();
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");

  const handleSave = useCallback(async () => {
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

      const loopName = name.trim() || triggerNode?.data?.title || "Untitled Loop";

      const res = await fetch("/api/loops", {
        method: "POST",
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
      router.push(`/dashboard/loops/${result.loop.id}`);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save loop. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, name, router]);

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loop name..."
              className="h-7 text-sm font-semibold border-none px-0 focus-visible:ring-0"
            />
            <span className="text-xs text-gray-500">Unsaved Draft</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/loops">Discard Changes</Link>
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-[#dd2d4a] hover:bg-[#dd2d4a]/90 text-white"
            onClick={handleSave}
            disabled={isSaving}
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
