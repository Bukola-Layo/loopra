"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Palette,
  FileText,
  Zap,
  Send,
  ChevronRight,
  Upload,
  X,
  Mail,
} from "lucide-react";

const STEPS = [
  { id: "template", label: "Template", icon: FileText },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "form", label: "Form", icon: ExternalLink },
  { id: "automation", label: "Automation", icon: Zap },
  { id: "publish", label: "Publish", icon: Send },
];

const PAGE_TEMPLATES = [
  { id: "creator", name: "Creator", description: "For individual creators and personal brands" },
  { id: "startup", name: "Startup", description: "For startups and early-stage companies" },
  { id: "saas", name: "SaaS", description: "For software products and services" },
  { id: "business", name: "Business", description: "For small businesses and agencies" },
  { id: "church", name: "Church", description: "For religious organizations" },
  { id: "nonprofit", name: "Nonprofit", description: "For charitable organizations" },
  { id: "event", name: "Event", description: "For events and conferences" },
  { id: "product-launch", name: "Product Launch", description: "For product launches" },
  { id: "education", name: "Education", description: "For educational content and courses" },
];

const FORM_TYPES = [
  { id: "email-only", label: "Email Only", description: "Just an email field" },
  { id: "name-email", label: "Name + Email", description: "First name and email fields" },
  { id: "custom", label: "Custom Fields", description: "Full customizable form" },
];

const AFTER_SUBSCRIBE_OPTIONS = [
  { id: "none", label: "Do Nothing", description: "Just add subscriber to list" },
  { id: "welcome_email", label: "Send Welcome Email", description: "Send a welcome email" },
  { id: "start_loop", label: "Start Loop", description: "Trigger an automation loop" },
];

