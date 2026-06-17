"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useEditorStore } from "@/store/use-editor-store";
import { CanvasBlock } from "./canvas-block";
import { BlockDropZone } from "./block-drop-zone";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditorCanvas() {
  const blocks = useEditorStore((s) => s.blocks);
  const viewport = useEditorStore((s) => s.viewport);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const canvasWidth = viewport === "mobile" ? "375px" : "600px";

  // Final drop zone at the end of the canvas
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
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.length === 0 ? (
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
                <div className="relative">
                  {/* Drop zone before the first block */}
                  <BlockDropZone id="drop-zone-0" index={0} />

                  {blocks.map((block, i) => (
                    <div key={block.id}>
                      <CanvasBlock
                        block={block}
                        index={i}
                        total={blocks.length}
                      />
                      {/* Drop zone after each block */}
                      <BlockDropZone
                        id={`drop-zone-${i + 1}`}
                        index={i + 1}
                      />
                    </div>
                  ))}
                </div>
              )}
            </SortableContext>
          </div>

          {/* Add block button below the email */}
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
