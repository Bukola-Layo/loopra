"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplatePreview } from "@/components/templates/template-preview";
import {
  ArrowLeft,
  Copy,
  Send,
  Edit3,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type EmailTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  industry: string | null;
  source: string;
  html: string | null;
  thumbnail: string | null;
};

type UserTemplate = {
  id: string;
  name: string;
  html: string | null;
  thumbnail: string | null;
};

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<EmailTemplate | UserTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserTemplate, setIsUserTemplate] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);

    fetch(`/api/templates/library/${params.id}`)
      .then((r) => {
        if (r.ok) return r.json().then((d) => {
          if (d.template) {
            setTemplate(d.template);
            setIsUserTemplate(false);
            return;
          }
          throw new Error("Not found");
        });
        if (r.status === 404) throw new Error("Not found");
        throw new Error("Failed");
      })
      .catch(() => {
        fetch(`/api/templates/user/${params.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.template) {
              setTemplate({ ...d.template, source: "USER_TEMPLATE" });
              setIsUserTemplate(true);
            }
          })
          .catch(() => setTemplate(null))
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleDuplicate() {
    if (!template) return;
    setDuplicating(true);
    try {
      const res = await fetch("/api/templates/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Duplicated to My Templates" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to duplicate",
        variant: "destructive",
      });
    } finally {
      setDuplicating(false);
    }
  }

  async function handleUseTemplate() {
    if (!template) return;
    setUsingTemplate(true);
    try {
      const html = (template as EmailTemplate).html ?? (template as UserTemplate).html ?? "";

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.name,
          subject: `New campaign from ${template.name}`,
          content: html,
          contentType: "html",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
      toast({ title: "Campaign created from template" });
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setUsingTemplate(false);
    }
  }

  async function handleDelete() {
    if (!template || !confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/templates/user/${template.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Template deleted" });
      router.push("/dashboard/templates");
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
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

  const html = (template as EmailTemplate).html ?? (template as UserTemplate).html ?? "";
  const source = (template as EmailTemplate).source ?? "USER_TEMPLATE";
  const description = (template as EmailTemplate).description;
  const category = (template as EmailTemplate).category;
  const industry = (template as EmailTemplate).industry;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
          {(category || industry) && (
            <div className="flex gap-2 mt-1">
              {category && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{category}</span>
              )}
              {industry && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{industry}</span>
              )}
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                {source}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="gap-2"
            onClick={handleUseTemplate}
            disabled={usingTemplate || !html}
          >
            {usingTemplate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {usingTemplate ? "Creating..." : "Use Template"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDuplicate}
            disabled={duplicating}
          >
            {duplicating ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {duplicating ? "Duplicated" : "Duplicate"}
          </Button>
          {isUserTemplate && (
            <>
              <Link href={`/dashboard/templates/${template.id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {html ? (
        <TemplatePreview html={html} />
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground">This template has no content</p>
        </div>
      )}
    </div>
  );
}
