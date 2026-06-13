"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TriggerConfig = {
  type: string;
  config: Record<string, unknown>;
};

type TriggerOption = {
  value: string;
  label: string;
  description: string;
};

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    value: "form_submission",
    label: "Form Submission",
    description: "When a subscriber submits a form",
  },
  {
    value: "tag_added",
    label: "Tag Added",
    description: "When a subscriber receives a tag",
  },
  {
    value: "subscriber_created",
    label: "Subscriber Created",
    description: "When a new subscriber is added",
  },
  {
    value: "campaign_opened",
    label: "Campaign Opened",
    description: "When a subscriber opens a campaign",
  },
  {
    value: "campaign_clicked",
    label: "Campaign Clicked",
    description: "When a subscriber clicks a link in a campaign",
  },
];

type LoopTriggerConfigProps = {
  value: TriggerConfig;
  onChange: (value: TriggerConfig) => void;
};

export function LoopTriggerConfig({ value, onChange }: LoopTriggerConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trigger Type</Label>
        <Select
          value={value.type}
          onValueChange={(type) =>
            onChange({ type, config: {} })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trigger type..." />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div>
                  <span>{opt.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.type === "form_submission" && (
        <FormSelector
          value={(value.config.formId as string) ?? ""}
          onChange={(formId) =>
            onChange({ ...value, config: { ...value.config, formId } })
          }
        />
      )}

      {value.type === "tag_added" && (
        <div className="space-y-2">
          <Label>Tag Name</Label>
          <Input
            value={(value.config.tagName as string) ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                config: { ...value.config, tagName: e.target.value },
              })
            }
            placeholder="e.g., vip, new-lead"
          />
          <p className="text-xs text-muted-foreground">
            Trigger when this specific tag is added to a subscriber.
          </p>
        </div>
      )}

      {(value.type === "campaign_opened" || value.type === "campaign_clicked") && (
        <CampaignSelector
          value={(value.config.campaignId as string) ?? ""}
          onChange={(campaignId) =>
            onChange({ ...value, config: { ...value.config, campaignId } })
          }
        />
      )}
    </div>
  );
}

function FormSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [forms, setForms] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then((res) => setForms(res.forms ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <Label>Form</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue
            placeholder={loading ? "Loading forms..." : "Select a form..."}
          />
        </SelectTrigger>
        <SelectContent>
          {forms.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Trigger when this form is submitted.
      </p>
    </div>
  );
}

function CampaignSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((res) => setCampaigns(res.campaigns ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <Label>Campaign</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue
            placeholder={loading ? "Loading campaigns..." : "Select a campaign..."}
          />
        </SelectTrigger>
        <SelectContent>
          {campaigns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Trigger when a subscriber interacts with this campaign.
      </p>
    </div>
  );
}
