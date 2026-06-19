"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { Camera, CreditCard, Upload, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { UsageMeter } from "@/components/billing/usage-meter";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscription, setSubscription] = useState<{
    plan: { name: string; slug: string; price: number; currency: string; billingCycle: string; limits?: { subscribers: number; campaignsPerMonth: number; aiGenerations: number } };
    status: string;
    currentPeriodEnd: string | null;
  } | null>(null);
  const [usage, setUsage] = useState({ subscribers: 0, campaignsPerMonth: 0, aiGenerations: 0 });
  const [billingLoading, setBillingLoading] = useState(true);

  function handleImageSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setProfileImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveProfileImage() {
    if (!profileImage) return;
    setSavingImage(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: profileImage }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await updateSession();
      toast({ title: "Profile image updated" });
    } catch {
      toast({ title: "Failed to save image", variant: "destructive" });
    } finally {
      setSavingImage(false);
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/workspaces").then((r) => r.json()),
      fetch("/api/billing/subscription").then((r) => r.json()),
    ])
      .then(([wsRes, subRes]) => {
        const ws = wsRes.workspaces?.[0];
        if (ws) {
          setWorkspaceId(ws.id);
          setWorkspaceName(ws.name);
        }
        if (subRes.subscription) {
          setSubscription({
            plan: subRes.subscription.plan,
            status: subRes.subscription.status,
            currentPeriodEnd: subRes.subscription.currentPeriodEnd,
          });
          const u = subRes.subscription.usage ?? {};
          setUsage({
            subscribers: u.subscribers ?? 0,
            campaignsPerMonth: u.campaignsPerMonth ?? 0,
            aiGenerations: u.aiGenerations ?? 0,
          });
        }
      })
      .finally(() => {
        setLoading(false);
        setBillingLoading(false);
      });
  }, []);

  const saveWorkspace = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Workspace updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and workspace settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="rounded-full p-[2px]"
                style={{
                  background: "conic-gradient(from 0deg, #6366f1, #ec4899, #6366f1)",
                }}
              >
                <Avatar className="h-[60px] w-[60px]">
                  <AvatarImage src={profileImage ?? session?.user?.image ?? ""} />
                  <AvatarFallback className="bg-background text-primary">
                    {session?.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                }}
              />
            </div>
            <div className="text-sm">
              <p className="font-medium">{session?.user?.name ?? "User"}</p>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          {profileImage && (
            <Button size="sm" onClick={saveProfileImage} disabled={savingImage}>
              {savingImage ? "Saving..." : "Save image"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" placeholder={session?.user?.name?.split(" ")[0] ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" placeholder={session?.user?.name?.split(" ")[1] ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={session?.user?.email ?? ""} disabled />
          </div>
          <Button>Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <Button onClick={saveWorkspace} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing</CardTitle>
          <Link href="/dashboard/settings/billing">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Manage
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {billingLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{subscription.plan.name}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  {subscription.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                ${Number(subscription.plan.price)}/{subscription.plan.billingCycle}
                {subscription.currentPeriodEnd && (
                  <span className="ml-2">
                    &middot; Renews{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </p>
              <div className="space-y-2.5 pt-1">
                <UsageMeter
                  label="Subscribers"
                  current={usage.subscribers}
                  limit={subscription.plan.limits?.subscribers ?? 500}
                />
                <UsageMeter
                  label="Campaigns this month"
                  current={usage.campaignsPerMonth}
                  limit={subscription.plan.limits?.campaignsPerMonth ?? 5}
                />
                <UsageMeter
                  label="AI Generations"
                  current={usage.aiGenerations}
                  limit={subscription.plan.limits?.aiGenerations ?? 0}
                />
              </div>
              <Link href="/dashboard/settings/billing">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Upgrade plan
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No active subscription. Choose a plan to get started.
              </p>
              <Link href="/dashboard/settings/billing">
                <Button size="sm" className="gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  View plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
