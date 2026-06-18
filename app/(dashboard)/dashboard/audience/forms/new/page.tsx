"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormPreview } from "@/components/forms/form-preview";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, GripVertical } from "lucide-react";

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
  options: string[];
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "textarea", label: "Textarea" },
];

export default function NewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("Subscribe");
  const [fields, setFields] = useState<Field[]>([
    { id: crypto.randomUUID(), label: "Email", type: "email", required: true, position: 0, options: [] },
    { id: crypto.randomUUID(), label: "First Name", type: "text", required: false, position: 1, options: [] },
  ]);
  const [saving, setSaving] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", type: "text", required: false, position: prev.length, options: [] },
    ]);
  }

  function updateField(id: string, updates: Partial<Field>) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  function removeField(id: string) {
    setFields((prev) =>
      prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, position: i }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Form name is required", variant: "destructive" });
      return;
    }
    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) {
      toast({ title: "At least one field with a label is required", variant: "destructive" });
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
          pageId: pageId || undefined,
          settings: { submitLabel: buttonText },
          fields: validFields.map((f) => ({
            label: f.label,
            type: f.type,
            required: f.required,
            position: f.position,
            options: f.type === "select" ? f.options.filter((o) => o.trim()) : undefined,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create form");
      const data = await res.json();
      toast({ title: "Form created successfully" });
      if (pageId) {
        router.push(`/dashboard/audience/pages/${pageId}`);
      } else {
        router.push(`/dashboard/audience/forms/${data.form.id}`);
      }
    } catch {
      toast({ title: "Failed to create form", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={pageId ? `/dashboard/audience/pages/${pageId}` : "/dashboard/audience/forms"}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Form</h1>
          <p className="text-sm text-muted-foreground">
            {pageId ? "Add a form to your page" : "Create a standalone form"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Form name</Label>
                <Input
                  id="name"
                  placeholder="Newsletter signup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Join our weekly newsletter"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button text</Label>
                <Input
                  id="buttonText"
                  placeholder="Subscribe"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Fields</CardTitle>
              <Button variant="outline" size="sm" onClick={addField} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add field
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No fields yet. Click &quot;Add field&quot; to get started.
                </p>
              ) : (
                fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 rounded-lg border p-3"
                  >
                    <div className="mt-2.5 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                        />
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateField(field.id, { type: v, options: v === "select" ? field.options : [] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {field.type === "select" && (
                        <Textarea
                          placeholder="Options (one per line)"
                          value={field.options.join("\n")}
                          onChange={(e) =>
                            updateField(field.id, { options: e.target.value.split("\n") })
                          }
                          rows={2}
                        />
                      )}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        Required
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mt-1 shrink-0"
                      onClick={() => removeField(field.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating..." : "Create Form"}
            </Button>
            <Link href={pageId ? `/dashboard/audience/pages/${pageId}` : "/dashboard/audience/forms"}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-6 self-start">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Preview</h3>
            <FormPreview
              name={name}
              description={description}
              buttonText={buttonText}
              fields={fields.map((f) => ({
                ...f,
                options: f.options || [],
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
