"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FormInput, Plus, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

type Form = {
  id: string;
  name: string;
  description: string | null;
  _count?: { submissions: number };
  fields: Array<{ id: string; label: string; type: string }>;
  createdAt: string;
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then((res) => setForms(res.forms ?? []))
      .finally(() => setLoading(false));
  }, []);

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
            <Link
              key={form.id}
              href={`/dashboard/forms/${form.id}`}
              className="rounded-lg border p-5 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <FormInput className="h-5 w-5 text-muted-foreground" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">{form.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {form.description ?? `${form.fields?.length ?? 0} fields`}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{form.fields?.length ?? 0} fields</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
