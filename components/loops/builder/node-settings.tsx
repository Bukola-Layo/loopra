import { useFlowStore } from '@/store/use-flow-store';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function NodeSettings() {
  const selectedNode = useFlowStore((state) => state.selectedNode);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const setSelectedNode = useFlowStore((state) => state.setSelectedNode);

  if (!selectedNode) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(selectedNode.id, { description: e.target.value });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 border-l border-gray-200 bg-white shadow-xl transition-transform">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        <h2 className="font-semibold text-gray-900 capitalize">{selectedNode.type} Settings</h2>
        <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="h-8 w-8 text-gray-500">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Step Name</Label>
          <Input 
            id="title" 
            value={selectedNode.data.title as string || ''} 
            onChange={handleTitleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={selectedNode.data.description as string || ''} 
            onChange={handleDescriptionChange}
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Type-specific settings would go here */}
        {selectedNode.type === 'action' && (
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <select id="template" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option>Welcome Email Template</option>
              <option>Promo Offer</option>
            </select>
          </div>
        )}

        {selectedNode.type === 'delay' && (
          <div className="space-y-2 flex gap-2">
            <div className="flex-1">
              <Label htmlFor="duration">Wait for</Label>
              <Input id="duration" type="number" defaultValue={1} />
            </div>
            <div className="flex-1">
              <Label htmlFor="unit">Unit</Label>
              <select id="unit" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option>Hours</option>
                <option>Days</option>
                <option>Minutes</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
