"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  category: string | null;
  content: string | null;
  isPublished: boolean;
  createdAt: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((res) => setTemplates(res.templates ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Template deleted" });
    } catch {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable email templates.
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No templates yet"
          description="Create a template to reuse in your campaigns."
          action={{
            label: "Create template",
            onClick: () => router.push("/dashboard/templates/new"),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {t.category && (
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(t.id, t.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.isPublished && (
                    <span className="text-green-600 font-medium">Published</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/templates/${t.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/dashboard/campaigns/new?template=${t.id}`);
                    }}
                  >
                    Use in campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
