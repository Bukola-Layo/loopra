"use client";

import { useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { EditorTopBar } from "./editor-top-bar";
import { EditorSidebar } from "./editor-sidebar";
import { EditorCanvas } from "./editor-canvas";
import { EditorProperties } from "./editor-properties";
import { useEditorStore } from "@/store/use-editor-store";
import { type EmailBlock, type BlockType, BLOCK_TYPE_LABELS } from "@/lib/email-builder";
import { useState } from "react";
import { Puzzle, Image, Type, RectangleHorizontal, Minus, Link2, Share2, AlignEndHorizontal } from "lucide-react";
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

type VisualEditorProps = {
  initialBlocks: EmailBlock[];
  documentName: string;
  onSave: (blocks: EmailBlock[]) => void;
  backHref: string;
  saveLabel?: string;
  saving?: boolean;
  onSendTest?: () => void;
};

export function VisualEditor({
  initialBlocks,
  documentName,
  onSave,
  backHref,
  saveLabel,
  saving,
  onSendTest,
}: VisualEditorProps) {
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const blocks = useEditorStore((s) => s.blocks);

  const [activeSidebarType, setActiveSidebarType] = useState<BlockType | null>(null);

  // Initialize store
  useEffect(() => {
    loadBlocks(initialBlocks, documentName);
    // Cleanup on unmount
    return () => useEditorStore.getState().reset();
  }, [initialBlocks, documentName, loadBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.data.current?.type === "sidebar-block") {
      setActiveSidebarType(active.data.current.blockType);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSidebarType(null);

    if (!over) return;

    const isSidebarBlock = active.data.current?.type === "sidebar-block";
    const isCanvasBlock = !isSidebarBlock;

    // Drop new block from sidebar into canvas drop zone
    if (isSidebarBlock && over.data.current?.type === "drop-zone") {
      const index = over.data.current.index as number;
      addBlock(active.data.current?.blockType, index);
      return;
    }

    // Reorder existing canvas blocks
    if (isCanvasBlock && active.id !== over.id) {
      reorderBlocks(active.id as string, over.id as string);
    }
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <EditorTopBar
        backHref={backHref}
        onSave={() => onSave(blocks)}
        saveLabel={saveLabel}
        saving={saving}
        onSendTest={onSendTest}
      />

      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <EditorSidebar />
          <EditorCanvas />
          <EditorProperties />

          <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeSidebarType ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border shadow-xl w-[220px]">
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 text-foreground">
                  {BLOCK_ICONS[activeSidebarType]}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {BLOCK_TYPE_LABELS[activeSidebarType]}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
