import { Handle, Position } from '@xyflow/react';
import { Mail, Settings, Trash, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/use-flow-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActionNodeProps {
  id: string;
  data: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  };
  selected: boolean;
}

export function ActionNode({ id, data, selected }: ActionNodeProps) {
  const removeNode = useFlowStore((state) => state.removeNode);

  return (
    <div
      className={cn(
        'group relative min-w-[280px] rounded-xl border bg-white p-4 shadow-sm transition-all',
        selected ? 'border-[#2cadc0] ring-1 ring-[#2cadc0]' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-[#2cadc0]"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2cadc0]/10 text-[#2cadc0]">
            {data.icon || <Mail className="h-5 w-5" />}
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
              Delete Action
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-[#2cadc0]"
      />
    </div>
  );
}
