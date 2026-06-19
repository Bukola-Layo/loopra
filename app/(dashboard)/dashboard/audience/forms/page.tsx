"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FeatureDiscovery } from "@/components/onboarding/feature-discovery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormInput, Plus, MoreHorizontal, Copy, Trash2, Eye, ExternalLink, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Form = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  pageId: string | null;
  page: { id: string; name: string; slug: string } | null;
  fields: Array<{ id: string }>;
  createdAt: string;
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms() {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setForms(data.forms ?? []);
    } catch {
      toast({ title: "Failed to load forms", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(form: Form) {
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: form.status === "active" ? "disabled" : "active" }),
      });
      if (!res.ok) throw new Error("Failed");
      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, status: form.status === "active" ? "disabled" : "active" } : f
        )
      );
      toast({ title: `Form ${form.status === "active" ? "disabled" : "enabled"}` });
    } catch {
      toast({ title: "Failed to update form", variant: "destructive" });
    }
  }

  async function deleteForm() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/forms/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setForms((prev) => prev.filter((f) => f.id !== deleteId));
      toast({ title: "Form deleted" });
    } catch {
      toast({ title: "Failed to delete form", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground">
            Forms capture subscribers for your pages
          </p>
        </div>
        <Link href="/dashboard/audience/forms/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Form
          </Button>
        </Link>
      </div>

      <FeatureDiscovery featureId="forms" />

      {forms.length === 0 ? (
        <EmptyState
          icon={<FormInput className="h-8 w-8" />}
          title="No forms yet"
          description="Create a form to embed on your pages or website."
          action={{
            label: "Create Form",
            onClick: () => { window.location.href = "/dashboard/audience/forms/new"; },
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FormInput className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{form.name}</CardTitle>
                        {form.page && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Page: {form.page.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/api/forms/${form.id}/submit`); toast({ title: "Form action URL copied" }); }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy action URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); toggleStatus(form); }}>
                          {form.status === "active" ? (
                            <><Eye className="h-4 w-4 mr-2" /> Disable</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" /> Enable</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.preventDefault(); setDeleteId(form.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {form.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{form.fields.length} fields</span>
                    <Badge
                      variant={form.status === "active" ? "default" : "secondary"}
                      className="ml-auto text-[10px]"
                    >
                      {form.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete form</DialogTitle>
            <DialogDescription>
              This will permanently delete this form. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteForm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
