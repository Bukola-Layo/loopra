"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Upload, Download, ChevronRight, Plus, X, FileText, CheckCircle, AlertCircle, Mail, Calendar, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseCSV, previewCSV, mapCSVToSubscribers, type CSVPreview, type FieldMapping } from "@/lib/csv";
import { tagColorStyle } from "@/lib/tag-colors";
import { subscriberStatusStyle } from "@/lib/subscriber-status";
import { SUBSCRIBER_SOURCES, sourceLabel } from "@/lib/subscriber-source";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  source: string;
  tags: Array<{ tag: string }>;
  createdAt: string;
};

type ImportResult = {
  created: number;
  skipped: number;
  errors: number;
};

type SubscriberDetail = Subscriber & {
  customFields: Record<string, unknown> | null;
  lastEngagedAt: string | null;
};

export default function AudiencePage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addTagInput, setAddTagInput] = useState("");
  const [addTags, setAddTags] = useState<string[]>([]);
  const [addSource, setAddSource] = useState("manual");
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "result">("upload");
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [csvFullRows, setCsvFullRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({ email: "", firstName: "", lastName: "", source: "" });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subscriberDetail, setSubscriberDetail] = useState<SubscriberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEditOpen, setDetailEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editSource, setEditSource] = useState("manual");
  const [editTagInput, setEditTagInput] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/audience?${params}`);
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(total / limit);

  function addTag() {
    const t = addTagInput.trim().toLowerCase();
    if (t && !addTags.includes(t)) setAddTags((prev) => [...prev, t]);
    setAddTagInput("");
  }

  function removeTag(tag: string) {
    setAddTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail.trim(),
          firstName: addFirstName.trim() || undefined,
          lastName: addLastName.trim() || undefined,
          source: addSource,
          tags: addTags.length > 0 ? addTags : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add subscriber");
      }
      toast({ title: "Subscriber added" });
      setDialogOpen(false);
      setAddEmail("");
      setAddFirstName("");
      setAddLastName("");
      setAddSource("manual");
      setAddTags([]);
      fetchSubscribers();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to add subscriber", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const preview = previewCSV(text);
      if (preview.headers.length === 0) {
        toast({ title: "Could not parse CSV", variant: "destructive" });
        return;
      }
      setCsvPreview(preview);
      const all = parseCSV(text);
      const headers = all[0];
      const rows = all.slice(1);
      setCsvFullRows(rows);

      const autoMap: FieldMapping = { email: "", firstName: "", lastName: "", source: "" };
      for (const h of headers) {
        const lower = h.toLowerCase();
        if (!autoMap.email && (lower === "email" || lower === "e-mail" || lower === "mail")) autoMap.email = h;
        if (!autoMap.firstName && (lower === "first name" || lower === "firstname" || lower === "first" || lower === "given name")) autoMap.firstName = h;
        if (!autoMap.lastName && (lower === "last name" || lower === "lastname" || lower === "last" || lower === "family name" || lower === "surname")) autoMap.lastName = h;
        if (!autoMap.source && (lower === "source" || lower === "lead source" || lower === "origin")) autoMap.source = h;
      }
      setMapping(autoMap);
      setImportStep("mapping");
    };
    reader.readAsText(file);
  }

  function resetImport() {
    setImportOpen(false);
    setImportStep("upload");
    setCsvText("");
    setCsvPreview(null);
    setCsvFullRows([]);
    setMapping({ email: "", firstName: "", lastName: "", source: "" });
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setSubscriberDetail(null);
    setDetailEditOpen(false);
    setDetailError(null);
    try {
      const res = await fetch(`/api/audience/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error ?? "Failed to load subscriber");
        return;
      }
      const sub = data.subscriber ?? null;
      setSubscriberDetail(sub);
      if (sub) {
        setEditFirstName(sub.firstName ?? "");
        setEditLastName(sub.lastName ?? "");
        setEditStatus(sub.status);
        setEditSource(sub.source ?? "manual");
        setEditTags(sub.tags?.map((t: { tag: string }) => t.tag) ?? []);
      }
    } catch {
      setDetailError("Network error loading subscriber");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setSubscriberDetail(null);
    setDetailEditOpen(false);
    setDetailError(null);
  }

  function addDetailTag() {
    const t = editTagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) setEditTags((prev) => [...prev, t]);
    setEditTagInput("");
  }

  function removeDetailTag(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleDetailSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setDetailSaving(true);
    try {
      const res = await fetch(`/api/audience/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim() || undefined,
          lastName: editLastName.trim() || undefined,
          status: editStatus,
          source: editSource,
          tags: editTags.length > 0 ? editTags : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setSubscriberDetail(data.subscriber);
      setDetailEditOpen(false);
      toast({ title: "Subscriber updated" });
      fetchSubscribers();
    } catch {
      toast({ title: "Failed to update subscriber", variant: "destructive" });
    } finally {
      setDetailSaving(false);
    }
  }

  function handleDeleteClick() {
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!selectedId) return;
    setDeleteConfirmOpen(false);
    try {
      const res = await fetch(`/api/audience/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Subscriber deleted" });
      closeDetail();
      fetchSubscribers();
    } catch {
      toast({ title: "Failed to delete subscriber", variant: "destructive" });
    }
  }

  const VALID_SOURCES = new Set(["manual", "import", "website_form", "instagram", "facebook", "newsletter", "api", "other"]);

  async function handleImport() {
    if (!mapping.email) {
      toast({ title: "Map the email column before importing", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const mapped = mapCSVToSubscribers(csvFullRows, csvPreview!.headers, mapping);
      const subscribers = mapped.map((s) => ({
        ...s,
        source: s.source && VALID_SOURCES.has(s.source) ? s.source : "import",
      }));
      if (subscribers.length === 0) {
        toast({ title: "No valid subscribers found in CSV", variant: "destructive" });
        setImporting(false);
        return;
      }
      const res = await fetch("/api/audience/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult(data.results);
      setImportStep("result");
      fetchSubscribers();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  const activeCount = subscribers.filter((s) => s.status === "active").length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "unsubscribed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscribers and segments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add subscriber
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-green-600">{activeCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unsubscribed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-muted-foreground">{unsubscribedCount}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No subscribers yet"
          description="Add subscribers manually, import a CSV, or create a signup form to start building your audience."
          action={{
            label: "Add subscriber",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <>
          <div className="rounded-md border bg-white">
            {subscribers.map((sub) => (
              <button
                key={sub.id}
                onClick={() => openDetail(sub.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {sub.firstName || sub.lastName
                      ? `${sub.firstName ?? ""} ${sub.lastName ?? ""}`.trim()
                      : sub.email}
                  </p>
                  {sub.firstName && <p className="text-xs text-muted-foreground truncate">{sub.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {sub.tags?.slice(0, 2).map((t) => (
                    <span key={t.tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={tagColorStyle(t.tag)}>
                      {t.tag}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground hidden sm:inline">{sourceLabel(sub.source)}</span>
                  <Badge
                    style={subscriberStatusStyle(sub.status)}
                    className="text-xs"
                  >
                    {sub.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subscriber</DialogTitle>
            <DialogDescription>
              Add a new subscriber to your audience.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubscriber} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input id="add-email" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="subscriber@example.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-first">First name</Label>
                <Input id="add-first" value={addFirstName} onChange={(e) => setAddFirstName(e.target.value)} placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-last">Last name</Label>
                <Input id="add-last" value={addLastName} onChange={(e) => setAddLastName(e.target.value)} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-source">Source</Label>
              <select
                id="add-source"
                value={addSource}
                onChange={(e) => setAddSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SUBSCRIBER_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={addTagInput}
                  onChange={(e) => setAddTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Type tag and press Enter"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {addTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {addTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold gap-1" style={tagColorStyle(tag)}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add subscriber"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) resetImport(); }}>
        <DialogContent className="max-w-4xl">
          {importStep === "upload" && (
            <>
              <DialogHeader>
                <DialogTitle>Import subscribers</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your subscriber data.
                </DialogDescription>
              </DialogHeader>
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload a CSV file</p>
                <p className="text-xs text-muted-foreground">.csv files only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetImport}>Cancel</Button>
              </DialogFooter>
            </>
          )}

          {importStep === "mapping" && csvPreview && (
            <>
              <DialogHeader>
                <DialogTitle>Map columns</DialogTitle>
                <DialogDescription>
                  Map CSV columns to subscriber fields. Email is required.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email column *</Label>
                    <select
                      value={mapping.email}
                      onChange={(e) => setMapping((prev) => ({ ...prev, email: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">-- Select --</option>
                      {csvPreview.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">First name column</Label>
                    <select
                      value={mapping.firstName}
                      onChange={(e) => setMapping((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">-- None --</option>
                      {csvPreview.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last name column</Label>
                    <select
                      value={mapping.lastName}
                      onChange={(e) => setMapping((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">-- None --</option>
                      {csvPreview.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source column</Label>
                    <select
                      value={mapping.source}
                      onChange={(e) => setMapping((prev) => ({ ...prev, source: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">-- None (import) --</option>
                      {csvPreview.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Preview ({csvPreview.rows.length} of {csvFullRows.length} rows)
                  </Label>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          {csvPreview.headers.map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.rows.map((row, i) => (
                          <tr key={i} className="border-t">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-1.5 truncate max-w-40">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportStep("upload")}>Back</Button>
                <Button onClick={handleImport} disabled={importing || !mapping.email}>
                  {importing ? "Importing..." : `Import ${csvFullRows.length} subscribers`}
                </Button>
              </DialogFooter>
            </>
          )}

          {importStep === "result" && importResult && (
            <>
              <DialogHeader>
                <DialogTitle>Import complete</DialogTitle>
                <DialogDescription>
                  Here is a summary of the import.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{importResult.created} created</p>
                  </div>
                </div>
                {importResult.skipped > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">{importResult.skipped} skipped (already exist)</p>
                    </div>
                  </div>
                )}
                {importResult.errors > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{importResult.errors} errors</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={resetImport}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent>
          {detailLoading ? (
            <div className="space-y-4 pt-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : subscriberDetail ? (
            <div className="flex flex-col h-full">
              <SheetHeader className="pb-4 border-b">
                <div className="pr-8">
                  <SheetTitle>
                    {subscriberDetail.firstName || subscriberDetail.lastName
                      ? `${subscriberDetail.firstName ?? ""} ${subscriberDetail.lastName ?? ""}`.trim()
                      : subscriberDetail.email}
                  </SheetTitle>
                  {subscriberDetail.firstName && (
                    <SheetDescription>{subscriberDetail.email}</SheetDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge style={subscriberStatusStyle(subscriberDetail.status)}>
                    {subscriberDetail.status}
                  </Badge>
                  <button
                    onClick={() => setDetailEditOpen(true)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{subscriberDetail.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Subscribed {new Date(subscriberDetail.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-4 w-4 text-muted-foreground shrink-0 flex items-center justify-center text-xs">⌂</span>
                    <span>Source: {sourceLabel(subscriberDetail.source)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</h4>
                  {subscriberDetail.tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {subscriberDetail.tags.map((t) => (
                        <span key={t.tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={tagColorStyle(t.tag)}>{t.tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {subscriberDetail.customFields && Object.keys(subscriberDetail.customFields).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom Fields</h4>
                    <div className="space-y-1.5">
                      {Object.entries(subscriberDetail.customFields).map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                          <span className="text-muted-foreground w-28 shrink-0">{key}</span>
                          <span className="truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {detailEditOpen && (
                <div className="border-t pt-4">
                  <form onSubmit={handleDetailSave} className="space-y-3">
                    <h4 className="text-sm font-medium">Edit subscriber</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First name</Label>
                        <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last name</Label>
                        <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="active">Active</option>
                      <option value="unsubscribed">Unsubscribed</option>
                      <option value="bounced">Bounced</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Source</Label>
                    <select
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {SUBSCRIBER_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tags</Label>
                      <div className="flex gap-1.5">
                        <Input
                          value={editTagInput}
                          onChange={(e) => setEditTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDetailTag(); } }}
                          placeholder="Add tag"
                          className="h-9 text-sm flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addDetailTag} className="h-9">Add</Button>
                      </div>
                      {editTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {editTags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold gap-1" style={tagColorStyle(tag)}>
                              {tag}
                              <button type="button" onClick={() => removeDetailTag(tag)} className="hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => setDetailEditOpen(false)}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={detailSaving}>{detailSaving ? "Saving..." : "Save"}</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete subscriber</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscriber? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
