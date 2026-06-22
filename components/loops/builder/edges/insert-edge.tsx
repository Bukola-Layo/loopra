import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  Node,
} from '@xyflow/react';
import { Plus, Mail, GitBranch, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFlowStore } from '@/store/use-flow-store';

export function InsertEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insertNodeBetween = useFlowStore((state) => state.insertNodeBetween);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleInsert = (type: string, title: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: labelX - 140, y: labelY - 40 }, // Approximate center
      data: {
        title,
        description: `New ${title} step`,
      },
    };
    insertNodeBetween(newNode, id);
    setIsOpen(false);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, stroke: '#b1b1b7' }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 shadow-sm transition-all hover:border-[#dd2d4a] hover:text-[#dd2d4a] hover:shadow-md">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-56 p-2" align="center">
              <div className="flex flex-col gap-1">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Add Step
                </p>
                <button
                  onClick={() => handleInsert('action', 'Send Email')}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Mail className="h-4 w-4 text-[#2cadc0]" />
                  Send Email
                </button>
                <button
                  onClick={() => handleInsert('condition', 'Condition')}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <GitBranch className="h-4 w-4 text-purple-500" />
                  Condition
                </button>
                <button
                  onClick={() => handleInsert('delay', 'Time Delay')}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Clock className="h-4 w-4 text-amber-500" />
                  Time Delay
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
