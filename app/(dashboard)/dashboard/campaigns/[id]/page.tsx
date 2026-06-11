"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Send, Clock, Copy, BarChart3, Edit3, Save, X, Eye, MousePointerClick, AlertTriangle, UserX, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

type Campaign = {
  id: string;
  title: string;
  subject: string;
  content: string | null;
  contentType: string;
  status: string;
  recipientCount: number;
  sendAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

type Segment = {
  id: string;
  name: string;
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<{
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        const c = res.campaign ?? null;
        setCampaign(c);
        if (c) {
          setEditTitle(c.title);
          setEditSubject(c.subject);
          setEditContent(c.content ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  useEffect(() => {
    fetch("/api/audience/segments")
      .then((r) => r.json())
      .then((res) => setSegments(res.segments ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!params?.id) return;
    setAnalyticsLoading(true);
    fetch(`/api/campaigns/${params.id}/analytics`)
      .then((r) => r.json())
      .then((res) => setAnalytics(res.metrics ?? null))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [params?.id]);


  function openSendDialog() {
    setSelectedSegments([]);
    setSendDialogOpen(true);
  }

  function openScheduleDialog() {
    setScheduleDate("");
    setScheduleTime("");
    setSelectedSegments([]);
    setScheduleDialogOpen(true);
  }

  function toggleSegment(id: string) {
    setSelectedSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function startEditing() {
    if (!campaign) return;
    setEditTitle(campaign.title);
    setEditSubject(campaign.subject);
    setEditContent(campaign.content ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    if (campaign) {
      setEditTitle(campaign.title);
      setEditSubject(campaign.subject);
      setEditContent(campaign.content ?? "");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign) return;
    if (!editTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!editSubject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          subject: editSubject.trim(),
          content: editContent.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");

      setCampaign(data.campaign);
      setEditing(false);
      toast({ title: "Campaign updated" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!campaign) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate");
      toast({ title: "Campaign duplicated" });
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to duplicate",
        variant: "destructive",
      });
    }
  }

  async function handleSend() {
    if (!campaign) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentIds: selectedSegments.length > 0 ? selectedSegments : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast({ title: data.message });
      setSendDialogOpen(false);

      const updated = await fetch(`/api/campaigns/${campaign.id}`).then((r) => r.json());
      setCampaign(updated.campaign ?? null);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!campaign) return;
    if (!scheduleDate || !scheduleTime) {
      toast({ title: "Select a date and time", variant: "destructive" });
      return;
    }

    const sendAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendAt,
          segmentIds: selectedSegments.length > 0 ? selectedSegments : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      toast({ title: "Campaign scheduled" });
      setScheduleDialogOpen(false);

      const updated = await fetch(`/api/campaigns/${campaign.id}`).then((r) => r.json());
      setCampaign(updated.campaign ?? null);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to schedule",
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
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/dashboard/campaigns"><Button variant="outline" className="mt-4">Back to campaigns</Button></Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={cancelEditing}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Edit campaign</h1>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Campaign details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Campaign title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Email subject</Label>
                <Input
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="edit-content">Content ({campaign.contentType})</Label>
              <textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.recipientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{campaign.status}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {analytics && campaign.status !== "draft" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Analytics</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Opened</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.opened}</div>
                <p className="text-xs text-muted-foreground mt-1">{analytics.openRate}% open rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
                <MousePointerClick className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.clicked}</div>
                <p className="text-xs text-muted-foreground mt-1">{analytics.clickRate}% click rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bounced</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.bounced}</div>
                <p className="text-xs text-muted-foreground mt-1">{analytics.bounceRate}% bounce rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
                <UserX className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.unsubscribed}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {analyticsLoading && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {campaign.status === "draft" && (
          <>
            <Button className="gap-2" onClick={openSendDialog}>
              <Send className="h-4 w-4" /> Send now
            </Button>
            <Button variant="outline" className="gap-2" onClick={openScheduleDialog}>
              <Clock className="h-4 w-4" /> Schedule
            </Button>
            <Button variant="outline" className="gap-2" onClick={startEditing}>
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
          </>
        )}
        <Button variant="outline" className="gap-2" onClick={handleDuplicate}>
          <Copy className="h-4 w-4" /> Duplicate
        </Button>
        <Link href={`/dashboard/campaigns/${campaign.id}/analytics`}>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Button>
        </Link>
      </div>

      {campaign.content && (
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.contentType === "html" ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
              />
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {campaign.content}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule campaign</DialogTitle>
            <DialogDescription>
              Choose when to send this campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            {segments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Segments (optional)</Label>
                <div className="space-y-1">
                  {segments.map((seg) => (
                    <label
                      key={seg.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes(seg.id)}
                        onChange={() => toggleSegment(seg.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span>{seg.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={saving || !scheduleDate || !scheduleTime}>
              {saving ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select recipients</DialogTitle>
            <DialogDescription>
              Choose who should receive this campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {segments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Segments</Label>
                <div className="space-y-1">
                  {segments.map((seg) => (
                    <label
                      key={seg.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes(seg.id)}
                        onChange={() => toggleSegment(seg.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span>{seg.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {selectedSegments.length === 0
                ? "No segments selected — will send to all active subscribers."
                : `Sending to ${selectedSegments.length} segment${selectedSegments.length !== 1 ? "s" : ""}.`}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={saving}>
              {saving ? "Sending..." : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
