"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Columns2, Columns3 } from "lucide-react";
import { type Section } from "@/lib/email-builder";
import { useEditorStore } from "@/store/use-editor-store";
import { CanvasColumn } from "./canvas-column";

type CanvasSectionProps = {
  section: Section;
  index: number;
  total: number;
};

export function CanvasSection({ section, index }: CanvasSectionProps) {
  const removeSection = useEditorStore((s) => s.removeSection);
  const addColumn = useEditorStore((s) => s.addColumn);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: "section", section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-4 transition-all duration-150 rounded-lg border-2",
        isDragging ? "opacity-40 z-50 border-primary" : "border-transparent hover:border-dashed hover:border-muted-foreground/20"
      )}
    >
      {/* Section toolbar */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 px-2 py-1 rounded-full bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab"
          aria-label="Drag section"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          onClick={() => addColumn(section.id, 50)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Split into 2 columns"
        >
          <Columns2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => addColumn(section.id, 33)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          title="Split into 3 columns"
        >
          <Columns3 className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          onClick={() => removeSection(section.id)}
          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-destructive"
          aria-label="Delete section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Section label */}
      <div className="absolute -top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Section {index + 1}
      </div>

      {/* Columns */}
      <div className="flex gap-0 min-h-[40px]">
        {section.columns.map((col, ci) => (
          <CanvasColumn
            key={col.id}
            column={col}
            sectionId={section.id}
            columnIndex={ci}
            totalColumns={section.columns.length}
          />
        ))}
      </div>
    </div>
  );
}