export default function NewPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { completeStep, showOverlay } = useOnboardingStore();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    setLoopsLoading(true);
    setCampaignsLoading(true);
    Promise.all([
      fetch("/api/loops").then((r) => r.json()).then((res) => setLoops(res.loops ?? [])).catch(() => {}),
      fetch("/api/campaigns").then((r) => r.json()).then((res) => setCampaigns(res.campaigns ?? [])).catch(() => {}),
    ]).finally(() => {
      setLoopsLoading(false);
      setCampaignsLoading(false);
    });
  }, [step]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    template: null as string | null,
    logo: "",
    coverImage: "",
    buttonText: "Subscribe",
    accentColor: "#dd2d4a",
    formType: "name-email",
    afterSubscribe: "none",
    loopId: "",
    campaignId: "",
    publishAfterCreate: false,
  });

  type Loop = { id: string; name: string; status: string; trigger: { type: string } | null };
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loopsLoading, setLoopsLoading] = useState(false);

  type CampaignOption = { id: string; title: string };
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  function onNameChange(value: string) {
    const slugFromName = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setForm((f) => ({
      ...f,
      name: value,
      slug: (!form.slug || form.slug === slugFromName) ? slugFromName : form.slug,
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!form.template;
      case 1: return !!form.name.trim() && !!form.slug.trim();
      case 2: return true;
      case 3:
        if (form.afterSubscribe === "start_loop") return !!form.loopId;
        if (form.afterSubscribe === "welcome_email") return !!form.campaignId;
        return true;
      case 4: return true;
      default: return false;
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          template: form.template,
          logo: form.logo || undefined,
          coverImage: form.coverImage || undefined,
          showSubscriberCount: true,
          settings: {
            accentColor: form.accentColor,
            buttonText: form.buttonText,
            formType: form.formType,
            afterSubscribe: form.afterSubscribe,
            loopId: form.afterSubscribe === "start_loop" ? form.loopId : undefined,
            campaignId: form.afterSubscribe === "welcome_email" ? form.campaignId : undefined,
            collectName: form.formType !== "email-only",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.code === "SLUG_TAKEN") {
          toast({ title: "This slug is already taken", variant: "destructive" });
          return;
        }
        throw new Error("Failed");
      }

      const data = await res.json();

      if (form.publishAfterCreate) {
        await fetch(`/api/pages/${data.page.id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        });
      }

      toast({ title: "Page created successfully" });
      completeStep("create_page");
      showOverlay("add_subscriber");
      router.push(`/dashboard/audience/pages/${data.page.id}`);
    } catch {
      toast({ title: "Failed to create page", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/audience/pages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Page</h1>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  i === step && "bg-primary text-primary-foreground",
                  i < step && "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                  i > step && "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <s.icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "h-px flex-1",
                  i < step ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Choose a template</h2>
              <p className="text-sm text-muted-foreground">Pick a starting point for your page</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PAGE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, template: t.id })}
                  className={cn(
                    "relative rounded-xl border p-5 text-left transition-all hover:border-primary/50",
                    form.template === t.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-input bg-card"
                  )}
                >
                  {form.template === t.id && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Customize branding</h2>
              <p className="text-sm text-muted-foreground">Set up your page identity and appearance</p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <ImageUpload
                      value={form.logo}
                      onChange={(v) => setForm({ ...form, logo: v })}
                      accept="image/*"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <ImageUpload
                      value={form.coverImage}
                      onChange={(v) => setForm({ ...form, coverImage: v })}
                      accept="image/*"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Page title</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Design With Bukola"
                    value={form.name}
                    onChange={(e) => onNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Page URL</Label>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground">
                    <span className="shrink-0">{origin}/p/</span>
                    <input
                      id="slug"
                      className="flex-1 bg-transparent py-2 outline-none"
                      placeholder="designwithbukola"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Weekly UI/UX tips, resources, and design inspiration."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Button text</Label>
                    <Input
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Accent color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        className="h-10 w-10 rounded-lg border border-input bg-background p-0.5 cursor-pointer"
                      />
                      <Input
                        value={form.accentColor}
                        onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Configure subscriber form</h2>
              <p className="text-sm text-muted-foreground">Choose what information to collect from subscribers</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {FORM_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setForm({ ...form, formType: ft.id })}
                  className={cn(
                    "relative rounded-xl border p-5 text-left transition-all hover:border-primary/50",
                    form.formType === ft.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-input bg-card"
                  )}
                >
                  {form.formType === ft.id && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium">{ft.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{ft.description}</p>
                </button>
              ))}
            </div>
            {form.formType === "custom" && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Custom field configuration coming soon. You&apos;ll be able to add custom fields after creating the page.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Configure automation</h2>
              <p className="text-sm text-muted-foreground">What happens when someone subscribes?</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {AFTER_SUBSCRIBE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, afterSubscribe: opt.id, loopId: opt.id !== "start_loop" ? "" : form.loopId });
                  }}
                  className={cn(
                    "relative rounded-xl border p-5 text-left transition-all hover:border-primary/50",
                    form.afterSubscribe === opt.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-input bg-card"
                  )}
                >
                  {form.afterSubscribe === opt.id && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium">{opt.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>

            {form.afterSubscribe === "welcome_email" && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Welcome Campaign</Label>
                    {campaignsLoading ? (
                      <p className="text-sm text-muted-foreground mt-1">Loading campaigns...</p>
                    ) : campaigns.length === 0 ? (
                      <div className="mt-1.5 rounded-lg border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          No campaigns yet. Create a welcome campaign to send when someone subscribes.
                        </p>
                        <Link href="/dashboard/campaigns" target="_blank">
                          <Button type="button" variant="outline" size="sm">
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Create Campaign
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Select
                            value={form.campaignId}
                            onValueChange={(v) => setForm({ ...form, campaignId: v })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Choose a campaign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {campaigns.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Link href="/dashboard/campaigns" target="_blank">
                            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              New
                            </Button>
                          </Link>
                        </div>
                        {form.campaignId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            This campaign will be sent automatically when a new subscriber signs up.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {form.afterSubscribe === "start_loop" && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Select Loop</Label>
                    {loopsLoading ? (
                      <p className="text-sm text-muted-foreground mt-1">Loading loops...</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Select
                            value={form.loopId}
                            onValueChange={(v) => setForm({ ...form, loopId: v })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Choose a loop..." />
                            </SelectTrigger>
                            <SelectContent>
                              {loops.length === 0 && (
                                <SelectItem value="__none" disabled>
                                  No loops available
                                </SelectItem>
                              )}
                              {loops.map((loop) => (
                                <SelectItem key={loop.id} value={loop.id}>
                                  {loop.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Link href="/dashboard/loops/new" target="_blank">
                            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5">
                              <Zap className="h-3.5 w-3.5" />
                              New Loop
                            </Button>
                          </Link>
                        </div>
                        {form.loopId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            This loop will be triggered when a new subscriber signs up.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Review and publish</h2>
              <p className="text-sm text-muted-foreground">Review your page settings before publishing</p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Template</p>
                    <p className="text-sm font-medium capitalize">{form.template ?? "None"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{form.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">URL</p>
                    <p className="text-sm font-medium">/p/{form.slug || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Form type</p>
                    <p className="text-sm font-medium capitalize">{form.formType.replace("-", " + ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">After subscribe</p>
                    <p className="text-sm font-medium capitalize">
                      {AFTER_SUBSCRIBE_OPTIONS.find((o) => o.id === form.afterSubscribe)?.label}
                    </p>
                    {form.afterSubscribe === "start_loop" && form.loopId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Loop: {loops.find((l) => l.id === form.loopId)?.name ?? form.loopId}
                      </p>
                    )}
                    {form.afterSubscribe === "welcome_email" && form.campaignId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Campaign: {campaigns.find((c) => c.id === form.campaignId)?.title ?? form.campaignId}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accent color</p>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border" style={{ backgroundColor: form.accentColor }} />
                      <span className="text-sm font-medium">{form.accentColor}</span>
                    </div>
                  </div>
                </div>
                {form.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{form.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    id="publishAfter"
                    checked={form.publishAfterCreate}
                    onChange={(e) => setForm({ ...form, publishAfterCreate: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <Label htmlFor="publishAfter" className="text-sm cursor-pointer">
                    Publish immediately after creation
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        <div className="flex items-center gap-3">
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving} size="lg" className="gap-2">
              {saving ? "Creating..." : form.publishAfterCreate ? "Publish Page" : "Save Page"}
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageUpload({
  value,
  onChange,
  accept,
}: {
  value: string;
  onChange: (v: string) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary/50",
        value ? "border-transparent bg-muted/20" : "border-border"
      )}
    >
      {value ? (
        <>
          <img
            src={value}
            alt="Preview"
            className="h-full w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
          <span className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            Click to replace
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Upload image</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
