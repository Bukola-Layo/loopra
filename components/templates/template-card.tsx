"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Trash2, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { anyToHtml } from "@/lib/email-builder";

export type TemplateCardTemplate = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  industry?: string | null;
  source?: string;
  thumbnail?: string | null;
  html?: string | null;
  createdAt?: string;
};

type Props = {
  template: TemplateCardTemplate;
  isUserTemplate?: boolean;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function EmailThumbnail({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (ref.current) {
      const w = ref.current.offsetWidth;
      setScale(Math.min(1, w / 600));
    }
  }, []);

  const previewHtml = anyToHtml(html);

  return (
    <div ref={ref} className="w-full h-full overflow-hidden relative">
      {previewHtml ? (
        <iframe
          srcDoc={previewHtml}
          className="absolute top-0 left-0 border-0 origin-top-left"
          style={{
            width: "600px",
            height: "800px",
            transform: `scale(${scale})`,
          }}
          title="Email preview"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

export function TemplateCard({
  template,
  isUserTemplate,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <Card className="group overflow-hidden">
      <Link href={`/dashboard/templates/${template.id}/edit`}>
        <div className="aspect-[4/3] bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
          {template.html ? (
            <EmailThumbnail html={template.html} />
          ) : template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="space-y-1">
          <Link href={`/dashboard/templates/${template.id}/edit`}>
            <h3 className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer">{template.name}</h3>
          </Link>
          <div className="flex flex-wrap gap-1">
            {template.category && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {template.category}
              </span>
            )}
            {template.source && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                {template.source}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {isUserTemplate ? (
            <>
              <Link
                href={`/dashboard/templates/${template.id}/edit`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <LayoutTemplate className="h-3 w-3 mr-1" /> Edit
                </Button>
              </Link>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(template.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <>
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDuplicate(template.id)}
                >
                  <Copy className="h-3 w-3 mr-1" /> Use
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
