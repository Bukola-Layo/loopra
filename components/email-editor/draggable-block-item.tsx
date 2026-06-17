"use client";

import {
  Type,
  Image,
  Puzzle,
  RectangleHorizontal,
  Link2,
  Minus,
  Share2,
  AlignEndHorizontal,
  GripVertical,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { type BlockType, BLOCK_TYPE_LABELS } from "@/lib/email-builder";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const BLOCK_ICONS: Record<BlockType, ReactNode> = {
  header: <Type className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  logo: <Puzzle className="h-4 w-4" />,
  button: <RectangleHorizontal className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  divider: <Minus className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  footer: <AlignEndHorizontal className="h-4 w-4" />,
  spacer: <Minus className="h-4 w-4 opacity-50" />,
};

type DraggableBlockItemProps = {
  blockType: BlockType;
};

export function DraggableBlockItem({ blockType }: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${blockType}`,
    data: { type: "sidebar-block", blockType },
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
        {BLOCK_ICONS[blockType]}
      </span>
      <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
        {BLOCK_TYPE_LABELS[blockType]}
      </span>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}
