"use client";

import { ArrowLeft, Monitor, Smartphone, Send, Save, Loader2, Copy, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/use-editor-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

type EditorTopBarProps = {
  backHref: string;
  saveLabel?: string;
  onSave: () => void;
  onSendTest?: () => void;
  onDuplicate?: () => void;
  onUseInCampaign?: () => void;
  saving?: boolean;
};

export function EditorTopBar({
  backHref,
  saveLabel = "Save Template",
  onSave,
  onSendTest,
  onDuplicate,
  onUseInCampaign,
  saving = false,
}: EditorTopBarProps) {
  const viewport = useEditorStore((s) => s.viewport);
  const setViewport = useEditorStore((s) => s.setViewport);
  const documentName = useEditorStore((s) => s.documentName);
  const isDirty = useEditorStore((s) => s.isDirty);

  return (
    <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Link href={backHref}>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </Link>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Draft /</span>
          <input
            value={documentName}
            onChange={(e) => useEditorStore.getState().setDocumentName(e.target.value)}
            className="text-sm font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 focus:border-b focus:border-primary truncate max-w-[200px] px-0 py-0"
            placeholder="Template name"
          />
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Center section — viewport toggle */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1">
        <ViewportButton
          active={viewport === "desktop"}
          onClick={() => setViewport("desktop")}
          icon={<Monitor className="h-4 w-4" />}
          label="Desktop"
        />
        <ViewportButton
          active={viewport === "mobile"}
          onClick={() => setViewport("mobile")}
          icon={<Smartphone className="h-4 w-4" />}
          label="Mobile"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {onSendTest && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onSendTest}>
            <Send className="h-3.5 w-3.5" />
            Send Test
          </Button>
        )}
        {onDuplicate && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
        )}
        {onUseInCampaign && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onUseInCampaign}>
            <PlusCircle className="h-3.5 w-3.5" />
            Use in Campaign
          </Button>
        )}
        <Button
          size="sm"
          className="gap-1.5"
          onClick={onSave}
          disabled={saving}
          style={{ backgroundColor: "var(--color-role-primary)" }}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}

function ViewportButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
        active
          ? "bg-white shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
