"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "@/store/use-editor-store";
import { BLOCK_TYPE_LABELS, type EmailBlock } from "@/lib/email-builder";
import { Trash2, Upload, MousePointer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorProperties() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  if (!selectedBlock) {
    return (
      <div className="w-[300px] border-l bg-white flex flex-col items-center justify-center shrink-0 overflow-hidden">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <MousePointer className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Select a block
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click any block on the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] border-l bg-white flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="text-sm font-semibold text-foreground">
          {BLOCK_TYPE_LABELS[selectedBlock.type]}
        </h3>
        <button
          onClick={() => removeBlock(selectedBlock.id)}
          className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Delete block"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <BlockSpecificProperties
          block={selectedBlock}
          onUpdate={(content) => updateBlock(selectedBlock.id, content)}
        />

        {/* Universal properties */}
        <UniversalProperties
          block={selectedBlock}
          onUpdate={(content) => updateBlock(selectedBlock.id, content)}
        />
      </div>
    </div>
  );
}

function BlockSpecificProperties({
  block,
  onUpdate,
}: {
  block: EmailBlock;
  onUpdate: (content: Record<string, string>) => void;
}) {
  const c = block.content;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
      return (
        <div className="space-y-4">
          <PropertySection title="Logo Image">
            <ImageUploadArea
              src={c.logoSrc}
              onFile={(f) => handleFile(f, "logoSrc")}
              onClear={() => set("logoSrc", "")}
              dragOver={dragOver}
              setDragOver={setDragOver}
              fileInputRef={fileInputRef}
              accept="image/*"
              setKey="logoSrc"
              set={set}
            />
            {c.logoSrc && (
              <SliderField
                label="Logo Width"
                value={c.logoWidth ?? "200"}
                min={50}
                max={400}
                unit="px"
                onChange={(v) => set("logoWidth", v)}
              />
            )}
          </PropertySection>
          <PropertySection title="Fallback Text">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Text</Label>
                <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Your Logo" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <Input value={c.fontSize ?? "24"} onChange={(e) => set("fontSize", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <ColorInput value={c.color ?? "#111827"} onChange={(v) => set("color", v)} />
                </div>
              </div>
              <AlignmentSelect value={c.alignment ?? "center"} onChange={(v) => set("alignment", v)} />
            </div>
          </PropertySection>
        </div>
      );

    case "text":
      return (
        <div className="space-y-4">
          <PropertySection title="Content">
            <textarea
              value={c.text ?? ""}
              onChange={(e) => set("text", e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              placeholder="Enter your text..."
            />
          </PropertySection>
          <PropertySection title="Styling">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Input value={c.fontSize ?? "16"} onChange={(e) => set("fontSize", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Color</Label>
                <ColorInput value={c.color ?? "#374151"} onChange={(v) => set("color", v)} />
              </div>
            </div>
          </PropertySection>
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <PropertySection title="Picture">
            <ImageUploadArea
              src={c.src !== "/placeholder.svg" ? c.src : undefined}
              onFile={(f) => handleFile(f)}
              onClear={() => set("src", "/placeholder.svg")}
              dragOver={dragOver}
              setDragOver={setDragOver}
              fileInputRef={fileInputRef}
              accept="image/*"
              setKey="src"
              set={set}
            />
            {c.src && c.src !== "/placeholder.svg" && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {c.src.startsWith("data:") ? "uploaded_image" : c.src}
              </p>
            )}
          </PropertySection>
          <PropertySection title="Settings">
            <div>
              <Label className="text-xs text-muted-foreground">Image URL</Label>
              <Input value={c.src === "/placeholder.svg" ? "" : (c.src ?? "")} onChange={(e) => set("src", e.target.value || "/placeholder.svg")} placeholder="https://example.com/image.jpg" className="mt-1" />
            </div>
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Alt text</Label>
              <Input value={c.alt ?? ""} onChange={(e) => set("alt", e.target.value)} placeholder="Image description" className="mt-1" />
            </div>
          </PropertySection>
        </div>
      );

    case "button":
      return (
        <div className="space-y-4">
          <PropertySection title="Button">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Click here" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input value={c.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com" className="mt-1" />
              </div>
            </div>
          </PropertySection>
          <PropertySection title="Styling">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Text Color</Label>
                <ColorInput value={c.color ?? "#ffffff"} onChange={(v) => set("color", v)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">BG Color</Label>
                <ColorInput value={c.bgColor ?? "#6366f1"} onChange={(v) => set("bgColor", v)} />
              </div>
            </div>
            <AlignmentSelect value={c.alignment ?? "center"} onChange={(v) => set("alignment", v)} />
          </PropertySection>
        </div>
      );

    case "divider":
      return (
        <PropertySection title="Divider">
          <div>
            <Label className="text-xs text-muted-foreground">Color</Label>
            <ColorInput value={c.color ?? "#e5e7eb"} onChange={(v) => set("color", v)} />
          </div>
        </PropertySection>
      );

    case "spacer":
      return (
        <PropertySection title="Spacer">
          <SliderField
            label="Height"
            value={c.height ?? "24"}
            min={4}
            max={120}
            unit="px"
            onChange={(v) => set("height", v)}
          />
        </PropertySection>
      );

    case "footer":
      return (
        <div className="space-y-4">
          <PropertySection title="Footer">
            <div>
              <Label className="text-xs text-muted-foreground">Text</Label>
              <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="© 2026 Your Company" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Input value={c.fontSize ?? "12"} onChange={(e) => set("fontSize", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Color</Label>
                <ColorInput value={c.color ?? "#9ca3af"} onChange={(v) => set("color", v)} />
              </div>
            </div>
          </PropertySection>
        </div>
      );

    case "logo":
      return (
        <div className="space-y-4">
          <PropertySection title="Logo">
            <ImageUploadArea
              src={c.src}
              onFile={(f) => handleFile(f)}
              onClear={() => set("src", "")}
              dragOver={dragOver}
              setDragOver={setDragOver}
              fileInputRef={fileInputRef}
              accept="image/*"
              setKey="src"
              set={set}
            />
          </PropertySection>
          <PropertySection title="Settings">
            <SliderField
              label="Width"
              value={c.width ?? "200"}
              min={50}
              max={400}
              unit="px"
              onChange={(v) => set("width", v)}
            />
            <AlignmentSelect value={c.alignment ?? "center"} onChange={(v) => set("alignment", v)} />
          </PropertySection>
        </div>
      );

    case "link":
      return (
        <div className="space-y-4">
          <PropertySection title="Link">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Text</Label>
                <Input value={c.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="Click here" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input value={c.url ?? ""} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com" className="mt-1" />
              </div>
            </div>
          </PropertySection>
          <PropertySection title="Styling">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Input value={c.fontSize ?? "14"} onChange={(e) => set("fontSize", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Color</Label>
                <ColorInput value={c.color ?? "#6366f1"} onChange={(v) => set("color", v)} />
              </div>
            </div>
            <AlignmentSelect value={c.alignment ?? "center"} onChange={(v) => set("alignment", v)} />
          </PropertySection>
        </div>
      );

    case "social":
      return (
        <div className="space-y-4">
          <PropertySection title="Social Links">
            <div className="space-y-3">
              {(["facebook", "twitter", "instagram", "linkedin", "youtube"] as const).map((platform) => (
                <div key={platform}>
                  <Label className="text-xs text-muted-foreground capitalize">{platform}</Label>
                  <Input
                    value={c[platform] ?? ""}
                    onChange={(e) => set(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </PropertySection>
          <PropertySection title="Layout">
            <AlignmentSelect value={c.alignment ?? "center"} onChange={(v) => set("alignment", v)} />
          </PropertySection>
        </div>
      );

    default:
      return null;
  }
}

function UniversalProperties({
  block,
  onUpdate,
}: {
  block: EmailBlock;
  onUpdate: (content: Record<string, string>) => void;
}) {
  const c = block.content;
  const [paddingsLinked, setPaddingsLinked] = useState(true);

  function set(key: string, value: string) {
    onUpdate({ ...c, [key]: value });
  }

  function handleLinkedPadding(value: string) {
    onUpdate({
      ...c,
      paddingTop: value,
      paddingRight: value,
      paddingBottom: value,
      paddingLeft: value,
    });
  }

  return (
    <>
      <PropertySection title="Layer">
        <div className="flex items-center gap-3">
          <SliderField
            label="Opacity"
            value={c._opacity ?? "100"}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => set("_opacity", v)}
          />
        </div>
      </PropertySection>

      <PropertySection title="Corner Radius">
        <SliderField
          label="Radius"
          value={c._borderRadius ?? "0"}
          min={0}
          max={32}
          unit="px"
          onChange={(v) => set("_borderRadius", v)}
        />
      </PropertySection>

      <PropertySection title="Paddings">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Linked</span>
          <Switch
            checked={paddingsLinked}
            onCheckedChange={setPaddingsLinked}
          />
        </div>
        {paddingsLinked ? (
          <div className="grid grid-cols-4 gap-2">
            <PaddingInput label="All" value={c.paddingTop ?? "24"} onChange={handleLinkedPadding} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <PaddingInput label="T" value={c.paddingTop ?? "24"} onChange={(v) => set("paddingTop", v)} />
            <PaddingInput label="R" value={c.paddingRight ?? "24"} onChange={(v) => set("paddingRight", v)} />
            <PaddingInput label="B" value={c.paddingBottom ?? "24"} onChange={(v) => set("paddingBottom", v)} />
            <PaddingInput label="L" value={c.paddingLeft ?? "24"} onChange={(v) => set("paddingLeft", v)} />
          </div>
        )}
      </PropertySection>
    </>
  );
}

/* ─────────────────────────────────────────── Utility sub-components ─ */

function PropertySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-input cursor-pointer p-0.5"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-xs"
      />
    </div>
  );
}

function AlignmentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-2">
      <Label className="text-xs text-muted-foreground">Alignment</Label>
      <div className="flex gap-1 mt-1">
        {(["left", "center", "right"] as const).map((align) => (
          <button
            key={align}
            onClick={() => onChange(align)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
              value === align
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {align}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  unit: string;
  onChange: (v: string) => void;
}) {
  const numValue = parseInt(value, 10) || min;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {numValue}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-[var(--color-accent-4)]"
        />
        <Input
          value={numValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 text-center text-xs"
        />
      </div>
    </div>
  );
}

function PaddingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="text-center">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-center text-xs py-1 h-8"
      />
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

function ImageUploadArea({
  src,
  onFile,
  onClear,
  dragOver,
  setDragOver,
  fileInputRef,
  accept,
  setKey,
  set,
}: {
  src?: string;
  onFile: (f: File) => void;
  onClear: () => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  accept: string;
  setKey: string;
  set: (key: string, value: string) => void;
}) {
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}
    >
      {src ? (
        <div className="flex flex-col items-center gap-2">
          <img src={src} alt="Preview" className="max-h-16 object-contain rounded" />
          <span className="text-xs text-muted-foreground">Click to replace</span>
        </div>
      ) : (
        <>
          <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {dragOver ? "Drop here" : "Upload or drag image"}
          </p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
