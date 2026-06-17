import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import {
  type EmailBlock,
  type BlockType,
  createBlock,
} from "@/lib/email-builder";

export type Viewport = "desktop" | "mobile";

type EditorState = {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  viewport: Viewport;
  isDirty: boolean;
  documentName: string;

  // Actions
  loadBlocks: (blocks: EmailBlock[], name?: string) => void;
  addBlock: (type: BlockType, atIndex?: number) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  updateBlock: (id: string, content: Record<string, string>) => void;
  selectBlock: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  setDocumentName: (name: string) => void;
  markClean: () => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  viewport: "desktop",
  isDirty: false,
  documentName: "Untitled",

  loadBlocks: (blocks, name) =>
    set({
      blocks,
      selectedBlockId: null,
      isDirty: false,
      ...(name ? { documentName: name } : {}),
    }),

  addBlock: (type, atIndex) =>
    set((state) => {
      const newBlock = createBlock(type);
      const next = [...state.blocks];
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= next.length) {
        next.splice(atIndex, 0, newBlock);
      } else {
        next.push(newBlock);
      }
      return { blocks: next, selectedBlockId: newBlock.id, isDirty: true };
    }),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId:
        state.selectedBlockId === id ? null : state.selectedBlockId,
      isDirty: true,
    })),

  moveBlock: (id, direction) =>
    set((state) => {
      const idx = state.blocks.findIndex((b) => b.id === id);
      if (direction === "up" && idx > 0) {
        return {
          blocks: arrayMove(state.blocks, idx, idx - 1),
          isDirty: true,
        };
      }
      if (direction === "down" && idx < state.blocks.length - 1) {
        return {
          blocks: arrayMove(state.blocks, idx, idx + 1),
          isDirty: true,
        };
      }
      return state;
    }),

  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.blocks.findIndex((b) => b.id === activeId);
      const newIndex = state.blocks.findIndex((b) => b.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
        return state;
      return {
        blocks: arrayMove(state.blocks, oldIndex, newIndex),
        isDirty: true,
      };
    }),

  updateBlock: (id, content) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, content } : b
      ),
      isDirty: true,
    })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setViewport: (viewport) => set({ viewport }),

  setDocumentName: (name) => set({ documentName: name, isDirty: true }),

  markClean: () => set({ isDirty: false }),

  reset: () =>
    set({
      blocks: [],
      selectedBlockId: null,
      viewport: "desktop",
      isDirty: false,
      documentName: "Untitled",
    }),
}));
