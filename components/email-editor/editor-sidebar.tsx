"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Paintbrush, Sparkles, GripVertical, Loader2, Columns2, Columns3, LayoutGrid } from "lucide-react";
import { type BlockType, BLOCK_TYPE_LABELS, type EmailBlock } from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";
import { DraggableBlockItem } from "./draggable-block-item";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useDraggable } from "@dnd-kit/core";

const CONTAINER_TYPES = [
  { columns: 2, label: "2 Columns", icon: Columns2 },
  { columns: 3, label: "3 Columns", icon: Columns3 },
  { columns: 4, label: "4 Columns", icon: LayoutGrid },
] as const;

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
  const [tab, setTab] = useState<"design" | "layers" | "ai">("design");
  const [containersOpen, setContainersOpen] = useState(false);

  return (
    <div className="w-[260px] border-r bg-white flex flex-col shrink-0 overflow-hidden">
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <linearGradient id="ai-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dd2d4a" />
            <stop offset="100%" stopColor="#2cadc0" />
          </linearGradient>
        </defs>
      </svg>

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
        <button
          onClick={() => setTab("ai")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors",
            tab === "ai"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ stroke: 'url(#ai-gradient)' }} />
            AI
          </span>
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "design" ? <DesignTab containersOpen={containersOpen} setContainersOpen={setContainersOpen} /> :
         tab === "layers" ? <LayersTab /> :
         <AiTab />}
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
        <div className="px-3 pb-2 space-y-0.5">
          {CONTAINER_TYPES.map(({ columns, label, icon: Icon }) => (
            <DraggableContainerItem key={columns} columns={columns} label={label} icon={Icon} />
          ))}
        </div>
      )}

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

function DraggableContainerItem({
  columns,
  label,
  icon: Icon,
}: {
  columns: number;
  label: string;
  icon: React.ElementType;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-container-${columns}`,
    data: { type: "sidebar-container", columnCount: columns },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab",
        "border border-transparent hover:border-border hover:bg-muted/50",
        "transition-all duration-150 select-none group",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 text-muted-foreground group-hover:text-foreground transition-colors">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}

function LayersTab() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
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

function AiTab() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const loadBlocks = useEditorStore((s) => s.loadBlocks);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const blocks: EmailBlock[] = data.blocks;
      if (!blocks || blocks.length === 0) {
        throw new Error("No blocks generated");
      }

      loadBlocks(blocks);
      toast({ title: `Email generated with ${blocks.length} blocks` });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to generate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Describe your email
        </h4>
        <p className="text-xs text-muted-foreground/70 mb-3">
          Tell the AI what kind of email you want, and it will generate blocks for you.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A welcome email for new subscribers with a discount offer"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
        />
      </div>

      <Button
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" style={{ stroke: 'url(#ai-gradient)' }} />
        )}
        {loading ? "Generating..." : "Generate Email"}
      </Button>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Creating your email...
        </div>
      )}
    </div>
  );
}
