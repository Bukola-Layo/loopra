"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

const HELP_LINKS = [
  { label: "Getting Started", href: "#" },
  { label: "How Pages Work", href: "#" },
  { label: "How Campaigns Work", href: "#" },
  { label: "How Loops Work", href: "#" },
  { label: "Video Tutorials", href: "#" },
  { label: "Contact Support", href: "#" },
];

export function FloatingHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open && (
        <div className="absolute bottom-14 left-0 w-64 rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Need Help?</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="p-2 space-y-0.5">
            {HELP_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          open
            ? "bg-primary text-primary-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
