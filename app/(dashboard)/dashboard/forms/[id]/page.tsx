"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Code } from "lucide-react";
import Link from "next/link";

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
  settings: Record<string, unknown> | null;
  fields: FormField[];
  createdAt: string;
};

export default function FormDetailPage() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/forms/${params.id}`)
      .then((r) => r.json())
      .then((res) => setForm(res.form ?? null))
      .finally(() => setLoading(false));
  }, [params?.id]);

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
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button variant="outline" className="gap-2">
          <Code className="h-4 w-4" /> Embed
        </Button>
      </div>

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
