"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Code, Inbox, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
};

type Form = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "disabled";
  settings: Record<string, unknown> | null;
  fields: FormField[];
  createdAt: string;
};

type Submission = {
  id: string;
  data: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
  subscriber: { email: string; firstName: string | null; lastName: string | null } | null;
};

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/forms/${params.id}`)
      .then((r) => r.json())
      .then((res) => setForm(res.form ?? null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function toggleStatus() {
    if (!form || updating) return;
    setUpdating(true);
    const newStatus = form.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(data.form);
      toast({ title: `Form ${newStatus === "active" ? "enabled" : "disabled"}` });
    } catch {
      toast({ title: "Failed to update form status", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }

  async function deleteForm() {
    if (!form || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Form deleted" });
      router.push("/dashboard/forms");
    } catch {
      toast({ title: "Failed to delete form", variant: "destructive" });
      setDeleting(false);
    }
  }

  async function loadSubmissions() {
    if (!params?.id) return;
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/forms/${params.id}/submissions`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } finally {
      setSubmissionsLoading(false);
    }
  }

  function copyEmbedCode() {
    if (!form) return;
    const code = `<form action="${window.location.origin}/api/forms/${form.id}/submit" method="POST">
  ${form.fields.sort((a, b) => a.position - b.position).map((f) => `  <input type="${f.type === "select" ? "text" : f.type}" name="${f.label}" placeholder="${f.label}"${f.required ? " required" : ""} />`).join("\n")}
  <button type="submit">Subscribe</button>
</form>`;
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: "Embed code copied" });
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Form not found</p>
        <Link href="/dashboard/forms"><Button variant="outline" className="mt-4">Back to forms</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{form.name}</h1>
            <StatusBadge status={form.status} />
          </div>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>
        <Button variant="outline" className="gap-2" onClick={copyEmbedCode}>
          <Code className="h-4 w-4" /> Copy embed
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleStatus} disabled={updating}>
              {form.status === "active" ? (
                <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
              ) : (
                <><Power className="h-4 w-4 mr-2" /> Enable</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete form</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{form.name}"? This action cannot be undone. All fields and submissions will be permanently removed.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={deleteForm} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="fields" onValueChange={(v) => { if (v === "submissions") loadSubmissions(); }}>
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fields ({form.fields.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {form.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields configured</p>
              ) : (
                <div className="space-y-2">
                  {form.fields
                    .sort((a, b) => a.position - b.position)
                    .map((field) => (
                      <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <span className="text-sm text-muted-foreground w-6">{field.position}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-xs text-muted-foreground">{field.type}</p>
                        </div>
                        {field.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {submissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title="No submissions yet"
              description="Submissions will appear here when subscribers fill out this form."
            />
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        {sub.subscriber
                          ? `${sub.subscriber.firstName ?? ""} ${sub.subscriber.lastName ?? ""}`.trim() || sub.subscriber.email
                          : "Anonymous"}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {sub.data && Object.keys(sub.data).length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(sub.data).map(([key, value]) => (
                          <div key={key} className="flex text-xs">
                            <span className="text-muted-foreground w-32">{key}</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="embed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Copy and paste this HTML snippet into your website to embed the form.
              </p>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`<form action="${typeof window !== "undefined" ? window.location.origin : ""}/api/forms/${form.id}/submit" method="POST">
${form.fields.sort((a, b) => a.position - b.position).map((f) => `  <input type="${f.type === "select" ? "text" : f.type}" name="${f.label}" placeholder="${f.label}"${f.required ? " required" : ""} />`).join("\n")}
  <button type="submit">Subscribe</button>
</form>`}
              </pre>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={copyEmbedCode}>
                <Code className="h-4 w-4" /> Copy code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {form.settings && Object.keys(form.settings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground">
              {JSON.stringify(form.settings, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
