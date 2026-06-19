"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/billing/plan-card";
import { UsageMeter } from "@/components/billing/usage-meter";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Invoice = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  planName: string;
  reference: string | null;
};

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
};


export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<{
    plan: Plan;
    status: string;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [usage, setUsage] = useState({
    subscribers: 0,
    campaignsPerMonth: 0,
    aiGenerations: 0,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/plans").then((r) => r.json()),
      fetch("/api/billing/subscription").then((r) => r.json()),
      fetch("/api/billing/invoices").then((r) => r.json()),
    ])
      .then(([plansRes, subRes, invRes]) => {
        setPlans(plansRes.plans ?? []);
        if (subRes.subscription) {
          setSubscription({
            plan: subRes.subscription.plan,
            status: subRes.subscription.status,
            currentPeriodEnd: subRes.subscription.currentPeriodEnd,
          });
          const limits = subRes.subscription.plan.limits ?? {};
          const usageData = subRes.subscription.usage ?? {};
          setUsage({
            subscribers: usageData.subscribers ?? 0,
            campaignsPerMonth: usageData.campaignsPerMonth ?? 0,
            aiGenerations: usageData.aiGenerations ?? 0,
          });
        }
        setInvoices(invRes.invoices ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectPlan(planId: string) {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: data.error ?? "Failed to upgrade",
          variant: "destructive",
        });
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Plan updated successfully" });
        window.location.reload();
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Subscription cancelled" });
      window.location.reload();
    } catch {
      toast({ title: "Failed to cancel", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }

  const currentPlanLimits = subscription?.plan
    ? {
        subscribers: (subscription.plan as any).limits?.subscribers ?? 500,
        campaignsPerMonth:
          (subscription.plan as any).limits?.campaignsPerMonth ?? 5,
        aiGenerations:
          (subscription.plan as any).limits?.aiGenerations ?? 0,
      }
    : { subscribers: 500, campaignsPerMonth: 5, aiGenerations: 0 };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and payment history
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          View Payment History
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {subscription && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                    {subscription.status}
                  </span>
                  {subscription.status === "active" &&
                    subscription.plan.slug !== "free" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={handleCancel}
                        disabled={cancelling}
                      >
                        {cancelling ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {subscription.plan.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ${Number(subscription.plan.price)}/{subscription.plan.billingCycle}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Current period ends{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
                <div className="space-y-3 pt-2">
                  <UsageMeter
                    label="Subscribers"
                    current={usage.subscribers}
                    limit={currentPlanLimits.subscribers}
                  />
                  <UsageMeter
                    label="Campaigns this month"
                    current={usage.campaignsPerMonth}
                    limit={currentPlanLimits.campaignsPerMonth}
                  />
                  <UsageMeter
                    label="AI Generations"
                    current={usage.aiGenerations}
                    limit={currentPlanLimits.aiGenerations}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlanSlug={subscription?.plan.slug}
                  onSelect={handleSelectPlan}
                  loading={upgrading === plan.id}
                />
              ))}
            </div>
          </div>


        </>

      )}

      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment History</SheetTitle>
            <SheetDescription>Your past payments and invoices</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No payments yet
              </p>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{inv.planName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        inv.status === "success"
                          ? "bg-green-100 text-green-700"
                          : inv.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {new Date(inv.date).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-foreground">
                      {inv.currency} {inv.amount.toFixed(2)}
                    </span>
                  </div>
                  {inv.reference && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Ref: {inv.reference}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
