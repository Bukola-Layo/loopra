"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

export function RichTextToolbar() {
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
  }

  return (
    <div className="flex items-center gap-0.5 px-1 py-1 rounded-md bg-white border shadow-sm">
      <ToolbarButton
        icon={<Bold className="h-3.5 w-3.5" />}
        label="Bold"
        command="bold"
        onClick={() => exec("bold")}
      />
      <ToolbarButton
        icon={<Italic className="h-3.5 w-3.5" />}
        label="Italic"
        command="italic"
        onClick={() => exec("italic")}
      />
      <ToolbarButton
        icon={<Underline className="h-3.5 w-3.5" />}
        label="Underline"
        command="underline"
        onClick={() => exec("underline")}
      />
      <div className="w-px h-4 bg-border mx-0.5" />
      <ToolbarButton
        icon={<List className="h-3.5 w-3.5" />}
        label="Bullet List"
        command="insertUnorderedList"
        onClick={() => exec("insertUnorderedList")}
      />
      <ToolbarButton
        icon={<ListOrdered className="h-3.5 w-3.5" />}
        label="Numbered List"
        command="insertOrderedList"
        onClick={() => exec("insertOrderedList")}
      />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  command,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  command: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function toggle() {
      if (!ref.current) return;
      const active = document.queryCommandState(command);
      ref.current.dataset.active = active ? "true" : "false";
    }

    document.addEventListener("selectionchange", toggle);
    return () => document.removeEventListener("selectionchange", toggle);
  }, [command]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
        "data-[active=true]:bg-muted data-[active=true]:text-foreground"
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
