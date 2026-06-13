"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionConfig = {
  type: string;
  config: Record<string, unknown>;
};

const CONDITION_FIELDS = [
  { value: "email", label: "Email" },
  { value: "firstName", label: "First Name" },
  { value: "hasTag", label: "Has Tag" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "is_set", label: "Is set" },
  { value: "is_not_set", label: "Is not set" },
];

type LoopActionConfigProps = {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
};

export function LoopActionConfig({ action, onChange }: LoopActionConfigProps) {
  const config = action.config ?? {};

  const updateConfig = (key: string, value: unknown) => {
    onChange({ ...action, config: { ...config, [key]: value } });
  };

  switch (action.type) {
    case "send_email":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={(config.subject as string) ?? ""}
              onChange={(e) => updateConfig("subject", e.target.value)}
              placeholder="Email subject line"
            />
          </div>
          <div className="space-y-2">
            <Label>Content (HTML)</Label>
            <Textarea
              value={(config.content as string) ?? ""}
              onChange={(e) => updateConfig("content", e.target.value)}
              placeholder="<p>Hello {{firstName}},</p><p>Your email content here...</p>"
              rows={6}
            />
          </div>
        </div>
      );

    case "delay":
      return (
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={0}
            value={(config.durationMinutes as number) ?? 0}
            onChange={(e) =>
              updateConfig("durationMinutes", parseInt(e.target.value) || 0)
            }
            placeholder="e.g., 1440 for 24 hours"
          />
          <p className="text-xs text-muted-foreground">
            Wait for this many minutes before running the next action. Set to 0 to proceed immediately.
          </p>
        </div>
      );

    case "apply_tag":
      return (
        <div className="space-y-2">
          <Label>Tag Name</Label>
          <Input
            value={(config.tagName as string) ?? ""}
            onChange={(e) => updateConfig("tagName", e.target.value)}
            placeholder="e.g., vip, new-lead"
          />
        </div>
      );

    case "remove_tag":
      return (
        <div className="space-y-2">
          <Label>Tag Name</Label>
          <Input
            value={(config.tagName as string) ?? ""}
            onChange={(e) => updateConfig("tagName", e.target.value)}
            placeholder="e.g., vip, new-lead"
          />
        </div>
      );

    case "condition":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select
              value={(config.field as string) ?? ""}
              onValueChange={(v) => updateConfig("field", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(config.field as string) !== "is_set" &&
            (config.field as string) !== "is_not_set" && (
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={(config.operator as string) ?? ""}
                  onValueChange={(v) => updateConfig("operator", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={(config.value as string) ?? ""}
              onChange={(e) => updateConfig("value", e.target.value)}
              placeholder="Value to compare"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            If the condition is not met, execution stops for this subscriber.
          </p>
        </div>
      );

    case "webhook":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={(config.url as string) ?? ""}
              onChange={(e) => updateConfig("url", e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={(config.method as string) ?? "POST"}
              onValueChange={(v) => updateConfig("method", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GET", "POST", "PUT", "PATCH"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body (JSON)</Label>
            <Textarea
              value={(config.body as string) ?? ""}
              onChange={(e) => updateConfig("body", e.target.value)}
              placeholder='{"event": "loop_triggered", "subscriber": "{{email}}"}'
              rows={4}
            />
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Select an action type to configure.
        </p>
      );
  }
}
