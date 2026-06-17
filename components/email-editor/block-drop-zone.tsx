"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type BlockDropZoneProps = {
  id: string;
  index: number;
};

export function BlockDropZone({ id, index }: BlockDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "drop-zone", index },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative h-3 -my-1 z-10 transition-all duration-200",
        isOver && "h-12 -my-0"
      )}
    >
      {isOver && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="flex-1 h-0.5 rounded-full bg-primary/60" />
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white">
            <Plus className="h-3 w-3" />
          </div>
          <div className="flex-1 h-0.5 rounded-full bg-primary/60" />
        </div>
      )}
    </div>
  );
}
