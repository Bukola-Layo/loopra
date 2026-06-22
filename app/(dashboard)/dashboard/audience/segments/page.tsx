"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Plus, Users, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Segment = {
  id: string;
  name: string;
  criteria: Record<string, unknown> | null;
  _count: { members: number };
  createdAt: string;
};

type CriteriaOperator = "equals" | "contains" | "before" | "after";

type CriteriaRow = {
  id: string;
  field: string;
  operator: CriteriaOperator;
  value: string;
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [criteriaRows, setCriteriaRows] = useState<CriteriaRow[]>([
    { id: crypto.randomUUID(), field: "status", operator: "equals", value: "active" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/segments")
      .then((r) => r.json())
      .then((res) => setSegments(res.segments ?? []))
      .finally(() => setLoading(false));
  }, []);

  function addCriteriaRow() {
    setCriteriaRows((prev) => [...prev, { id: crypto.randomUUID(), field: "email", operator: "contains", value: "" }]);
  }

  function removeCriteriaRow(id: string) {
    setCriteriaRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateCriteriaRow(id: string, updates: Partial<CriteriaRow>) {
    setCriteriaRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  async function handleCreateSegment(e: React.FormEvent) {
    e.preventDefault();
    if (!segmentName.trim()) {
      toast({ title: "Segment name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const criteria = criteriaRows
        .filter((r) => r.value.trim())
        .map(({ id: _id, ...rest }) => rest);

      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: segmentName.trim(), criteria: criteria.length > 0 ? { conditions: criteria } : undefined }),
      });

      if (!res.ok) throw new Error("Failed to create segment");
      toast({ title: "Segment created" });
      setDialogOpen(false);
      setSegmentName("");
      setCriteriaRows([{ id: crypto.randomUUID(), field: "status", operator: "equals", value: "active" }]);
      const updated = await fetch("/api/segments").then((r) => r.json());
      setSegments(updated.segments ?? []);
    } catch {
      toast({ title: "Failed to create segment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSegment(id: string, name: string) {
    if (!confirm(`Delete segment "${name}"?`)) return;
    try {
      const res = await fetch(`/api/segments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Segment deleted" });
      setSegments((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast({ title: "Failed to delete segment", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">
            Group subscribers based on shared attributes or behavior.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create segment
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-8 w-8" />}
          title="No segments yet"
          description="Create segments to group your subscribers by tags, activity, or custom criteria."
          action={{
            label: "Create segment",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card key={segment.id} className="relative group">
              <CardHeader>
                <CardTitle className="text-base">{segment.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{segment._count.members} members</span>
                </div>
              </CardContent>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteSegment(segment.id, segment.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create segment</DialogTitle>
            <DialogDescription>
              Define criteria to group your subscribers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSegment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment name</Label>
              <Input id="segment-name" value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="e.g. Engaged users" required />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Criteria</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCriteriaRow}>
                  <Plus className="h-3 w-3 mr-1" /> Add condition
                </Button>
              </div>
              {criteriaRows.map((row) => (
                <div key={row.id} className="flex items-start gap-2 p-3 rounded-lg border">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <select
                      value={row.field}
                      onChange={(e) => updateCriteriaRow(row.id, { field: e.target.value })}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="email">Email</option>
                      <option value="firstName">First name</option>
                      <option value="lastName">Last name</option>
                      <option value="status">Status</option>
                      <option value="createdAt">Created date</option>
                    </select>
                    <select
                      value={row.operator}
                      onChange={(e) => updateCriteriaRow(row.id, { operator: e.target.value as CriteriaOperator })}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                      <option value="before">before</option>
                      <option value="after">after</option>
                    </select>
                    <Input
                      value={row.value}
                      onChange={(e) => updateCriteriaRow(row.id, { value: e.target.value })}
                      placeholder="Value"
                      className="h-9 text-xs"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeCriteriaRow(row.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create segment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
