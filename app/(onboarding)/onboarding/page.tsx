"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Users, Mail, GitFork, BarChart3, Check, Sparkles } from "lucide-react";

const goals = [
  { id: "subscribers", label: "Collect subscribers", icon: Users },
  { id: "newsletters", label: "Send newsletters", icon: Mail },
  { id: "loops", label: "Automate with Loops", icon: GitFork },
  { id: "analytics", label: "Track growth", icon: BarChart3 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  function toggleGoal(id: string) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function handleComplete() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: workspaceName || "My Workspace",
          goals: selectedGoals,
        }),
      });
    } catch {}
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-2xl border shadow-sm p-8 md:p-10">
          <div className="flex justify-center gap-1.5 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s <= step ? "bg-[var(--color-primary-color-3)] w-8" : "bg-muted w-6"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-primary-color-3)]/10 mb-6">
                <Sparkles className="h-7 w-7 text-[var(--color-primary-color-3)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
                Welcome to Loopra
              </h1>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                You&apos;re one step away from growing and automating your audience communication.
              </p>
              <Button
                size="lg"
                className="h-12 px-8 gap-2 text-base"
                onClick={() => setStep(2)}
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-1">Name your workspace</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Where all your audiences, campaigns, and Loops live.
              </p>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Workspace name</Label>
                <Input
                  id="name"
                  placeholder="e.g. My Startup, Creative Agency"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="mt-8 space-y-2">
                <Button
                  className="w-full h-11"
                  onClick={() => setStep(3)}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-1">What are your goals?</h2>
              <p className="text-muted-foreground mb-6 text-sm">Pick what you want to do with Loopra.</p>
              <div className="grid gap-2.5">
                {goals.map((g) => {
                  const selected = selectedGoals.includes(g.id);
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "bg-[var(--color-primary-color-3)]/10 border-[var(--color-primary-color-3)]/30 text-foreground"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        selected ? "bg-[var(--color-primary-color-3)]/20" : "bg-muted"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium">{g.label}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selected ? "bg-[var(--color-primary-color-3)] border-[var(--color-primary-color-3)]" : "border-muted-foreground/30"
                      }`}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-8">
                <Button
                  className="flex-1 h-11"
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up..." : "Complete setup"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
