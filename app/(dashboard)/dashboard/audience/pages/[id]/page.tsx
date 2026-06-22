"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Copy,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
  TrendingUp,
  Globe,
  FileText,
  Plus,
  Settings,
  Zap,
  Search,
  Mail,
  ChevronRight,
  Image,
} from "lucide-react";

const AFTER_SUBSCRIBE_OPTIONS = [
  { id: "none", label: "Do Nothing" },
  { id: "welcome_email", label: "Send Welcome Email" },
  { id: "start_loop", label: "Start Loop" },
];

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
};

type PageForm = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  fields: FormField[];
  createdAt: string;
};

type PageSubscriber = {
  id: string;
  email: string;
  firstName: string | null;
  createdAt: string;
};

type SubscriberPage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  template: string | null;
  status: "draft" | "published";
  settings: Record<string, unknown> | null;
  subscriberCount: number;
  showSubscriberCount: boolean;
  createdAt: string;
  forms: PageForm[];
  _count: { subscribers: number };
};

export default function PageDetail() {
  const params = useParams();
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [page, setPage] = useState<SubscriberPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { completeStep } = useOnboardingStore();

  const [subscribers, setSubscribers] = useState<PageSubscriber[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(0);

  const [settingsDraft, setSettingsDraft] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    coverImage: "",
    buttonText: "Subscribe",
    accentColor: "#dd2d4a",
    showSubscriberCount: true,
    collectName: true,
    afterSubscribe: "none",
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    fetchPage();
  }, [params.id]);

  useEffect(() => {
    if (page && activeTab === "subscribers") {
      fetchSubscribers();
    }
  }, [page, activeTab, subPage, subSearch]);

  async function fetchPage() {
    try {
      const res = await fetch(`/api/pages/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPage(data.page);
      const s = data.page.settings || {};
      setSettingsDraft({
        name: data.page.name,
        slug: data.page.slug,
        description: data.page.description || "",
        logo: data.page.logo || "",
        coverImage: data.page.coverImage || "",
        buttonText: s.buttonText || "Subscribe",
        accentColor: s.accentColor || "#dd2d4a",
        showSubscriberCount: data.page.showSubscriberCount,
        collectName: s.collectName !== false,
        afterSubscribe: s.afterSubscribe || "none",
      });
    } catch {
      toast({ title: "Failed to load page", variant: "destructive" });
      router.push("/dashboard/audience/pages");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscribers() {
    if (!page) return;
    setSubLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("pageId", page.id);
      params.set("page", String(subPage));
      params.set("limit", "10");
      if (subSearch) params.set("search", subSearch);
      const res = await fetch(`/api/audience?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSubscribers(data.subscribers);
      setSubTotal(data.total);
    } catch {
      toast({ title: "Failed to load subscribers", variant: "destructive" });
    } finally {
      setSubLoading(false);
    }
  }

  async function togglePublish() {
    if (!page) return;
    const publish = page.status === "draft";
    try {
      const res = await fetch(`/api/pages/${page.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPage({ ...page, status: data.page.status });
      if (publish) {
        completeStep("publish_share");
      }
      toast({ title: publish ? "Page published" : "Page unpublished" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  async function deletePage() {
    if (!page) return;
    try {
      await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      toast({ title: "Page deleted" });
      router.push("/dashboard/audience/pages");
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  async function saveSettings() {
    if (!page) return;
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsDraft.name,
          slug: settingsDraft.slug,
          description: settingsDraft.description || null,
          logo: settingsDraft.logo || null,
          coverImage: settingsDraft.coverImage || null,
          showSubscriberCount: settingsDraft.showSubscriberCount,
          settings: {
            ...(page.settings as Record<string, unknown>),
            buttonText: settingsDraft.buttonText,
            accentColor: settingsDraft.accentColor,
            collectName: settingsDraft.collectName,
            afterSubscribe: settingsDraft.afterSubscribe,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.code === "SLUG_TAKEN") {
          toast({ title: "Slug already taken", variant: "destructive" });
          return;
        }
        throw new Error("Failed");
      }
      toast({ title: "Settings saved" });
      fetchPage();
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  }

  function copyPageUrl() {
    if (!page) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${page.slug}`);
    toast({ title: "Page URL copied" });
  }

  const totalSubs = page?.subscriberCount ?? 0;
  const conversionRate = 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!page) return null;

  const accentColor = (page.settings?.accentColor as string) || "#dd2d4a";
  const formType = (page.settings?.formType as string) || "name-email";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/audience/pages">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{page.name}</h1>
              <Badge variant={page.status === "published" ? "default" : "secondary"}>
                {page.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">/p/{page.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
              <Eye className="h-4 w-4" />
              View
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={copyPageUrl}>
            <Copy className="h-4 w-4" />
            Copy URL
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={togglePublish}>
            {page.status === "published" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {page.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto gap-0">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "subscribers", label: "Subscribers", icon: Users },
            { id: "forms", label: "Forms", icon: FileText },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Connected Forms</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{page.forms.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <div
                    className="flex flex-col items-center px-6 py-10 text-center"
                    style={{ backgroundColor: "#fafafa" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{ backgroundColor: accentColor + "15", width: 64, height: 64 }}
                    >
                      {page.logo ? (
                        <img src={page.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <Globe className="h-6 w-6" style={{ color: accentColor }} />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{page.name}</h3>
                    {page.description && (
                      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{page.description}</p>
                    )}
                    {page.showSubscriberCount && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {totalSubs} subscriber{totalSubs !== 1 ? "s" : ""}
                      </div>
                    )}
                    <div className="mt-5 w-full max-w-xs space-y-2">
                      {(settingsDraft.collectName || formType !== "email-only") && (
                        <Input placeholder="Your name" disabled className="bg-white" />
                      )}
                      <div className="flex gap-2">
                        <Input placeholder="Email address" disabled className="bg-white flex-1" />
                        <Button disabled size="sm" style={{ backgroundColor: accentColor }}>
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {page.status === "published" ? (
                    <Button className="w-full justify-between" variant="outline" onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                      <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> View live page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="w-full justify-between" variant="outline" onClick={togglePublish}>
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Publish page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  <Button className="w-full justify-between" variant="outline" onClick={copyPageUrl}>
                    <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy page URL</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Link href={`/dashboard/audience/forms/new?pageId=${page.id}`}>
                    <Button className="w-full justify-between" variant="outline">
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add a form</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button className="w-full justify-between" variant="outline" onClick={() => setActiveTab("settings")}>
                    <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Edit settings</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Page Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Template</span>
                    <span className="font-medium capitalize">{page.template || "Custom"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(page.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Form type</span>
                    <span className="font-medium capitalize">{formType.replace("-", " + ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After subscribe</span>
                    <span className="font-medium">
                      {AFTER_SUBSCRIBE_OPTIONS.find((o) => o.id === (page.settings?.afterSubscribe as string))?.label || "Do Nothing"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Subscribers</h2>
              <p className="text-sm text-muted-foreground">
                {subTotal} subscriber{subTotal !== 1 ? "s" : ""} acquired through this page
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={subSearch}
                onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {subLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : subscribers.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No subscribers yet</p>
                  {page.status === "draft" && (
                    <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={togglePublish}>
                      <CheckCircle2 className="h-4 w-4" /> Publish page to start collecting
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {subscribers.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {sub.firstName ? `${sub.firstName} — ${sub.email}` : sub.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {subTotal > 10 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(subPage - 1) * 10 + 1}–{Math.min(subPage * 10, subTotal)} of {subTotal}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={subPage <= 1} onClick={() => setSubPage(subPage - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={subPage * 10 >= subTotal} onClick={() => setSubPage(subPage + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="forms" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Connected Forms</h2>
              <p className="text-sm text-muted-foreground">
                Forms attached to this page
              </p>
            </div>
            <Link href={`/dashboard/audience/forms/new?pageId=${page.id}`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add form
              </Button>
            </Link>
          </div>

          {page.forms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No forms attached yet</p>
                <Link href={`/dashboard/audience/forms/new?pageId=${page.id}`}>
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <Plus className="h-4 w-4" />
                    Create form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {page.forms.map((form) => (
                <Card key={form.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{form.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {form.fields.length} field{form.fields.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant={form.status === "active" ? "default" : "secondary"}>
                        {form.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/embed/${form.id}`
                          );
                          toast({ title: "Form action URL copied" });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        Copy action URL
                      </Button>
                      <Link href={`/dashboard/audience/forms/${form.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                          <Settings className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">No data yet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSubs}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Subscribers ÷ Views</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-12">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Analytics charts will appear here once you have subscriber data</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Sources</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <Globe className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Source breakdown coming soon</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscriber Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">Activity timeline coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Page Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your page branding, form, and automation</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={settingsDraft.logo}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, logo: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com/cover.png"
                      value={settingsDraft.coverImage}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, coverImage: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-name">Page name</Label>
                <Input
                  id="s-name"
                  value={settingsDraft.name}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-slug">Page URL</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground">
                  <span className="shrink-0">{origin}/p/</span>
                  <input
                    id="s-slug"
                    className="flex-1 bg-transparent py-2 outline-none"
                    value={settingsDraft.slug}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-desc">Description</Label>
                <Textarea
                  id="s-desc"
                  value={settingsDraft.description}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Button text</Label>
                  <Input
                    value={settingsDraft.buttonText}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, buttonText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settingsDraft.accentColor}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, accentColor: e.target.value })}
                      className="h-10 w-10 rounded-lg border border-input bg-background p-0.5 cursor-pointer"
                    />
                    <Input
                      value={settingsDraft.accentColor}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, accentColor: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Form Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Show subscriber count</Label>
                  <p className="text-xs text-muted-foreground">Display subscriber count on the public page</p>
                </div>
                <Switch
                  checked={settingsDraft.showSubscriberCount}
                  onCheckedChange={(checked) =>
                    setSettingsDraft({ ...settingsDraft, showSubscriberCount: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Collect first name</Label>
                  <p className="text-xs text-muted-foreground">Show name field on the subscribe form</p>
                </div>
                <Switch
                  checked={settingsDraft.collectName}
                  onCheckedChange={(checked) =>
                    setSettingsDraft({ ...settingsDraft, collectName: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose what happens when someone subscribes</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {AFTER_SUBSCRIBE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSettingsDraft({ ...settingsDraft, afterSubscribe: opt.id })}
                    className={`rounded-xl border p-4 text-left transition-all hover:border-primary/50 ${
                      settingsDraft.afterSubscribe === opt.id
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : "border-input bg-card"
                    }`}
                  >
                    <h3 className="text-sm font-medium">{opt.label}</h3>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => fetchPage()}>
              Reset
            </Button>
            <Button onClick={saveSettings}>
              Save changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              This will permanently delete this page and its associated forms. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


