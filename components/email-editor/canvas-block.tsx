"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { type EmailBlock, BLOCK_TYPE_LABELS } from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";

type CanvasBlockProps = {
  block: EmailBlock;
  index: number;
  total: number;
};

export function CanvasBlock({ block, index, total }: CanvasBlockProps) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const isSelected = selectedBlockId === block.id;

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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group cursor-pointer transition-all duration-150",
        isDragging && "opacity-40 z-50",
        isSelected
          ? "ring-2 ring-[var(--color-accent-4)] ring-offset-1 rounded-sm"
          : "hover:ring-1 hover:ring-border hover:ring-offset-1 rounded-sm"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Floating toolbar */}
      <div
        className={cn(
          "absolute -top-3 right-2 z-20 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-white border shadow-sm transition-opacity duration-150",
          isSelected || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation();
            moveBlock(block.id, "up");
          }}
          disabled={index === 0}
          aria-label="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation();
            moveBlock(block.id, "down");
          }}
          disabled={index === total - 1}
          aria-label="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          aria-label="Delete block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block type label chip */}
      {isSelected && (
        <div className="absolute -top-3 left-2 z-20 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide bg-[var(--color-accent-4)] text-white">
          {BLOCK_TYPE_LABELS[block.type]}
        </div>
      )}

      {/* Block content preview */}
      <div className="min-h-[32px]">
        <BlockPreview block={block} />
      </div>
    </div>
  );
}

/** Renders a simplified visual preview of a block inside the canvas */
function BlockPreview({ block }: { block: EmailBlock }) {
  const c = block.content;

  switch (block.type) {
    case "header":
      if (c.logoSrc) {
        return (
          <div
            className="py-6 px-8"
            style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
          >
            <img
              src={c.logoSrc}
              alt={c.text ?? "Logo"}
              style={{ maxWidth: `${c.logoWidth ?? "200"}px`, height: "auto", display: "inline-block" }}
            />
          </div>
        );
      }
      return (
        <div
          className="py-6 px-8"
          style={{
            textAlign: (c.alignment as "left" | "center" | "right") ?? "center",
            fontSize: `${c.fontSize ?? "24"}px`,
            fontWeight: 700,
            color: c.color ?? "#111827",
          }}
        >
          {c.text || "Your Logo"}
        </div>
      );

    case "text":
      return (
        <div
          className="py-2 px-8 whitespace-pre-wrap"
          style={{
            fontSize: `${c.fontSize ?? "16"}px`,
            lineHeight: 1.6,
            color: c.color ?? "#374151",
          }}
        >
          {c.text || "Enter your text here..."}
        </div>
      );

    case "image":
      return (
        <div className="py-2 px-8 text-center">
          {c.src && c.src !== "/placeholder.svg" ? (
            <img
              src={c.src}
              alt={c.alt ?? "Image"}
              className="max-w-full h-auto mx-auto rounded"
              style={{ maxHeight: 200 }}
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg py-12 px-4 text-muted-foreground text-sm">
              Drop an image or paste a URL
            </div>
          )}
        </div>
      );

    case "button":
      return (
        <div
          className="py-4 px-8"
          style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
        >
          <span
            className="inline-block rounded-md px-6 py-3 text-sm font-semibold"
            style={{
              backgroundColor: c.bgColor ?? "#6366f1",
              color: c.color ?? "#ffffff",
            }}
          >
            {c.text || "Click here"}
          </span>
        </div>
      );

    case "divider":
      return (
        <div className="py-4 px-8">
          <hr style={{ borderColor: c.color ?? "#e5e7eb", borderStyle: "solid" }} />
        </div>
      );

    case "spacer":
      return (
        <div
          className="flex items-center justify-center text-[10px] text-muted-foreground/50 uppercase tracking-wide"
          style={{ height: `${c.height ?? "24"}px` }}
        >
          spacer
        </div>
      );

    case "footer":
      return (
        <div
          className="py-4 px-8 text-center"
          style={{
            fontSize: `${c.fontSize ?? "12"}px`,
            color: c.color ?? "#9ca3af",
          }}
        >
          {c.text || "© 2026 Your Company"}
        </div>
      );

    case "logo":
      return (
        <div
          className="py-6 px-8"
          style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
        >
          {c.src ? (
            <img
              src={c.src}
              alt={c.alt ?? "Logo"}
              style={{ maxWidth: `${c.width ?? "200"}px`, height: "auto", display: "inline-block" }}
            />
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
              <span>Upload logo</span>
            </div>
          )}
        </div>
      );

    case "link":
      return (
        <div
          className="py-2 px-8"
          style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
        >
          <span
            className="underline"
            style={{
              fontSize: `${c.fontSize ?? "14"}px`,
              color: c.color ?? "#6366f1",
            }}
          >
            {c.text || "Click here"}
          </span>
        </div>
      );

    case "social":
      return (
        <div
          className="py-4 px-8 flex gap-3 flex-wrap"
          style={{ justifyContent: c.alignment === "left" ? "flex-start" : c.alignment === "right" ? "flex-end" : "center" }}
        >
          {["facebook", "twitter", "instagram", "linkedin", "youtube"]
            .filter((k) => c[k])
            .map((k) => (
              <span key={k} className="text-xs text-muted-foreground underline capitalize">
                {k}
              </span>
            ))}
          {!["facebook", "twitter", "instagram", "linkedin", "youtube"].some((k) => c[k]) && (
            <span className="text-xs text-muted-foreground">Add social links →</span>
          )}
        </div>
      );

    default:
      return <div className="p-4 text-sm text-muted-foreground">Unknown block</div>;
  }
}
