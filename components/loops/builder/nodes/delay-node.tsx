import { Handle, Position } from '@xyflow/react';
import { Clock, Settings, Trash, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/use-flow-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DelayNodeProps {
  id: string;
  data: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
  selected: boolean;
}

export function DelayNode({ id, data, selected }: DelayNodeProps) {
  const removeNode = useFlowStore((state) => state.removeNode);

  return (
    <div
      className={cn(
        'group relative min-w-[240px] rounded-xl border bg-white p-3 shadow-sm transition-all',
        selected ? 'border-amber-500 ring-1 ring-amber-500' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-amber-500"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            {data.icon || <Clock className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{data.title}</h3>
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
              Edit Delay
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => removeNode(id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Delay
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-amber-500"
      />
    </div>
  );
}
