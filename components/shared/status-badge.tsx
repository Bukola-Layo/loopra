import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "accent" | "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "success" },
  disabled: { label: "Disabled", variant: "secondary" },
  inactive: { label: "Inactive", variant: "secondary" },
  paused: { label: "Paused", variant: "warning" },

  scheduled: { label: "Scheduled", variant: "warning" },
  sent: { label: "Sent", variant: "success" },
  sending: { label: "Sending", variant: "accent" },

  published: { label: "Published", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  subscribed: { label: "Subscribed", variant: "success" },
  unsubscribed: { label: "Unsubscribed", variant: "secondary" },
  bounced: { label: "Bounced", variant: "destructive" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status.toLowerCase()] ?? {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
