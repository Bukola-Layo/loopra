import { Zap, Mail, GitBranch, Clock } from 'lucide-react';

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 h-full flex flex-col gap-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Triggers
        </h2>
        <div className="flex flex-col gap-2">
          <div
            className="flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-[#dd2d4a]"
            onDragStart={(event) => onDragStart(event, 'trigger', 'Form Submitted')}
            draggable
          >
            <Zap className="h-4 w-4 text-[#dd2d4a]" />
            <span className="text-sm font-medium text-gray-700">Form Submitted</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Actions
        </h2>
        <div className="flex flex-col gap-2">
          <div
            className="flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-[#2cadc0]"
            onDragStart={(event) => onDragStart(event, 'action', 'Send Email')}
            draggable
          >
            <Mail className="h-4 w-4 text-[#2cadc0]" />
            <span className="text-sm font-medium text-gray-700">Send Email</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Logic
        </h2>
        <div className="flex flex-col gap-2">
          <div
            className="flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-purple-500"
            onDragStart={(event) => onDragStart(event, 'condition', 'Condition')}
            draggable
          >
            <GitBranch className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Condition (If/Else)</span>
          </div>
          <div
            className="flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-amber-500"
            onDragStart={(event) => onDragStart(event, 'delay', 'Time Delay')}
            draggable
          >
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Time Delay</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
