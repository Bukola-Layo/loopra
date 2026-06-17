"use client";

type Props = {
  html: string;
};

export function TemplatePreview({ html }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-xs text-muted-foreground ml-2">Preview</span>
      </div>
      <iframe
        srcDoc={html}
        className="w-full border-0"
        style={{ height: "70vh", maxHeight: "600px" }}
        title="Template preview"
      />
    </div>
  );
}
