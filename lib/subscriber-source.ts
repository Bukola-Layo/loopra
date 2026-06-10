import { Globe, Smartphone, Megaphone, Mail, FileSpreadsheet, Terminal, Plus } from "lucide-react";

export const SUBSCRIBER_SOURCES = [
  { value: "manual", label: "Manual", icon: Plus },
  { value: "import", label: "CSV Import", icon: FileSpreadsheet },
  { value: "website_form", label: "Website Form", icon: Globe },
  { value: "instagram", label: "Instagram", icon: Smartphone },
  { value: "facebook", label: "Facebook Ads", icon: Megaphone },
  { value: "newsletter", label: "Newsletter", icon: Mail },
  { value: "api", label: "API", icon: Terminal },
  { value: "other", label: "Other", icon: Plus },
] as const;

export function sourceLabel(value: string): string {
  return SUBSCRIBER_SOURCES.find((s) => s.value === value)?.label ?? value;
}
