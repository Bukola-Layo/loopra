"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewTemplateAndEdit() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Template" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.template?.id) {
          router.replace(`/dashboard/templates/${data.template.id}/edit`);
        } else {
          router.replace("/dashboard/templates");
        }
      })
      .catch(() => router.replace("/dashboard/templates"));
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
