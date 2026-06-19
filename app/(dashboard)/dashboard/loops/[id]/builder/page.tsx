'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/loops/builder/sidebar';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/store/use-flow-store';
import { useState } from 'react';

const FlowBuilder = dynamic(
  () => import('@/components/loops/builder/flow-builder').then((m) => m.FlowBuilder),
  { ssr: false }
);

export default function LoopBuilderPage({ params }: { params: { id: string } }) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In a real app, this would be an API call to save the JSON structure
    const graphJson = JSON.stringify({ nodes, edges }, null, 2);
    console.log('Saving Loop:', graphJson);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Loop saved successfully!');
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-10 relative">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-gray-500 hover:text-gray-900">
            <Link href="/dashboard/loops">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-gray-900">Welcome Series</h1>
            <span className="text-xs text-gray-500">Draft • Saved just now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Discard Changes
          </Button>
          <Button size="sm" className="gap-2 bg-[#dd2d4a] hover:bg-[#dd2d4a]/90 text-white" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Loop'}
          </Button>
        </div>
      </header>

      {/* Main Builder Area */}
      <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative h-full bg-gray-50/50">
          <FlowBuilder />
        </main>
      </div>
    </div>
  );
}
