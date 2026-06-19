"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep =
  | "create_page"
  | "add_subscriber"
  | "create_campaign"
  | "build_loop"
  | "publish_share";

export type FeatureId = "pages" | "forms" | "campaigns" | "loops";

type OnboardingState = {
  completedSteps: OnboardingStep[];
  dismissedOverlays: OnboardingStep[];
  seenFeatures: FeatureId[];
  checklistCollapsed: boolean;
  activeOverlay: OnboardingStep | null;

  isStepCompleted: (step: OnboardingStep) => boolean;
  isOverlayDismissed: (step: OnboardingStep) => boolean;
  totalSteps: () => number;
  completedCount: () => number;
  isOnboardingComplete: () => boolean;

  completeStep: (step: OnboardingStep) => void;
  dismissOverlay: (step: OnboardingStep) => void;
  showOverlay: (step: OnboardingStep) => void;
  hideOverlay: () => void;
  markFeatureSeen: (id: FeatureId) => void;
  toggleChecklist: () => void;
  reset: () => void;
};

const ALL_STEPS: OnboardingStep[] = [
  "create_page",
  "add_subscriber",
  "create_campaign",
  "build_loop",
  "publish_share",
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      dismissedOverlays: [],
      seenFeatures: [],
      checklistCollapsed: false,
      activeOverlay: null,

      isStepCompleted: (step) => get().completedSteps.includes(step),
      isOverlayDismissed: (step) => get().dismissedOverlays.includes(step),
      totalSteps: () => ALL_STEPS.length,
      completedCount: () => get().completedSteps.length,
      isOnboardingComplete: () =>
        ALL_STEPS.every((s) => get().completedSteps.includes(s)),

      completeStep: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step],
        })),

      dismissOverlay: (step) =>
        set((s) => ({
          dismissedOverlays: s.dismissedOverlays.includes(step)
            ? s.dismissedOverlays
            : [...s.dismissedOverlays, step],
          activeOverlay: null,
        })),

      showOverlay: (step) => set({ activeOverlay: step }),

      hideOverlay: () => set({ activeOverlay: null }),

      markFeatureSeen: (id) =>
        set((s) => ({
          seenFeatures: s.seenFeatures.includes(id)
            ? s.seenFeatures
            : [...s.seenFeatures, id],
        })),

      toggleChecklist: () =>
        set((s) => ({ checklistCollapsed: !s.checklistCollapsed })),

      reset: () =>
        set({
          completedSteps: [],
          dismissedOverlays: [],
          seenFeatures: [],
          checklistCollapsed: false,
          activeOverlay: null,
        }),
    }),
    { name: "loopra-onboarding" }
  )
);
