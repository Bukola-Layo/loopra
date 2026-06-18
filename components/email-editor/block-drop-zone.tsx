"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/use-editor-store";
import { type BlockType, BLOCK_TYPE_LABELS } from "@/lib/email-builder";
import { Plus, Type, Image, Square, Minus, Link2, Share2, AlignCenter, Heading } from "lucide-react";

type BlockDropZoneProps = {
  id: string;
  index: number;
};

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  header: <Heading className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  button: <Square className="h-3.5 w-3.5" />,
  divider: <Minus className="h-3.5 w-3.5" />,
  spacer: <AlignCenter className="h-3.5 w-3.5" />,
  link: <Link2 className="h-3.5 w-3.5" />,
  social: <Share2 className="h-3.5 w-3.5" />,
  footer: <Type className="h-3.5 w-3.5" />,
  logo: <Image className="h-3.5 w-3.5" />,
};

const QUICK_BLOCKS: BlockType[] = ["header", "text", "image", "button", "divider", "spacer"];

export function BlockDropZone({ id, index }: BlockDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addBlock = useEditorStore((s) => s.addBlock);

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "drop-zone", index },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleAddBlock(type: BlockType) {
    addBlock(type, index);
    setIsOpen(false);
  }

  const show = isOver || isHovered || isOpen;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative z-10 transition-all duration-200 group",
        show ? "h-10 -my-2" : "h-2 -my-1"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "absolute inset-x-2 top-1/2 -translate-y-1/2 transition-all duration-200 rounded-full",
          show
            ? "h-0.5 bg-primary/30"
            : "h-0 bg-transparent group-hover:bg-primary/20 group-hover:h-0.5"
        )}
      />
      {show && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors z-20"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white rounded-lg shadow-lg border p-2 min-w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1">
            {QUICK_BLOCKS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleAddBlock(type)}
                className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
              >
                {BLOCK_ICONS[type]}
                <span>{BLOCK_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
          <div className="border-t mt-1 pt-1">
            <button
              type="button"
              onClick={() => handleAddBlock("footer")}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              {BLOCK_ICONS["footer"]}
              {BLOCK_TYPE_LABELS["footer"]}
            </button>
            <button
              type="button"
              onClick={() => handleAddBlock("logo")}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              {BLOCK_ICONS["logo"]}
              {BLOCK_TYPE_LABELS["logo"]}
            </button>
            <button
              type="button"
              onClick={() => handleAddBlock("link")}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              {BLOCK_ICONS["link"]}
              {BLOCK_TYPE_LABELS["link"]}
            </button>
            <button
              type="button"
              onClick={() => handleAddBlock("social")}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              {BLOCK_ICONS["social"]}
              {BLOCK_TYPE_LABELS["social"]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
