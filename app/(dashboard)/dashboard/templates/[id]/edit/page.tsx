"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VisualEditor } from "@/components/email-editor/visual-editor";
import { type EmailBlock, deserializeBlocks, serializeBlocks, createBlock } from "@/lib/email-builder";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type TemplateData = {
  id: string;
  name: string;
  content: string | null;
};

export default function EditTemplateRoute() {
  const params = useParams();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [blocks, setBlocks] = useState<EmailBlock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUserTemplate, setIsUserTemplate] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    // Try old Template API first, fallback to UserTemplate API
    fetch(`/api/templates/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((res) => {
        const t = res.template;
        if (t) {
          setTemplate({ id: t.id, name: t.name, content: t.content });
          const parsed = deserializeBlocks(t.content ?? "");
          setBlocks(parsed ?? [createBlock("text")]);
        }
      })
      .catch(() => {
        fetch(`/api/templates/user/${params.id}`)
          .then((r) => {
            if (!r.ok) throw new Error("Not found");
            return r.json();
          })
          .then((res) => {
            const t = res.template;
            if (t) {
              setTemplate({ id: t.id, name: t.name, content: t.html });
              const parsed = deserializeBlocks(t.html ?? "");
              setBlocks(parsed ?? [createBlock("text")]);
              setIsUserTemplate(true);
            }
          })
          .catch(() => setTemplate(null))
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleSave(updatedBlocks: EmailBlock[]) {
    if (!template) return;
    setSaving(true);
    try {
      const serialized = serializeBlocks(updatedBlocks);

      if (isUserTemplate) {
        const res = await fetch(`/api/templates/user/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            html: serialized,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: serialized,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
      }

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
    />
  );
}
