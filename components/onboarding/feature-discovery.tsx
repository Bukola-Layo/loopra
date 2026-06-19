"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore, type FeatureId } from "@/store/use-onboarding-store";
import { Button } from "@/components/ui/button";
import { Lightbulb, X } from "lucide-react";

type Discovery = {
  id: FeatureId;
  title: string;
  description: string;
};

const DISCOVERIES: Discovery[] = [
  {
    id: "pages",
    title: "What are Pages?",
    description:
      "Pages are public subscriber landing pages designed to help you grow your audience. Share them anywhere online.",
  },
  {
    id: "forms",
    title: "Embed Forms Anywhere",
    description:
      "Create forms and embed them on your website. Subscribers automatically enter Loopra.",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description:
      "Campaigns are one-time emails sent to a group of subscribers. Examples: Newsletter, Product Launch, Announcement.",
  },
  {
    id: "loops",
    title: "Loops",
    description:
      "Loops automate email delivery. Example: Subscriber Joins \u2192 Welcome Email \u2192 Wait 3 Days \u2192 Send Resource Email.",
  },
];

type Props = {
  featureId: FeatureId;
};

export function FeatureDiscovery({ featureId }: Props) {
  const [visible, setVisible] = useState(false);
  const { seenFeatures, markFeatureSeen } = useOnboardingStore();

  useEffect(() => {
    if (!seenFeatures.includes(featureId)) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [featureId, seenFeatures]);

  if (visible) {
    return null;
  }

  const discovery = DISCOVERIES.find((d) => d.id === featureId);
  if (!discovery) return null;

  function handleDismiss() {
    markFeatureSeen(featureId);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">{discovery.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {discovery.description}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="mt-3"
          >
            Got it
          </Button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
