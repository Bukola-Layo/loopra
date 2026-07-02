"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeatureDiscovery } from "@/components/onboarding/feature-discovery";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Plus,
  MoreHorizontal,
  Copy,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SubscriberPage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "published";
  subscriberCount: number;
  createdAt: string;
  _count: {
    forms: number;
    subscribers: number;
  };
};

export default function PagesPage() {
  const [pages, setPages] = useState<SubscriberPage[]>([]);
  const [stats, setStats] = useState({ totalPages: 0, totalSubscribers: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const { showOverlay, isStepCompleted, isOverlayDismissed } =
    useOnboardingStore();

  useEffect(() => {
    fetchPages();
  }, [search, statusFilter, sort]);

  useEffect(() => {
    if (!loading && pages.length === 0 && !isStepCompleted("create_page") && !isOverlayDismissed("create_page")) {
      showOverlay("create_page");
    }
  }, [loading, pages.length]);

  async function fetchPages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sort !== "newest") params.set("sort", sort);

      const res = await fetch(`/api/pages?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPages(data.pages);
      setStats(data.stats);
    } catch {
      toast({ title: "Failed to load pages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(page: SubscriberPage) {
    try {
      const res = await fetch(`/api/pages/${page.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: page.status === "draft" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, status: data.page.status } : p))
      );
      toast({ title: data.page.status === "published" ? "Page published" : "Page unpublished" });
    } catch {
      toast({ title: "Failed to update page", variant: "destructive" });
    }
  }

  async function deletePage() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/pages/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setPages((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "Page deleted" });
    } catch {
      toast({ title: "Failed to delete page", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  function copyPageUrl(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    toast({ title: "Page URL copied" });
  }

  const conversionRate = stats.totalSubscribers > 0 && stats.totalPages > 0
    ? ((stats.totalSubscribers / (stats.totalPages * 100)) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful subscriber pages to grow your audience
          </p>
        </div>
        {pages.length > 0 && (
          <Link href="/dashboard/audience/pages/new">
            <Button size="lg" className="gap-2 shadow-sm">
              <Plus className="h-5 w-5" />
              Create Page
            </Button>
          </Link>
        )}
      </div>

      <FeatureDiscovery featureId="pages" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="space-y-12">
          <div className="flex flex-col lg:flex-row items-center gap-12 pt-4">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#1e293b] leading-tight">
                Pages that turn visits into engagements
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Create a customized landing page that makes it easy for your audience to engage. Gain valuable insights and track your performance.
              </p>
              <Button size="lg" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium px-8 h-12 text-base rounded-lg mt-4" onClick={() => { window.location.href = "/dashboard/audience/pages/new"; }}>
                Create your first page
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 w-full lg:max-w-xl">
              <div className="relative w-full aspect-[4/3] bg-[#c4b5fd] rounded-3xl overflow-hidden p-6">
                
                {/* Mobile phone mockup in the center */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-96 bg-[#4c1d95] rounded-[2rem] border-[6px] border-[#2e1065] shadow-2xl overflow-hidden flex flex-col">
                  {/* Phone Header */}
                  <div className="h-16 bg-[#5b21b6] w-full flex items-center px-4 justify-between">
                    <div className="w-20 h-3 bg-[#4c1d95] rounded-full"></div>
                    <div className="w-6 h-6 rounded-full bg-[#7c3aed]"></div>
                  </div>
                  {/* Phone Content */}
                  <div className="p-4 space-y-4">
                    <div className="flex justify-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#a78bfa]"></div>
                      <div className="w-5 h-5 rounded-full bg-[#a78bfa]"></div>
                      <div className="w-5 h-5 rounded-full bg-[#a78bfa]"></div>
                    </div>
                    <div className="w-full h-8 border border-[#a78bfa] rounded flex items-center justify-center text-[#c4b5fd] text-xs font-medium">
                      Shop Products
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                
                {/* Engagements chart (Left) */}
                <div className="absolute top-12 left-4 w-40 bg-white/90 backdrop-blur rounded-xl p-3 shadow-xl">
                  <div className="text-[10px] font-medium text-slate-500 mb-2">Engagements</div>
                  <div className="flex items-end gap-1.5 h-12">
                    <div className="w-full bg-[#10b981] h-[30%] rounded-sm"></div>
                    <div className="w-full bg-[#10b981] h-[45%] rounded-sm"></div>
                    <div className="w-full bg-[#10b981] h-[20%] rounded-sm"></div>
                    <div className="w-full bg-[#10b981] h-[70%] rounded-sm"></div>
                    <div className="w-full bg-[#10b981] h-[100%] rounded-sm"></div>
                  </div>
                </div>

                {/* Video Card (Bottom Left) */}
                <div className="absolute bottom-10 left-8 w-32 bg-[#ddd6fe] rounded-xl p-3 shadow-xl border border-white/20">
                  <div className="text-[10px] font-medium text-[#4c1d95] mb-2">Video</div>
                  <div className="w-full h-16 bg-slate-400 rounded-lg overflow-hidden relative">
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-black border-b-[4px] border-b-transparent ml-0.5"></div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Latest Collection (Center overlap) */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur rounded-xl p-3 shadow-2xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-800 mb-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#8b5cf6] rounded-sm"></div>
                    Latest collection
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 bg-[#6ee7b7] rounded-lg"></div>
                    <div className="flex-1 h-16 bg-[#fca5a5] rounded-lg"></div>
                    <div className="flex-1 h-16 bg-[#fbbf24] rounded-lg"></div>
                  </div>
                </div>

                {/* Social icons (Right) */}
                <div className="absolute bottom-16 right-6 w-24 bg-white/90 backdrop-blur rounded-xl p-3 shadow-xl">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-slate-400 rounded-full"></div></div>
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-slate-400 rounded-sm"></div></div>
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-slate-400 rounded-full"></div></div>
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-slate-400 rounded-full"></div></div>
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-slate-400 rounded-full"></div></div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>


        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                  <p className="text-2xl font-bold">{stats.totalPages}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                  <p className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pages Published</p>
                  <p className="text-2xl font-bold">
                    {pages.filter((p) => p.status === "published").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Conversion</p>
                  <p className="text-2xl font-bold">{conversionRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="subscribers">Most Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <div key={page.id} className="group relative">
              <Link href={`/dashboard/audience/pages/${page.id}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{page.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            /p/{page.slug}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={page.status === "published" ? "default" : "secondary"}
                        className="shrink-0 text-[10px]"
                      >
                        {page.status}
                      </Badge>
                    </div>

                    {page.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {page.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Subscribers</p>
                        <p className="text-sm font-semibold">{page._count.subscribers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Forms</p>
                        <p className="text-sm font-semibold">{page._count.forms}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(page.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => copyPageUrl(page.slug)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    {page.status === "published" && (
                      <DropdownMenuItem onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Live
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => togglePublish(page)}>
                      {page.status === "published" ? (
                        <><XCircle className="h-4 w-4 mr-2" /> Unpublish</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Publish</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(page.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              This will permanently delete this page and its forms. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deletePage}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
