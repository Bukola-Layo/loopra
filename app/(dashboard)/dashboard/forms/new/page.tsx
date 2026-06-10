"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

type FieldType = "text" | "email" | "select" | "checkbox" | "textarea";

type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  position: number;
};

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "textarea", label: "Textarea" },
];

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([
    { id: crypto.randomUUID(), label: "Email", type: "email", required: true, position: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", type: "text", required: false, position: prev.length },
    ]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, position: i })));
  }

  function updateField(id: string, updates: Partial<Field>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Form name is required", variant: "destructive" });
      return;
    }
    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) {
      toast({ title: "Add at least one field", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          fields: validFields.map((f) => ({
            label: f.label.trim(),
            type: f.type,
            required: f.required,
            position: f.position,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create form");
      toast({ title: "Form created successfully" });
      router.push("/dashboard/forms");
    } catch {
      toast({ title: "Failed to create form", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New form</h1>
          <p className="text-sm text-muted-foreground">Create a signup form to capture subscribers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Form details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Newsletter Signup" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Subscribe to get weekly updates" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fields</CardTitle>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addField}>
              <Plus className="h-3 w-3" /> Add field
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-3 p-4 rounded-lg border">
                <div className="mt-2.5 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="Field label" />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {fieldTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">Required</Label>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="mt-1 text-muted-foreground hover:text-destructive" onClick={() => removeField(field.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No fields yet. Click &quot;Add field&quot; to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/dashboard/forms">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create form"}
          </Button>
        </div>
      </form>
    </div>
  );
}
