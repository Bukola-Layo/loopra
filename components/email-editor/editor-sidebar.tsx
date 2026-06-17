"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Paintbrush, GripVertical } from "lucide-react";
import { type BlockType, BLOCK_TYPE_LABELS } from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";
import { DraggableBlockItem } from "./draggable-block-item";
import { cn } from "@/lib/utils";

const CONTENT_BLOCKS: BlockType[] = [
  "header",
  "text",
  "image",
  "logo",
  "button",
  "link",
  "divider",
  "social",
  "footer",
  "spacer",
];

export function EditorSidebar() {
  const [tab, setTab] = useState<"design" | "layers">("design");
  const [containersOpen, setContainersOpen] = useState(false);

  return (
    <div className="w-[260px] border-r bg-white flex flex-col shrink-0 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b shrink-0">
        <button
          onClick={() => setTab("design")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors",
            tab === "design"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Paintbrush className="h-3.5 w-3.5" />
            Design
          </span>
        </button>
        <button
          onClick={() => setTab("layers")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors",
            tab === "layers"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Layers
          </span>
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "design" ? <DesignTab containersOpen={containersOpen} setContainersOpen={setContainersOpen} /> : <LayersTab />}
      </div>

      {/* Bottom help */}
      <div className="border-t p-3 shrink-0">
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-base">💬</span>
          Need Help?
        </button>
      </div>
    </div>
  );
}

function DesignTab({
  containersOpen,
  setContainersOpen,
}: {
  containersOpen: boolean;
  setContainersOpen: (v: boolean) => void;
}) {
  return (
    <div className="p-3 space-y-1">
      {/* Containers section (collapsed placeholder for future) */}
      <button
        onClick={() => setContainersOpen(!containersOpen)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5" />
          Containers
        </span>
        {containersOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {containersOpen && (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center border rounded-lg border-dashed">
          Multi-column containers coming soon
        </div>
      )}

      {/* Content blocks */}
      <div className="pt-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content
          </span>
        </div>
        <div className="space-y-0.5">
          {CONTENT_BLOCKS.map((type) => (
            <DraggableBlockItem key={type} blockType={type} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LayersTab() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  if (blocks.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No layers yet. Drag blocks from the Design tab.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      {blocks.map((block, i) => (
        <button
          key={block.id}
          onClick={() => selectBlock(block.id)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors text-sm",
            selectedBlockId === block.id
              ? "bg-primary/10 text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <span className="text-xs text-muted-foreground/60 w-5 text-right">
            {i + 1}
          </span>
          <span className="flex-1 truncate">{BLOCK_TYPE_LABELS[block.type]}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveBlock(block.id, "up");
              }}
              disabled={i === 0}
              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveBlock(block.id, "down");
              }}
              disabled={i === blocks.length - 1}
              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </button>
      ))}
    </div>
  );
}
