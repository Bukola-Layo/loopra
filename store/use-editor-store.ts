import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import {
  type EmailBlock,
  type BlockType,
  type BlockContentMap,
  type Section,
  type Column,
  createBlock,
  createSection,
  createColumn,
  flattenBlocks,
  wrapInSections,
} from "@/lib/email-builder";

export type Viewport = "desktop" | "mobile";

function findBlockInSections(
  sections: Section[],
  id: string
): { sectionIdx: number; columnIdx: number; blockIdx: number } | null {
  for (let si = 0; si < sections.length; si++) {
    for (let ci = 0; ci < sections[si].columns.length; ci++) {
      const bi = sections[si].columns[ci].blocks.findIndex((b) => b.id === id);
      if (bi !== -1) return { sectionIdx: si, columnIdx: ci, blockIdx: bi };
    }
  }
  return null;
}

type EditorState = {
  sections: Section[];
  selectedBlockId: string | null;
  viewport: Viewport;
  isDirty: boolean;
  documentName: string;

  // Derived
  blocks: EmailBlock[];

  // Actions
  loadBlocks: (blocks: EmailBlock[], name?: string) => void;
  loadSections: (sections: Section[], name?: string) => void;
  addBlock: (type: BlockType, atIndex?: number) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  updateBlock: (id: string, content: Record<string, string>) => void;
  selectBlock: (id: string | null) => void;
  addSection: (atIndex?: number) => void;
  addContainerSection: (columnCount: number, atIndex?: number) => void;
  removeSection: (sectionId: string) => void;
  addColumn: (sectionId: string, width: number) => void;
  removeColumn: (sectionId: string, columnId: string) => void;
  setViewport: (viewport: Viewport) => void;
  setDocumentName: (name: string) => void;
  markClean: () => void;
  reset: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  sections: [],
  selectedBlockId: null,
  viewport: "desktop",
  isDirty: false,
  documentName: "Untitled",

  get blocks() {
    return flattenBlocks(get().sections);
  },

  loadBlocks: (blocks, name) =>
    set({
      sections: wrapInSections(blocks),
      selectedBlockId: null,
      isDirty: false,
      ...(name ? { documentName: name } : {}),
    }),

  loadSections: (sections, name) =>
    set({
      sections,
      selectedBlockId: null,
      isDirty: false,
      ...(name ? { documentName: name } : {}),
    }),

  addBlock: (type, atIndex) =>
    set((state) => {
      const newBlock = createBlock(type);
      const next = [...state.sections];
      if (next.length === 0) {
        next.push(createSection([createColumn(100, [newBlock])]));
      } else {
        const lastSection = next[next.length - 1];
        const lastCol = lastSection.columns[lastSection.columns.length - 1];
        if (atIndex !== undefined && atIndex >= 0 && atIndex <= lastCol.blocks.length) {
          lastCol.blocks.splice(atIndex, 0, newBlock);
        } else {
          lastCol.blocks.push(newBlock);
        }
      }
      return { sections: next, selectedBlockId: newBlock.id, isDirty: true };
    }),

  removeBlock: (id) =>
    set((state) => {
      const loc = findBlockInSections(state.sections, id);
      if (!loc) return state;
      const next = structuredClone(state.sections);
      next[loc.sectionIdx].columns[loc.columnIdx].blocks.splice(loc.blockIdx, 1);
      return {
        sections: next,
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        isDirty: true,
      };
    }),

  moveBlock: (id, direction) =>
    set((state) => {
      const loc = findBlockInSections(state.sections, id);
      if (!loc) return state;
      const next = structuredClone(state.sections);
      const col = next[loc.sectionIdx].columns[loc.columnIdx];
      if (direction === "up" && loc.blockIdx > 0) {
        col.blocks = arrayMove(col.blocks, loc.blockIdx, loc.blockIdx - 1);
        return { sections: next, isDirty: true };
      }
      if (direction === "down" && loc.blockIdx < col.blocks.length - 1) {
        col.blocks = arrayMove(col.blocks, loc.blockIdx, loc.blockIdx + 1);
        return { sections: next, isDirty: true };
      }
      return state;
    }),

  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const aLoc = findBlockInSections(state.sections, activeId);
      const oLoc = findBlockInSections(state.sections, overId);
      if (!aLoc || !oLoc) return state;
      if (aLoc.sectionIdx === oLoc.sectionIdx && aLoc.columnIdx === oLoc.columnIdx && aLoc.blockIdx === oLoc.blockIdx) return state;

      const next = structuredClone(state.sections);
      const srcCol = next[aLoc.sectionIdx].columns[aLoc.columnIdx];
      const [moved] = srcCol.blocks.splice(aLoc.blockIdx, 1);

      if (aLoc.sectionIdx === oLoc.sectionIdx && aLoc.columnIdx === oLoc.columnIdx) {
        const adjust = aLoc.blockIdx < oLoc.blockIdx ? 1 : 0;
        srcCol.blocks.splice(oLoc.blockIdx - adjust, 0, moved);
      } else {
        const dstCol = next[oLoc.sectionIdx].columns[oLoc.columnIdx];
        dstCol.blocks.splice(oLoc.blockIdx, 0, moved);
      }

      return { sections: next, isDirty: true };
    }),

  updateBlock: (id, content) =>
    set((state) => {
      const loc = findBlockInSections(state.sections, id);
      if (!loc) return state;
      const next = structuredClone(state.sections);
      const block = next[loc.sectionIdx].columns[loc.columnIdx].blocks[loc.blockIdx];
      (block as unknown as { content: Record<string, string> }).content = content;
      return { sections: next, isDirty: true };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  addSection: (atIndex) =>
    set((state) => {
      const newSection = createSection([createColumn(100)]);
      const next = [...state.sections];
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= next.length) {
        next.splice(atIndex, 0, newSection);
      } else {
        next.push(newSection);
      }
      return { sections: next, isDirty: true };
    }),

  addContainerSection: (columnCount, atIndex) =>
    set((state) => {
      const equalWidth = Math.floor(100 / columnCount);
      const columns = Array.from({ length: columnCount }, (_, i) => {
        const isLast = i === columnCount - 1;
        const width = isLast ? 100 - equalWidth * (columnCount - 1) : equalWidth;
        return createColumn(width);
      });
      const newSection = createSection(columns);
      const next = [...state.sections];
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= next.length) {
        next.splice(atIndex, 0, newSection);
      } else {
        next.push(newSection);
      }
      return { sections: next, isDirty: true };
    }),

  removeSection: (sectionId) =>
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== sectionId),
      isDirty: true,
    })),

  addColumn: (sectionId, width) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, columns: [...s.columns, createColumn(width)] }
          : s
      ),
      isDirty: true,
    })),

  removeColumn: (sectionId, columnId) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, columns: s.columns.filter((c) => c.id !== columnId) }
          : s
      ),
      isDirty: true,
    })),

  setViewport: (viewport) => set({ viewport }),

  setDocumentName: (name) => set({ documentName: name, isDirty: true }),

  markClean: () => set({ isDirty: false }),

  reset: () =>
    set({
      sections: [],
      selectedBlockId: null,
      viewport: "desktop",
      isDirty: false,
      documentName: "Untitled",
    }),
}));
