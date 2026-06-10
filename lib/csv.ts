export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(field.trim());
        field = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        current.push(field.trim());
        if (current.some((f) => f.length > 0)) {
          rows.push(current);
        }
        current = [];
        field = "";
        if (char === "\r") i++;
      } else if (char === "\r") {
        current.push(field.trim());
        if (current.some((f) => f.length > 0)) {
          rows.push(current);
        }
        current = [];
        field = "";
      } else {
        field += char;
      }
    }
  }

  if (field.trim() || current.length > 0) {
    current.push(field.trim());
    if (current.some((f) => f.length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

export type CSVPreview = {
  headers: string[];
  rows: string[][];
};

export function previewCSV(text: string, maxRows = 5): CSVPreview {
  const all = parseCSV(text);
  if (all.length === 0) return { headers: [], rows: [] };
  const headers = all[0];
  const rows = all.slice(1, maxRows + 1);
  return { headers, rows };
}

export type FieldMapping = {
  email: string;
  firstName: string;
  lastName: string;
};

export function mapCSVToSubscribers(
  rows: string[][],
  headers: string[],
  mapping: FieldMapping
): { email: string; firstName?: string; lastName?: string }[] {
  const emailIdx = headers.indexOf(mapping.email);
  const firstNameIdx = mapping.firstName ? headers.indexOf(mapping.firstName) : -1;
  const lastNameIdx = mapping.lastName ? headers.indexOf(mapping.lastName) : -1;

  if (emailIdx < 0) return [];

  return rows.map((row) => ({
    email: row[emailIdx]?.trim(),
    firstName: firstNameIdx >= 0 ? row[firstNameIdx]?.trim() : undefined,
    lastName: lastNameIdx >= 0 ? row[lastNameIdx]?.trim() : undefined,
  })).filter((s) => s.email);
}
