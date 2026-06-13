"use client";

import { useRouter } from "next/navigation";
import { LoopBuilder } from "@/components/loops/loop-builder";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function NewLoopPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      const res = await fetch("/api/loops", {
        method: "POST",
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

      if (!res.ok) throw new Error("Failed to create loop");

      const result = await res.json();
      router.push(`/dashboard/loops/${result.loop.id}`);
    } catch (err) {
      console.error("Failed to save loop:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loops">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Loop</h1>
          <p className="text-sm text-muted-foreground">
            Build a new automation workflow.
          </p>
        </div>
      </div>

      <LoopBuilder onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
