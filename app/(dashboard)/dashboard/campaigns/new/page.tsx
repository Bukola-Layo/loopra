"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { anyToHtml } from "@/lib/email-builder";
import { AiPanel } from "@/components/ai/ai-panel";

type Template = {
  id: string;
  name: string;
  content: string | null;
};

export default function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"html" | "markdown">("html");
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((res) => {
        const list = res.templates ?? [];
        setTemplates(list);

        const templateId = searchParams.get("template");
        if (templateId) {
          const match = list.find((t: Template) => t.id === templateId);
          if (match) {
            setSelectedTemplateId(match.id);
            setContent(anyToHtml(match.content));
          }
        }
      });
  }, [searchParams]);

  function handleTemplateSelect(id: string) {
    setSelectedTemplateId(id);
    if (!id) return;
    const t = templates.find((t) => t.id === id);
    if (t) setContent(anyToHtml(t.content));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Campaign title is required", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Email subject is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          content: content.trim() || undefined,
          contentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");

      toast({ title: "Campaign created" });
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New campaign</h1>
          <p className="text-sm text-muted-foreground">
            Create a newsletter campaign to send to your audience.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Campaign details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. December Newsletter"
                required
              />
              <p className="text-xs text-muted-foreground">
                Internal name — subscribers won&apos;t see this.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Our December newsletter is here!"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-type">Content type</Label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as "html" | "markdown")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Email content</CardTitle>
            <div className="flex items-center gap-2">
              <AiPanel
                onInsertContent={(c) => setContent(c)}
                onInsertSubject={(s) => setSubject(s)}
                currentContent={content}
              />
              <Link href="/dashboard/templates">
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <FileText className="h-3 w-3" /> Browse templates
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template-select">Start from a template</Label>
                <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- None (blank) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  contentType === "html"
                    ? "<h1>Hello!</h1><p>Start writing your email here...</p>"
                    : "# Hello!\n\nStart writing your email here..."
                }
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/dashboard/campaigns">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
