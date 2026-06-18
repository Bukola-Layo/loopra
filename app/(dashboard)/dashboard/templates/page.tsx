"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { TemplateCard, type TemplateCardTemplate } from "@/components/templates/template-card";
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Building2,
  User,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function TemplatesPage() {
  const router = useRouter();
  const [userTemplates, setUserTemplates] = useState<TemplateCardTemplate[]>([]);
  const [libraryTemplates, setLibraryTemplates] = useState<TemplateCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const fetchUserTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates/user");
      const data = await res.json();
      setUserTemplates(data.templates ?? []);
    } catch {
      setUserTemplates([]);
    }
  }, []);

  const fetchLibraryTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/templates/library?${params.toString()}`);
      const data = await res.json();
      setLibraryTemplates(data.templates ?? []);
    } catch {
      setLibraryTemplates([]);
    }
  }, [categoryFilter, sourceFilter, searchQuery]);

  useEffect(() => {
    Promise.all([fetchUserTemplates(), fetchLibraryTemplates()])
      .finally(() => setLoading(false));
  }, [fetchUserTemplates, fetchLibraryTemplates]);

  useEffect(() => {
    if (!loading) fetchLibraryTemplates();
  }, [categoryFilter, sourceFilter, searchQuery, fetchLibraryTemplates, loading]);

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch("/api/templates/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Added to My Templates" });
      fetchUserTemplates();
    } catch {
      toast({ title: "Failed to duplicate", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/templates/user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setUserTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Template deleted" });
    } catch {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  }

  const categories = [...new Set(libraryTemplates.map((t) => t.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Browse the library or create your own templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/templates/new/edit">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create template
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine" className="gap-2">
            <User className="h-4 w-4" /> My Templates
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <Layers className="h-4 w-4" /> Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : userTemplates.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No templates yet"
              description="Create your own template or duplicate one from the library."
              action={{
                label: "Create template",
                onClick: () => router.push("/dashboard/templates/new/edit"),
              }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isUserTemplate
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c!}>{c}</option>
                ))}
              </select>
            )}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All sources</option>
              <option value="OFFICIAL">Official</option>
              <option value="AI_GENERATED">AI Generated</option>
              <option value="INDUSTRY">Industry</option>
            </select>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : libraryTemplates.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No templates found"
              description={searchQuery ? "Try a different search term." : "No templates available in the library."}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {libraryTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
