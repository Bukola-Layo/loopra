"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  type EmailBlock,
  deserializeBlocks,
  serializeBlocks,
  createBlock,
} from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type VisualEditorProps = {
  initialBlocks: EmailBlock[];
  documentName: string;
  onSave: (blocks: EmailBlock[]) => void;
  backHref: string;
  saveLabel?: string;
  saving?: boolean;
  onSendTest?: () => void;
  onDuplicate?: () => void;
  onUseInCampaign?: () => void;
};

const VisualEditor = dynamic<VisualEditorProps>(
  () => import("@/components/email-editor/visual-editor").then((m) => m.VisualEditor),
  { ssr: false }
);

type TemplateData = {
  id: string;
  name: string;
  content: string | null;
};

export default function EditTemplateRoute() {
  const params = useParams();
  const router = useRouter();
  const currentBlocks = useEditorStore((s) => s.blocks);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [blocks, setBlocks] = useState<EmailBlock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUserTemplate, setIsUserTemplate] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    async function loadTemplate() {
      const id = params.id as string;

      // Try workspace template
      try {
        const r1 = await fetch(`/api/templates/${id}`);
        if (r1.ok) {
          const res = await r1.json();
          const t = res.template;
          if (t) {
            setTemplate({ id: t.id, name: t.name, content: t.content });
            const parsed = deserializeBlocks(t.content ?? "");
            if (parsed) {
              setBlocks(parsed);
            } else if (t.content) {
              setBlocks([{ ...createBlock("raw"), content: { html: t.content } }]);
            } else {
              setBlocks([createBlock("text")]);
            }
            return;
          }
        }
      } catch { /* fall through */ }

      // Try user template
      try {
        const r2 = await fetch(`/api/templates/user/${id}`);
        if (r2.ok) {
          const res = await r2.json();
          const t = res.template;
          if (t) {
            setTemplate({ id: t.id, name: t.name, content: t.html });
            const parsed = deserializeBlocks(t.html ?? "");
            if (parsed) {
              setBlocks(parsed);
            } else if (t.html) {
              setBlocks([{ ...createBlock("raw"), content: { html: t.html } }]);
            } else {
              setBlocks([createBlock("text")]);
            }
            setIsUserTemplate(true);
            return;
          }
        }
      } catch { /* fall through */ }

      // Try library template
      try {
        const r3 = await fetch(`/api/templates/library/${id}`);
        if (r3.ok) {
          const res = await r3.json();
          const t = res.template;
          if (t) {
            setTemplate({ id: t.id, name: t.name, content: t.html });
            const parsed = deserializeBlocks(t.html ?? "");
            if (parsed) {
              setBlocks(parsed);
            } else if (t.html) {
              setBlocks([{ ...createBlock("raw"), content: { html: t.html } }]);
            } else {
              setBlocks([createBlock("text")]);
            }
            return;
          }
        }
      } catch { /* fall through */ }

      // Not found in any source
      setTemplate(null);
    }

    loadTemplate().finally(() => setLoading(false));
  }, [params?.id]);

  async function handleDuplicate() {
    if (!template) return;
    const serialized = serializeBlocks(currentBlocks.length ? currentBlocks : blocks!);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (copy)`,
          content: serialized,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate");
      toast({ title: "Template duplicated" });
      router.push(`/dashboard/templates/${data.template.id}/edit`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to duplicate",
        variant: "destructive",
      });
    }
  }

  async function handleUseInCampaign() {
    if (!template) return;
    const serialized = serializeBlocks(currentBlocks.length ? currentBlocks : blocks!);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.name,
          subject: `New campaign from ${template.name}`,
          content: serialized,
          contentType: "html",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
      toast({ title: "Campaign created from template" });
      router.push(`/dashboard/campaigns/${data.campaign.id}/edit`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to create campaign",
        variant: "destructive",
      });
    }
  }

  async function handleSave(updatedBlocks: EmailBlock[]) {
    if (!template) return;
    setSaving(true);
    try {
      const serialized = serializeBlocks(updatedBlocks);
      const currentName = useEditorStore.getState().documentName;

      if (isUserTemplate) {
        const res = await fetch(`/api/templates/user/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentName,
            html: serialized,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentName,
            content: serialized,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      }

      setTemplate((prev) => prev ? { ...prev, name: currentName } : null);
      useEditorStore.getState().markClean();
      toast({ title: "Template saved" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template || !blocks) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

  return (
    <VisualEditor
      initialBlocks={blocks}
      documentName={template.name}
      onSave={handleSave}
      backHref="/dashboard/templates"
      saving={saving}
      onDuplicate={handleDuplicate}
      onUseInCampaign={handleUseInCampaign}
    />
  );
}
