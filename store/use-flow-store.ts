import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

export type FlowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  removeNode: (nodeId: string) => void;
  insertNodeBetween: (newNode: Node, edgeId: string) => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    // Default connection type is our custom edge
    const newEdge = { ...connection, type: 'insert', animated: true, style: { strokeWidth: 2 } };
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
  setSelectedNode: (node: Node | null) => {
    set({ selectedNode: node });
  },
  addNode: (node: Node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },
  updateNodeData: (nodeId: string, data: any) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, ...data };
        }
        return node;
      }),
    });
  },
  removeNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },
  insertNodeBetween: (newNode: Node, edgeId: string) => {
    const edges = get().edges;
    const edgeToSplit = edges.find((e) => e.id === edgeId);
    
    if (!edgeToSplit) return;
    
    const newEdge1: Edge = {
      id: `e-${edgeToSplit.source}-${newNode.id}`,
      source: edgeToSplit.source,
      sourceHandle: edgeToSplit.sourceHandle,
      target: newNode.id,
      targetHandle: null,
      type: 'insert',
      animated: true,
      style: { strokeWidth: 2 },
    };
    
    const newEdge2: Edge = {
      id: `e-${newNode.id}-${edgeToSplit.target}`,
      source: newNode.id,
      sourceHandle: null,
      target: edgeToSplit.target,
      targetHandle: edgeToSplit.targetHandle,
      type: 'insert',
      animated: true,
      style: { strokeWidth: 2 },
    };
    
    set({
      nodes: [...get().nodes, newNode],
      edges: [...edges.filter((e) => e.id !== edgeId), newEdge1, newEdge2],
    });
  },
}));
