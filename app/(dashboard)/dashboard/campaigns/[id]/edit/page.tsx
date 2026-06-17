"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VisualEditor } from "@/components/email-editor/visual-editor";
import { type EmailBlock, deserializeBlocks, serializeBlocks, createBlock } from "@/lib/email-builder";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EditCampaignRoute() {
  const params = useParams();
  const [campaign, setCampaign] = useState<{ id: string; title: string; subject: string; content: string | null; contentType: string } | null>(null);
  const [blocks, setBlocks] = useState<EmailBlock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        const c = res.campaign;
        if (c) {
          setCampaign(c);
          const parsed = deserializeBlocks(c.content ?? "");
          setBlocks(parsed ?? [createBlock("text")]);
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleSave(updatedBlocks: EmailBlock[]) {
    if (!campaign) return;
    setSaving(true);
    try {
      const serialized = serializeBlocks(updatedBlocks);
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: serialized }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Campaign content saved" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!campaign) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: serializeBlocks(blocks ?? []) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send test");
      toast({ title: "Test email sent!" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send test",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign || !blocks) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  return (
    <VisualEditor
      initialBlocks={blocks}
      documentName={campaign.title}
      onSave={handleSave}
      backHref={`/dashboard/campaigns/${campaign.id}`}
      saving={saving}
      onSendTest={handleSendTest}
    />
  );
}
