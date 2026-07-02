"use client";

import { useEffect, useState } from "react";
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
import { Puzzle, Image, Type, RectangleHorizontal, Minus, Link2, Share2, AlignEndHorizontal, FileCode, Columns2, Columns3, LayoutGrid } from "lucide-react";
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
  raw: <FileCode className="h-4 w-4" />,
};

const CONTAINER_ICONS: Record<number, { label: string; icon: ReactNode }> = {
  2: { label: "2 Columns", icon: <Columns2 className="h-4 w-4" /> },
  3: { label: "3 Columns", icon: <Columns3 className="h-4 w-4" /> },
  4: { label: "4 Columns", icon: <LayoutGrid className="h-4 w-4" /> },
};

type VisualEditorProps = {
  initialBlocks: EmailBlock[];
  documentName: string;
  onSave: (blocks: EmailBlock[]) => void;
  backHref: string;
  saveLabel?: string;
  saving?: boolean;
  onSendTest?: () => void;
  onDuplicate?: () => void;
  onUseInCampaign?: () => void;
};

export function VisualEditor({
  initialBlocks,
  documentName,
  onSave,
  backHref,
  saveLabel,
  saving,
  onSendTest,
  onDuplicate,
  onUseInCampaign,
}: VisualEditorProps) {
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const addContainerSection = useEditorStore((s) => s.addContainerSection);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const blocks = useEditorStore((s) => s.blocks);

  const [activeSidebarType, setActiveSidebarType] = useState<BlockType | null>(null);
  const [activeContainer, setActiveContainer] = useState<number | null>(null);

  // Initialize store
  useEffect(() => {
    loadBlocks(initialBlocks, documentName);
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
    if (active.data.current?.type === "sidebar-container") {
      setActiveContainer(active.data.current.columnCount);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSidebarType(null);
    setActiveContainer(null);

    if (!over) return;

    const isSidebarBlock = active.data.current?.type === "sidebar-block";
    const isSidebarContainer = active.data.current?.type === "sidebar-container";
    const isCanvasBlock = !isSidebarBlock && !isSidebarContainer;

    if (isSidebarBlock && over.data.current?.type === "drop-zone") {
      const index = over.data.current.index as number;
      addBlock(active.data.current?.blockType, index);
      return;
    }

    if (isSidebarContainer) {
      const columnCount = active.data.current?.columnCount as number;
      addContainerSection(columnCount);
      return;
    }

    if (isCanvasBlock && active.id !== over.id) {
      reorderBlocks(active.id as string, over.id as string);
    }
  }

  function handleSave() {
    onSave(blocks);
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <EditorTopBar
        backHref={backHref}
        onSave={handleSave}
        saveLabel={saveLabel}
        saving={saving}
        onSendTest={onSendTest}
        onDuplicate={onDuplicate}
        onUseInCampaign={onUseInCampaign}
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
            ) : activeContainer ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border shadow-xl w-[220px]">
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 text-foreground">
                  {CONTAINER_ICONS[activeContainer]?.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {CONTAINER_ICONS[activeContainer]?.label}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
