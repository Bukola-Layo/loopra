"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Eye } from "lucide-react";
import Link from "next/link";
import {
  type EmailBlock,
  serializeBlocks,
  BUILT_IN_TEMPLATES,
} from "@/lib/email-builder";
import type { Viewport } from "@/components/templates/block-editor";

const BlockEditor = dynamic(
  () => import("@/components/templates/block-editor").then((m) => m.BlockEditor),
  { ssr: false }
);
const EmailPreview = dynamic(
  () => import("@/components/templates/block-editor").then((m) => m.EmailPreview),
  { ssr: false }
);

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  function loadBuiltIn(template: (typeof BUILT_IN_TEMPLATES)[number]) {
    setName(template.name);
    setCategory(template.category);
    setBlocks(template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    if (blocks.length === 0) {
      toast({ title: "Add at least one block", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || undefined,
          content: serializeBlocks(blocks),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      toast({ title: "Template created" });
      router.push(`/dashboard/templates/${data.template.id}/edit`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New template</h1>
          <p className="text-sm text-muted-foreground">
            Build a reusable email template with drag-and-drop blocks.
          </p>
        </div>
      </div>

      {blocks.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> Start from a built-in template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUILT_IN_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => loadBuiltIn(t)}
                  className="text-left p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.blocks.length} blocks</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Or build from scratch using the blocks below.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome Email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Welcome, Promo, Newsletter"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Email content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Preview
              </CardTitle>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                {(["desktop", "tablet", "mobile"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setViewport(v)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize ${
                      viewport === v ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg">
                  Add blocks to see a live preview.
                </p>
              ) : (
                <EmailPreview blocks={blocks} viewport={viewport} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/templates">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving || blocks.length === 0}>
            {saving ? "Creating..." : "Create template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
