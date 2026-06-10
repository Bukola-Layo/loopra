"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Mail, Calendar, Edit, Trash2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { tagColorStyle } from "@/lib/tag-colors";
import { subscriberStatusStyle } from "@/lib/subscriber-status";
import { SUBSCRIBER_SOURCES, sourceLabel } from "@/lib/subscriber-source";

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  source: string;
  customFields: Record<string, unknown> | null;
  tags: Array<{ tag: string }>;
  createdAt: string;
  lastEngagedAt: string | null;
};

export default function SubscriberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editSource, setEditSource] = useState("manual");
  const [editTagInput, setEditTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/audience/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        const sub = res.subscriber ?? null;
        setSubscriber(sub);
        if (sub) {
          setEditFirstName(sub.firstName ?? "");
          setEditLastName(sub.lastName ?? "");
          setEditStatus(sub.status);
          setEditSource(sub.source ?? "manual");
          setEditTags(sub.tags?.map((t: { tag: string }) => t.tag) ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  function addTag() {
    const t = editTagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) setEditTags((prev) => [...prev, t]);
    setEditTagInput("");
  }

  function removeTag(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/audience/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim() || undefined,
          lastName: editLastName.trim() || undefined,
          status: editStatus,
          source: editSource,
          tags: editTags.length > 0 ? editTags : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setSubscriber(data.subscriber);
      toast({ title: "Subscriber updated" });
      setEditOpen(false);
    } catch {
      toast({ title: "Failed to update subscriber", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteClick() {
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteConfirmOpen(false);
    try {
      const res = await fetch(`/api/audience/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Subscriber deleted" });
      router.push("/dashboard/audience");
    } catch {
      toast({ title: "Failed to delete subscriber", variant: "destructive" });
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Subscriber not found</p>
        <Link href="/dashboard/audience"><Button variant="outline" className="mt-4">Back to audience</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/audience">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {subscriber.firstName || subscriber.lastName
              ? `${subscriber.firstName ?? ""} ${subscriber.lastName ?? ""}`.trim()
              : subscriber.email}
          </h1>
          {subscriber.firstName && (
            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDeleteClick} disabled={deleting}>
          <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
        </Button>
        <Badge style={subscriberStatusStyle(subscriber.status)}>
          {subscriber.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{subscriber.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Subscribed {new Date(subscriber.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-xs">⌂</span>
              <span>Source: {sourceLabel(subscriber.source)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriber.tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subscriber.tags.map((t) => (
                  <span key={t.tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={tagColorStyle(t.tag)}>{t.tag}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {subscriber.customFields && Object.keys(subscriber.customFields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(subscriber.customFields).map(([key, value]) => (
                <div key={key} className="flex text-sm">
                  <span className="text-muted-foreground w-32">{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit subscriber</DialogTitle>
            <DialogDescription>
              Update subscriber information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={subscriber.email} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-first">First name</Label>
                <Input id="edit-first" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last">Last name</Label>
                <Input id="edit-last" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-source">Source</Label>
              <select
                id="edit-source"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SUBSCRIBER_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Type tag and press Enter"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold gap-1" style={tagColorStyle(tag)}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete subscriber</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscriber? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
