"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { BlockEditor } from "@/components/templates/block-editor";
import {
  type EmailBlock,
  serializeBlocks,
  deserializeBlocks,
  createBlock,
} from "@/lib/email-builder";

type Template = {
  id: string;
  name: string;
  category: string | null;
  content: string | null;
  thumbnail: string | null;
  isPublished: boolean;
};

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/templates/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        const t = res.template ?? null;
        setTemplate(t);
        if (t) {
          setName(t.name);
          setCategory(t.category ?? "");
          setIsPublished(t.isPublished);
          const parsed = deserializeBlocks(t.content ?? "");
          setBlocks(parsed ?? [createBlock("text")]);
        }
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!template) return;
    if (!name.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || undefined,
          content: serializeBlocks(blocks),
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      toast({ title: "Template updated" });
      setTemplate(data.template);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Template not found</p>
        <Link href="/dashboard/templates">
          <Button variant="outline" className="mt-4">Back to templates</Button>
        </Link>
      </div>
    );
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
          <h1 className="text-2xl font-bold">Edit template</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Welcome, Promo, Newsletter"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="published" className="text-sm cursor-pointer">Published</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email content</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/dashboard/templates">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
