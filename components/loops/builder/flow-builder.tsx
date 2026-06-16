'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  Panel,
  useReactFlow,
  Node,
  Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/store/use-flow-store';
import { TriggerNode } from './nodes/trigger-node';
import { ActionNode } from './nodes/action-node';
import { ConditionNode } from './nodes/condition-node';
import { DelayNode } from './nodes/delay-node';
import { InsertEdge } from './edges/insert-edge';
import { getLayoutedElements } from '@/lib/layout-flow';
import { LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeSettings } from './node-settings';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

const edgeTypes = {
  insert: InsertEdge,
};

function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const addNode = useFlowStore((state) => state.addNode);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const setSelectedNode = useFlowStore((state) => state.setSelectedNode);

  // Initialize with a default trigger if empty
  useEffect(() => {
    if (nodes.length === 0) {
      const initialNode: Node = {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { title: 'Form Submitted', description: 'When someone submits a form' },
      };
      setNodes([initialNode]);
    }
  }, [nodes.length, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          title: label, 
          description: type === 'action' ? 'Configure action...' : type === 'condition' ? 'Set condition logic...' : 'Configure delay...' 
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  const onLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
    window.requestAnimationFrame(() => {
      fitView();
    });
  }, [nodes, edges, setNodes, setEdges, fitView]);

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onSelectionChange={(params) => {
          setSelectedNode(params.nodes[0] || null);
        }}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50/50"
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <Panel position="top-right">
          <Button variant="outline" size="sm" onClick={onLayout} className="gap-2 bg-white">
            <LayoutTemplate className="h-4 w-4" />
            Auto Layout
          </Button>
        </Panel>
      </ReactFlow>
      <NodeSettings />
    </div>
  );
}

export function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
