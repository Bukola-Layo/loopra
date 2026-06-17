"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type Props = {
  onInsertContent: (content: string) => void;
  onInsertSubject: (subject: string) => void;
  currentContent: string;
};

export function AiPanel({
  onInsertContent,
  onInsertSubject,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"content" | "subject">("content");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: mode,
          context: mode === "content" ? "email" : "subject_line",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (mode === "content") {
        onInsertContent(data.content);
      } else {
        onInsertSubject(data.subject);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-muted rounded-md p-0.5">
        <button
          type="button"
          onClick={() => setMode("content")}
          className={`px-2 py-1 text-xs rounded ${
            mode === "content" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
          }`}
        >
          Content
        </button>
        <button
          type="button"
          onClick={() => setMode("subject")}
          className={`px-2 py-1 text-xs rounded ${
            mode === "subject" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
          }`}
        >
          Subject
        </button>
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={mode === "content" ? "Write email about..." : "Generate subject line..."}
        className="h-8 w-40 text-xs rounded-md border border-input bg-background px-2 py-1"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="h-8 gap-1"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? "..." : "Generate"}
      </Button>
    </div>
  );
}
