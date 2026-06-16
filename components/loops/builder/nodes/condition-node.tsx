import { Handle, Position } from '@xyflow/react';
import { GitBranch, Settings, Trash, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/use-flow-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConditionNodeProps {
  id: string;
  data: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
  selected: boolean;
}

export function ConditionNode({ id, data, selected }: ConditionNodeProps) {
  const removeNode = useFlowStore((state) => state.removeNode);

  return (
    <div
      className={cn(
        'group relative min-w-[280px] rounded-xl border bg-white p-4 shadow-sm transition-all',
        selected ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-purple-500"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            {data.icon || <GitBranch className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{data.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="invisible p-1 text-gray-400 hover:text-gray-600 group-hover:visible transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => removeNode(id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Condition
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-8">
        <div className="relative">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            YES
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!relative !left-0 !top-0 !h-3 !w-3 !transform-none !border-2 !border-white !bg-green-500"
          />
        </div>
        <div className="relative">
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            NO
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!relative !left-0 !top-0 !h-3 !w-3 !transform-none !border-2 !border-white !bg-red-500"
          />
        </div>
      </div>
    </div>
  );
}
