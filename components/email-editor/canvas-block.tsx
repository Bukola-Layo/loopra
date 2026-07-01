"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { type EmailBlock, BLOCK_TYPE_LABELS, anyToHtml } from "@/lib/email-builder";
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
  const updateBlock = useEditorStore((s) => s.updateBlock);
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

  function handleUpdate(content: Record<string, string>) {
    updateBlock(block.id, content);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-150",
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
        <BlockPreview block={block} isSelected={isSelected} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}

function RawBlockPreview({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (ref.current) {
      const w = ref.current.offsetWidth;
      setScale(Math.min(1, w / 600));
    }
  }, []);

  const previewHtml = anyToHtml(html);

  if (!previewHtml) {
    return (
      <div className="py-8 px-8 text-center text-sm text-muted-foreground">
        Empty raw HTML block
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden relative"
      style={{ height: Math.max(200, Math.round(400 * scale)) }}
    >
      <iframe
        srcDoc={previewHtml}
        className="absolute top-0 left-0 border-0 origin-top-left pointer-events-none"
        style={{
          width: "600px",
          height: "800px",
          transform: `scale(${scale})`,
        }}
        title="Raw HTML preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

function EditableText({
  value,
  isSelected,
  onBlur,
  className,
  style,
  placeholder,
}: {
  value: string;
  isSelected: boolean;
  onBlur: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (ref.current && !editing) {
      ref.current.textContent = value;
    }
  }, [value, editing]);

  function handleBlur() {
    setEditing(false);
    const text = ref.current?.textContent?.trim() ?? "";
    onBlur(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      ref.current?.blur();
    }
  }

  return (
    <div
      ref={ref}
      contentEditable={isSelected}
      suppressContentEditableWarning
      className={cn(
        className,
        isSelected && "cursor-text ring-1 ring-inset ring-primary/30 rounded-sm px-1 -mx-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
      style={style}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={() => setEditing(true)}
      onInput={() => setEditing(true)}
      onClick={(e) => e.stopPropagation()}
      data-placeholder={!value && isSelected ? (placeholder ?? "Type here...") : undefined}
    >
      {value || placeholder || ""}
    </div>
  );
}

function EditableContainer({
  value,
  isSelected,
  onBlur,
  className,
  style,
  placeholder,
}: {
  value: string;
  isSelected: boolean;
  onBlur: (text: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && !isSelected) {
      ref.current.textContent = value;
    }
  }, [value, isSelected]);

  function handleBlur() {
    const text = ref.current?.textContent?.trim() ?? "";
    onBlur(text);
  }

  return (
    <div
      ref={ref}
      contentEditable={isSelected}
      suppressContentEditableWarning
      className={cn(
        className,
        isSelected && "cursor-text ring-1 ring-inset ring-primary/30 rounded-sm focus:outline-none"
      )}
      style={style}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Escape") { e.currentTarget.textContent = value; e.currentTarget.blur(); } }}
      onClick={(e) => e.stopPropagation()}
    >
      {value || placeholder || ""}
    </div>
  );
}

type BlockPreviewProps = {
  block: EmailBlock;
  isSelected: boolean;
  onUpdate: (content: Record<string, string>) => void;
};

function BlockPreview({ block, isSelected, onUpdate }: BlockPreviewProps) {
  const c = block.content as unknown as Record<string, string>;
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    onUpdate({ ...c, [key]: value });
  }

  function handleFile(file: File, key: string = "src") {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        set(key, e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  switch (block.type) {
    case "header":
      if (c.logoSrc) {
        return (
          <div
            className="py-6 px-8 relative"
            style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
          >
            <img
              src={c.logoSrc}
              alt={c.text ?? "Logo"}
              style={{ maxWidth: `${c.logoWidth ?? "200"}px`, height: "auto", display: "inline-block" }}
              className={isSelected ? "cursor-pointer ring-2 ring-primary/30 rounded" : ""}
              onClick={(e) => {
                if (isSelected) {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }
              }}
            />
            {isSelected && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border hover:bg-muted transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "logoSrc"); }} />
              </>
            )}
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
          <EditableText
            value={c.text ?? ""}
            isSelected={isSelected}
            onBlur={(text) => set("text", text)}
            placeholder="Your Logo"
          />
        </div>
      );

    case "text":
      return (
        <EditableContainer
          value={c.text ?? ""}
          isSelected={isSelected}
          onBlur={(text) => set("text", text)}
          className="py-2 px-8 whitespace-pre-wrap"
          style={{
            fontSize: `${c.fontSize ?? "16"}px`,
            lineHeight: 1.6,
            color: c.color ?? "#374151",
          }}
          placeholder="Enter your text here..."
        />
      );

    case "image":
      return (
        <div className="py-2 px-8 text-center relative">
          {c.src && c.src !== "/placeholder.svg" ? (
            <>
              <img
                src={c.src}
                alt={c.alt ?? "Image"}
                className={cn("max-w-full h-auto mx-auto rounded", isSelected && "ring-2 ring-primary/30")}
                style={{ maxHeight: 200 }}
                onClick={(e) => {
                  if (isSelected) { e.stopPropagation(); fileInputRef.current?.click(); }
                }}
              />
              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border hover:bg-muted transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg py-12 px-4 text-muted-foreground text-sm transition-colors",
                isSelected && "border-primary hover:bg-primary/5 cursor-pointer"
              )}
              onClick={(e) => { if (isSelected) { e.stopPropagation(); fileInputRef.current?.click(); } }}
            >
              <Upload className="h-6 w-6 mx-auto mb-2" />
              {isSelected ? "Click to upload" : "Drop an image or paste a URL"}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      );

    case "button":
      return (
        <div
          className="py-4 px-8"
          style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
        >
          <span
            className={cn(
              "inline-block rounded-md px-6 py-3 text-sm font-semibold",
              isSelected && "ring-2 ring-primary/30"
            )}
            style={{
              backgroundColor: c.bgColor ?? "#6366f1",
              color: c.color ?? "#ffffff",
            }}
          >
            <EditableText
              value={c.text ?? ""}
              isSelected={isSelected}
              onBlur={(text) => set("text", text)}
              placeholder="Click here"
            />
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
          <EditableText
            value={c.text ?? ""}
            isSelected={isSelected}
            onBlur={(text) => set("text", text)}
            placeholder="© 2026 Your Company"
          />
        </div>
      );

    case "logo":
      return (
        <div
          className="py-6 px-8 relative"
          style={{ textAlign: (c.alignment as "left" | "center" | "right") ?? "center" }}
        >
          {c.src ? (
            <>
              <img
                src={c.src}
                alt={c.alt ?? "Logo"}
                style={{ maxWidth: `${c.width ?? "200"}px`, height: "auto", display: "inline-block" }}
                className={isSelected ? "ring-2 ring-primary/30 rounded cursor-pointer" : ""}
                onClick={(e) => { if (isSelected) { e.stopPropagation(); fileInputRef.current?.click(); } }}
              />
              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border hover:bg-muted transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          ) : (
            <div
              className={cn(
                "inline-flex items-center gap-2 px-6 py-4 border-2 border-dashed rounded-lg text-muted-foreground text-sm transition-colors",
                isSelected && "border-primary cursor-pointer hover:bg-primary/5"
              )}
              onClick={(e) => { if (isSelected) { e.stopPropagation(); fileInputRef.current?.click(); } }}
            >
              <Upload className="h-4 w-4" />
              {isSelected ? "Upload logo" : "Upload logo"}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
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
            <EditableText
              value={c.text ?? ""}
              isSelected={isSelected}
              onBlur={(text) => set("text", text)}
              placeholder="Click here"
            />
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

    case "raw":
      return <RawBlockPreview html={c.html ?? ""} />;

    default:
      return <div className="p-4 text-sm text-muted-foreground">Unknown block</div>;
  }
}
