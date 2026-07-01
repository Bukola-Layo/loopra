"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { type Column } from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";
import { CanvasBlock } from "./canvas-block";
import { BlockDropZone } from "./block-drop-zone";

type CanvasColumnProps = {
  column: Column;
  sectionId: string;
  columnIndex: number;
  totalColumns: number;
};

export function CanvasColumn({ column, sectionId, totalColumns }: CanvasColumnProps) {
  const removeColumn = useEditorStore((s) => s.removeColumn);
  const { isOver, setNodeRef } = useDroppable({
    id: `col-${column.id}`,
    data: { type: "column", sectionId, columnId: column.id },
  });

  const widthPercent = `${column.width}%`;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex-1 min-w-0 border-r last:border-r-0 transition-colors",
        isOver && "bg-primary/5"
      )}
      style={{ width: widthPercent }}
    >
      {/* Column header */}
      {totalColumns > 1 && (
        <div className="flex items-center justify-between px-2 py-1 border-b bg-muted/20">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {column.width}%
          </span>
          <button
            onClick={() => removeColumn(sectionId, column.id)}
            className="p-0.5 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive"
            aria-label="Remove column"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Blocks within column */}
      <div className="min-h-[40px]">
        <SortableContext items={column.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <BlockDropZone id={`dz-${column.id}-0`} index={0} sectionId={sectionId} columnId={column.id} />

          {column.blocks.map((block, bi) => (
            <div key={block.id}>
              <CanvasBlock block={block} index={bi} total={column.blocks.length} />
              <BlockDropZone
                id={`dz-${column.id}-${bi + 1}`}
                index={bi + 1}
                sectionId={sectionId}
                columnId={column.id}
              />
            </div>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
