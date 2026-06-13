"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoopTriggerConfig } from "./loop-trigger-config";
import { LoopActionConfig } from "./loop-action-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Plus,
  Trash2,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type DraftAction = {
  id: string;
  sequence: number;
  type: string;
  config: Record<string, unknown>;
};

type DraftTrigger = {
  type: string;
  config: Record<string, unknown>;
};

type LoopBuilderProps = {
  initialName?: string;
  initialDescription?: string;
  initialTrigger?: DraftTrigger;
  initialActions?: DraftAction[];
  onSave: (data: {
    name: string;
    description: string;
    trigger: DraftTrigger;
    actions: DraftAction[];
  }) => Promise<void>;
  isSaving?: boolean;
};

const ACTION_TYPE_OPTIONS = [
  { value: "send_email", label: "Send Email", icon: "📧" },
  { value: "delay", label: "Delay", icon: "⏳" },
  { value: "apply_tag", label: "Apply Tag", icon: "🏷️" },
  { value: "remove_tag", label: "Remove Tag", icon: "🏷️" },
  { value: "condition", label: "Condition", icon: "🔀" },
  { value: "webhook", label: "Webhook", icon: "🔗" },
];

let actionIdCounter = 0;
function generateActionId() {
  actionIdCounter++;
  return `action_${Date.now()}_${actionIdCounter}`;
}

export function LoopBuilder({
  initialName = "",
  initialDescription = "",
  initialTrigger = { type: "", config: {} },
  initialActions = [],
  onSave,
  isSaving = false,
}: LoopBuilderProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [trigger, setTrigger] = useState<DraftTrigger>(initialTrigger);
  const [actions, setActions] = useState<DraftAction[]>(initialActions);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addAction = useCallback(() => {
    const newAction: DraftAction = {
      id: generateActionId(),
      sequence: actions.length,
      type: "",
      config: {},
    };
    setActions((prev) => [...prev, newAction]);
    setExpandedAction(newAction.id);
  }, [actions.length]);

  const removeAction = useCallback((id: string) => {
    setActions((prev) =>
      prev
        .filter((a) => a.id !== id)
        .map((a, i) => ({ ...a, sequence: i }))
    );
    setExpandedAction((prev) => (prev === id ? null : prev));
  }, []);

  const updateAction = useCallback(
    (id: string, updates: Partial<DraftAction>) => {
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setActions((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === active.id);
      const newIndex = prev.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((a, i) => ({
        ...a,
        sequence: i,
      }));
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ name, description, trigger, actions });
    },
    [name, description, trigger, actions, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Loop Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Series"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this loop does..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Trigger</h3>
            <span className="text-xs text-muted-foreground">
              — What starts this automation
            </span>
          </div>
          <LoopTriggerConfig
            value={trigger}
            onChange={(t) => setTrigger(t)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Actions</h3>
              <span className="text-xs text-muted-foreground">
                &mdash; What happens when the trigger fires
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAction}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Add action
            </Button>
          </div>

          {actions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              No actions yet. Click &quot;Add action&quot; to build your loop.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={actions.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <SortableActionCard
                      key={action.id}
                      action={action}
                      index={index}
                      isExpanded={expandedAction === action.id}
                      onToggleExpand={() =>
                        setExpandedAction((prev) =>
                          prev === action.id ? null : action.id
                        )
                      }
                      onUpdate={(updates) => updateAction(action.id, updates)}
                      onRemove={() => removeAction(action.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!name || !trigger.type || isSaving}>
          {isSaving ? "Saving..." : "Save Loop"}
        </Button>
      </div>
    </form>
  );
}

function SortableActionCard({
  action,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  action: DraftAction;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<DraftAction>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-xs text-muted-foreground w-5">
          {index + 1}.
        </span>

        <div className="flex-1 min-w-0">
          <Select
            value={action.type}
            onValueChange={(type) =>
              onUpdate({ type, config: {} })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select action type..." />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && action.type && (
        <div className="px-3 pb-3 border-t pt-3">
          <LoopActionConfig
            action={action}
            onChange={(updated) =>
              onUpdate({ type: updated.type, config: updated.config })
            }
          />
        </div>
      )}
    </div>
  );
}
