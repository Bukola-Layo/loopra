import type { CSSProperties } from "react";

const statusStyles: Record<string, CSSProperties> = {
  active: {
    backgroundColor: "var(--color-success-0)",
    color: "var(--color-success-2)",
    borderColor: "var(--color-success-2)",
  },
  unsubscribed: {
    backgroundColor: "var(--color-accent-0)",
    color: "var(--color-accent-4)",
    borderColor: "var(--color-accent-4)",
  },
  bounced: {
    backgroundColor: "var(--color-warning)",
    color: "#000",
    borderColor: "var(--color-warning)",
  },
};

export function subscriberStatusStyle(status: string): CSSProperties {
  return statusStyles[status] ?? {};
}
