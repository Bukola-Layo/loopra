"use client";

import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, PartyPopper, Mail, GitFork, Link } from "lucide-react";

type OverlayConfig = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon: React.ReactNode;
};

const OVERLAYS: Record<string, OverlayConfig> = {
  create_page: {
    title: "Create Your First Subscriber Page",
    description:
      "Pages help you collect emails and grow your audience. Share them anywhere to start building your subscriber list.",
    actionLabel: "Create Page",
    actionHref: "/dashboard/audience/pages/new",
    icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
  },
  add_subscriber: {
    title: "Great Job!",
    description:
      "Connect a subscriber list to start collecting leads. Every subscriber collected from this page will be added automatically.",
    actionLabel: "Connect List",
    actionHref: "/dashboard/audience",
    icon: <PartyPopper className="h-8 w-8 text-primary" />,
  },
  create_campaign: {
    title: "Create Your First Campaign",
    description:
      "Campaigns are emails sent to your subscribers. Examples: Weekly Newsletter, Product Launch, Event Announcement.",
    actionLabel: "Create Campaign",
    actionHref: "/dashboard/campaigns",
    icon: <Mail className="h-8 w-8 text-primary" />,
  },
  build_loop: {
    title: "Automate Your Emails",
    description:
      "Loops help you send emails automatically based on triggers and actions. Build a workflow that runs on its own.",
    actionLabel: "Create Loop",
    actionHref: "/dashboard/loops",
    icon: <GitFork className="h-8 w-8 text-primary" />,
  },
  publish_share: {
    title: "Connect Everything Together",
    description:
      "When someone subscribes through your page, automatically start your welcome sequence. Connect your page to a loop.",
    actionLabel: "Connect Loop",
    actionHref: "/dashboard/audience/pages",
    icon: <Link className="h-8 w-8 text-primary" />,
  },
};

export function OnboardingOverlay() {
  const router = useRouter();
  const { activeOverlay, dismissOverlay, completeStep, hideOverlay } =
    useOnboardingStore();

  if (!activeOverlay) return null;

  const config = OVERLAYS[activeOverlay];
  if (!config) {
    hideOverlay();
    return null;
  }

  function handleAction() {
    completeStep(activeOverlay!);
    dismissOverlay(activeOverlay!);
    router.push(config.actionHref);
  }

  function handleSkip() {
    dismissOverlay(activeOverlay!);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-xl border bg-card p-6 shadow-2xl">
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            {config.icon}
          </div>

          <h2 className="text-lg font-semibold mb-2">{config.title}</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {config.description}
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={handleAction} size="lg" className="flex-1">
              {config.actionLabel}
            </Button>
            <Button variant="ghost" onClick={handleSkip} size="lg">
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
