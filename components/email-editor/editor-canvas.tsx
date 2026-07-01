"use client";

import { useEditorStore } from "@/store/use-editor-store";
import { CanvasSection } from "./canvas-section";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function EditorCanvas() {
  const sections = useEditorStore((s) => s.sections);
  const blocks = useEditorStore((s) => s.blocks);
  const viewport = useEditorStore((s) => s.viewport);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const addSection = useEditorStore((s) => s.addSection);

  const canvasWidth = viewport === "mobile" ? "375px" : "600px";
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const { isOver: isOverEnd, setNodeRef: endRef } = useDroppable({
    id: "drop-zone-end",
    data: { type: "drop-zone", index: blocks.length },
  });

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#f4f4f5]"
      onClick={() => selectBlock(null)}
    >
      <div className="flex justify-center py-8 px-4">
        <div
          className="transition-all duration-300 ease-out"
          style={{ width: canvasWidth, maxWidth: "100%" }}
        >
          {/* Email container */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {sections.length === 0 ? (
              <div
                ref={endRef}
                className={cn(
                  "py-20 px-8 text-center transition-all duration-200",
                  isOverEnd && "bg-primary/5"
                )}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Drag blocks here to start building
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Or choose a block from the sidebar
                </p>
              </div>
            ) : (
              <div className="relative p-4">
                <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                  {sections.map((section, i) => (
                    <CanvasSection
                      key={section.id}
                      section={section}
                      index={i}
                      total={sections.length}
                    />
                  ))}
                </SortableContext>

                {/* Add section button */}
                <button
                  onClick={() => addSection()}
                  className="mt-2 w-full py-3 rounded-lg border-2 border-dashed border-transparent hover:border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add section
                </button>
              </div>
            )}
          </div>

          {/* Drop zone below the email */}
          {blocks.length > 0 && (
            <div
              ref={endRef}
              className={cn(
                "mt-4 flex items-center justify-center py-6 rounded-lg border-2 border-dashed transition-colors",
                isOverEnd
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors cursor-default">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
