"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormInput, Plus, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type Form = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "disabled";
  _count?: { submissions: number };
  fields: Array<{ id: string; label: string; type: string }>;
  createdAt: string;
};

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionForm, setActionForm] = useState<Form | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then((res) => setForms(res.forms ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(form: Form) {
    const newStatus = form.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms((prev) => prev.map((f) => (f.id === form.id ? data.form : f)));
      toast({ title: `Form ${newStatus === "active" ? "enabled" : "disabled"}` });
    } catch {
      toast({ title: "Failed to update form", variant: "destructive" });
    }
  }

  async function deleteForm() {
    if (!actionForm) return;
    try {
      const res = await fetch(`/api/forms/${actionForm.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setForms((prev) => prev.filter((f) => f.id !== actionForm.id));
      setConfirmOpen(false);
      setActionForm(null);
      toast({ title: "Form deleted" });
    } catch {
      toast({ title: "Failed to delete form", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground mt-1">
            Build signup forms to capture new subscribers.
          </p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create form
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon={<FormInput className="h-8 w-8" />}
          title="No forms yet"
          description="Create a signup form to embed on your website or share as a hosted page."
          action={{
            label: "Create form",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="rounded-lg border bg-white hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden group"
            >
              <Link href={`/dashboard/forms/${form.id}`}>
                <img className="w-full h-40 object-cover border-b" src="/images/illustrations/form-card.svg" alt="" />
              </Link>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <FormInput className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleStatus(form)}>
                        {form.status === "active" ? (
                          <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
                        ) : (
                          <><Power className="h-4 w-4 mr-2" /> Enable</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setActionForm(form);
                          setConfirmOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/dashboard/forms/${form.id}`}>
                  <h3 className="font-medium mb-1">{form.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {form.description ?? `${form.fields?.length ?? 0} fields`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <StatusBadge status={form.status} />
                    <span>{form.fields?.length ?? 0} fields</span>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{actionForm?.name}"? This action cannot be undone. All fields and submissions will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmOpen(false); setActionForm(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={deleteForm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
