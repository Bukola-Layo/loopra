"use client";

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
  options: string[];
};

type FormPreviewProps = {
  name: string;
  description: string;
  buttonText: string;
  fields: Field[];
};

export function FormPreview({ name, description, buttonText, fields }: FormPreviewProps) {
  const sorted = [...fields]
    .filter((f) => f.label.trim())
    .sort((a, b) => a.position - b.position);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Browser chrome mock */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-gray-50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border text-xs text-muted-foreground max-w-[60%]">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span className="truncate">yoursite.com</span>
          </div>
        </div>
      </div>

      {/* Page content mock */}
      <div className="p-6">
        <div className="max-w-sm mx-auto">
          {/* Header text mock */}
          <div className="mb-5 text-center">
            <div className="w-20 h-2 bg-gray-200 rounded mx-auto mb-3" />
            <div className="w-32 h-2 bg-gray-100 rounded mx-auto" />
          </div>

          {/* Form card */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            {name && (
              <h3 className="text-base font-semibold mb-1">{name}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
            )}

            {sorted.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Add fields to see a live preview
              </p>
            ) : (
              <div className="space-y-3.5">
                {sorted.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium mb-1.5">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        readOnly
                        placeholder={field.label}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none"
                      />
                    ) : field.type === "select" ? (
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none">
                        <option value="" disabled selected className="text-muted-foreground">
                          Select...
                        </option>
                        {field.options.filter((o) => o.trim()).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : "text"}
                        readOnly
                        placeholder={field.label}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="w-full h-10 rounded-md bg-[#dd2d4a] text-white text-sm font-medium hover:bg-[#dd2d4a]/90 transition-colors cursor-default mt-2"
                >
                  {buttonText || "Subscribe"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
