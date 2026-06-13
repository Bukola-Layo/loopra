"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GripVertical,
  Trash2,
  Plus,
  Code,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import {
  type EmailBlock,
  type BlockType,
  createBlock,
  blocksToHtml,
  BLOCK_TYPE_LABELS,
} from "@/lib/email-builder";

const BLOCK_TYPES: BlockType[] = [
  "header",
  "text",
  "image",
  "button",
  "divider",
  "spacer",
  "footer",
];

type BlockEditorProps = {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
};

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [mode, setMode] = useState<"edit" | "html">("edit");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [htmlChanged, setHtmlChanged] = useState(false);
  const htmlDirty = useRef(false);

  const generatedHtml = blocksToHtml(blocks);

  useEffect(() => {
    if (mode === "html" && !htmlDirty.current) {
      setHtmlDraft(generatedHtml);
      setHtmlChanged(false);
    }
  }, [mode, generatedHtml]);

  function enterHtmlMode() {
    setHtmlDraft(generatedHtml);
    setHtmlChanged(false);
    htmlDirty.current = false;
    setMode("html");
  }

  function applyHtmlToBlocks() {
    const textBlock = createBlock("text");
    textBlock.content.text = decodeHtmlEntities(htmlDraft);
    onChange([textBlock]);
    setHtmlChanged(false);
    htmlDirty.current = false;
    setMode("edit");
  }

  function leaveHtmlMode() {
    if (htmlDirty.current && htmlDraft !== generatedHtml) {
      applyHtmlToBlocks();
    }
    htmlDirty.current = false;
    setHtmlChanged(false);
    setMode("edit");
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    },
    [blocks, onChange]
  );

  function addBlock(type: BlockType) {
    onChange([...blocks, createBlock(type)]);
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id === id);
    if (direction === "up" && idx > 0) {
      onChange(arrayMove(blocks, idx, idx - 1));
    } else if (direction === "down" && idx < blocks.length - 1) {
      onChange(arrayMove(blocks, idx, idx + 1));
    }
  }

  function updateBlock(id: string, content: Record<string, string>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant={mode === "edit" ? "default" : "ghost"}
            size="sm"
            className="gap-1"
            onClick={() => mode === "html" ? leaveHtmlMode() : setMode("edit")}
          >
            <Plus className="h-3 w-3" /> Edit
          </Button>
          <Button
            type="button"
            variant={mode === "html" ? "default" : "ghost"}
            size="sm"
            className="gap-1"
            onClick={enterHtmlMode}
          >
            <Code className="h-3 w-3" /> HTML
          </Button>
        </div>
        {htmlChanged && mode === "html" && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Modified
          </span>
        )}
      </div>

      {mode === "edit" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground self-center mr-1">Add block:</span>
            {BLOCK_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock(type)}
              >
                + {BLOCK_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {blocks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg">
                    Add blocks above to build your email template.
                  </p>
                )}
                {blocks.map((block, i) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    index={i}
                    total={blocks.length}
                    onRemove={removeBlock}
                    onMove={moveBlock}
                    onUpdate={updateBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {mode === "html" && (
        <div className="space-y-3">
          <textarea
            value={htmlDraft}
            onChange={(e) => {
              setHtmlDraft(e.target.value);
              setHtmlChanged(e.target.value !== generatedHtml);
              htmlDirty.current = true;
            }}
            className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {htmlDirty.current && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={applyHtmlToBlocks}
              >
                Apply HTML to blocks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHtmlDraft(generatedHtml);
                  setHtmlChanged(false);
                  htmlDirty.current = false;
                }}
              >
                Reset to blocks
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const VIEWPORT_WIDTHS = {
  desktop: "100%",
  tablet: "600px",
  mobile: "375px",
} as const;

export type Viewport = keyof typeof VIEWPORT_WIDTHS;

const EMAIL_DOC = [
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
  '<body style="margin:0;padding:0;background-color:#f4f4f5;">',
  '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td align="center" style="padding:24px 16px;">',
  '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">',
  '<tr><td style="padding:0;">{{BODY}}</td></tr>',
  '</table></td></tr></table></body></html>',
].join("\n");

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/&amp;/g, "&");
}

function buildEmailHtml(blocks: EmailBlock[]): string {
  const allTextBlocks = blocks.every((b) => b.type === "text");
  if (allTextBlocks) {
    const body = blocks.map((b) => b.content.text ?? "").join("\n");
    const decoded = decodeHtmlEntities(body);
    if (/<!DOCTYPE|<html|<head|<body/i.test(decoded)) {
      return decoded;
    }
    return EMAIL_DOC.replace("{{BODY}}", decoded.replace(/\$/g, "$$$$"));
  }
  return blocksToHtml(blocks);
}

export function EmailPreview({ blocks, viewport }: { blocks: EmailBlock[]; viewport: Viewport }) {
  const html = buildEmailHtml(blocks);

  if (!blocks.length) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
        Add blocks to see a live preview.
      </div>
    );
  }

  const iframeWidth = VIEWPORT_WIDTHS[viewport];

  return (
    <div className="flex justify-center">
      <div
        className="border rounded-lg overflow-hidden bg-gray-100 transition-all"
        style={{ width: iframeWidth, maxWidth: "100%" }}
      >
        <div className="bg-white border-b px-4 py-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium text-foreground">Loopra</span>
          <span className="truncate">Newsletter</span>
          <span className="ml-auto text-[10px]">to me</span>
        </div>
        <div className="bg-[#f4f4f5]" style={{ minHeight: viewport === "mobile" ? "600px" : "500px" }}>
          <iframe
            srcDoc={html}
            title="Email preview"
            sandbox="allow-same-origin"
            className="w-full"
            style={{ border: "none", minHeight: viewport === "mobile" ? "600px" : "500px" }}
          />
        </div>
      </div>
    </div>
  );
}

type SortableBlockProps = {
  block: EmailBlock;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onUpdate: (id: string, content: Record<string, string>) => void;
};

function SortableBlock({ block, index, total, onRemove, onMove, onUpdate }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg bg-card"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-muted-foreground uppercase flex-1">
          {BLOCK_TYPE_LABELS[block.type]}
        </span>
        <button
          onClick={() => onMove(block.id, "up")}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onMove(block.id, "down")}
          disabled={index === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onRemove(block.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3">
        <BlockFields block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

type BlockFieldsProps = {
  block: EmailBlock;
  onUpdate: (id: string, content: Record<string, string>) => void;
};

function BlockFields({ block, onUpdate }: BlockFieldsProps) {
  const c = block.content;

  function set(key: string, value: string) {
    onUpdate(block.id, { ...block.content, [key]: value });
  }

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Your Logo" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Font size</Label>
              <Input value={c.fontSize ?? "24"} onChange={(e) => set("fontSize", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input value={c.color ?? "#111827"} onChange={(e) => set("color", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Align</Label>
              <select value={c.alignment ?? "center"} onChange={(e) => set("alignment", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Content</Label>
            <textarea
              value={c.text ?? ""}
              onChange={(e) => set("text", e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Enter your text..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Font size</Label>
              <Input value={c.fontSize ?? "16"} onChange={(e) => set("fontSize", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input value={c.color ?? "#374151"} onChange={(e) => set("color", e.target.value)} />
            </div>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Image URL</Label>
            <Input value={c.src ?? ""} onChange={(e) => set("src", e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alt text</Label>
            <Input value={c.alt ?? ""} onChange={(e) => set("alt", e.target.value)} placeholder="Image description" />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Text</Label>
              <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Click here" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input value={c.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Text color</Label>
              <Input value={c.color ?? "#ffffff"} onChange={(e) => set("color", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BG color</Label>
              <Input value={c.bgColor ?? "#6366f1"} onChange={(e) => set("bgColor", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alignment</Label>
            <select value={c.alignment ?? "center"} onChange={(e) => set("alignment", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <Input value={c.color ?? "#e5e7eb"} onChange={(e) => set("color", e.target.value)} />
        </div>
      );

    case "spacer":
      return (
        <div className="space-y-1">
          <Label className="text-xs">Height (px)</Label>
          <Input value={c.height ?? "24"} onChange={(e) => set("height", e.target.value)} />
        </div>
      );

    case "footer":
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="© 2026 Your Company" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Font size</Label>
              <Input value={c.fontSize ?? "12"} onChange={(e) => set("fontSize", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input value={c.color ?? "#9ca3af"} onChange={(e) => set("color", e.target.value)} />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
