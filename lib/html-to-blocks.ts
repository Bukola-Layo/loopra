import { JSDOM } from "jsdom";
import juice from "juice";
import { type EmailBlock, type BlockType } from "./email-builder";

let counter = 0;
function uid(): string {
  counter++;
  return `blk_${String(counter).padStart(3, "0")}`;
}

function styleVal(style: string, key: string): string | null {
  const re = new RegExp(`${key}\\s*:\\s*([^;]+)`);
  const m = style.match(re);
  return m ? m[1].trim() : null;
}

function elStyle(el: Element): string {
  return el.getAttribute("style") ?? "";
}

function fontSizeFromTag(tag: string): string {
  const map: Record<string, string> = {
    h1: "32", h2: "28", h3: "24",
    h4: "20", h5: "16", h6: "14",
  };
  return map[tag.toLowerCase()] ?? "16";
}

function hasButtonStyling(el: Element): boolean {
  const style = elStyle(el);
  const cls = el.getAttribute("class") ?? "";
  const tag = el.tagName.toLowerCase();

  if (/\bbutton\b/i.test(cls)) return true;

  const hasBg = !!(styleVal(style, "background-color") || styleVal(style, "background"));
  const hasPad = !!(styleVal(style, "padding") || styleVal(style, "padding-top") || styleVal(style, "padding-bottom"));
  const hasRadius = !!styleVal(style, "border-radius");
  const isBlock = /display\s*:\s*(block|inline-block)/i.test(style);
  const text = (el.textContent ?? "").trim();

  if (tag === "a") {
    if (hasBg && hasPad) return true;
    if (hasBg && hasRadius) return true;
    if (hasPad && isBlock) return true;
    if (text.length > 2 && text.length < 80 && (hasBg || hasRadius)) return true;
  }

  if (tag === "td" || tag === "th") {
    const a = el.querySelector("a");
    if (!a) return false;
    const aText = (a.textContent ?? "").trim();
    if (aText.length < 3 || aText.length > 80) return false;
    // Must have background-color or border-radius to be a button cell (padding alone is a wrapper)
    return hasBg || hasRadius;
  }

  return false;
}

function isFooterText(text: string): boolean {
  const lower = text.toLowerCase();
  return /unsubscribe|privacy\s*policy|terms\s*of\s*service|all\s*rights\s*reserved|you received this/i.test(lower);
}

function alignFromStyle(style: string, el: Element): string {
  return styleVal(style, "text-align")
    || el.getAttribute("align")
    || "center";
}

function extractColor(style: string, prop: string, fallback: string): string {
  return styleVal(style, prop) ?? fallback;
}

function extractPadding(el: Element): { t: string; b: string; l: string; r: string } {
  const style = elStyle(el);
  const pad = styleVal(style, "padding");
  if (pad) {
    const parts = pad.split(/\s+/);
    if (parts.length === 1) return { t: parts[0], b: parts[0], l: parts[0], r: parts[0] };
    if (parts.length === 2) return { t: parts[0], b: parts[1], l: parts[1], r: parts[0] };
    if (parts.length === 4) return { t: parts[0], b: parts[2], l: parts[3], r: parts[1] };
  }
  const pt = styleVal(style, "padding-top") ?? "0";
  const pb = styleVal(style, "padding-bottom") ?? "0";
  const pl = styleVal(style, "padding-left") ?? "0";
  const pr = styleVal(style, "padding-right") ?? "0";
  return { t: pt, b: pb, l: pl, r: pr };
}

function isSpacerRow(td: Element): boolean {
  const html = td.innerHTML.trim();
  if (!html) return true;
  const style = elStyle(td);
  const fontSize = styleVal(style, "font-size");
  const lineHeight = styleVal(style, "line-height");
  if (fontSize && lineHeight && parseInt(fontSize) <= 1 && parseInt(lineHeight) <= 1) return true;
  if (/^\s*(&nbsp;|\s)*\s*$/.test(html) && styleVal(style, "font-size") === "1") return true;
  if (/^\s*<div[^>]*>\s*&nbsp;\s*<\/div>\s*$/.test(html)) return true;
  return false;
}

function hasOnlyHr(td: Element): boolean {
  return td.querySelector("hr") !== null
    && !td.querySelector("img, a, h1, h2, h3, h4, h5, h6, p, span")
    && (td.textContent ?? "").trim() === "";
}

function hasImg(td: Element): HTMLImageElement | null {
  return td.querySelector("img");
}

function hasHeading(td: Element): HTMLHeadingElement | null {
  return td.querySelector("h1, h2, h3, h4, h5, h6");
}

function countChars(el: Element): number {
  return (el.textContent ?? "").trim().length;
}

function firstChildTable(el: Element): Element | null {
  for (const child of Array.from(el.children)) {
    if (child.tagName === "TABLE") return child;
  }
  return null;
}

/** Check if a cell is a wrapper that only contains a single table */
function isTableWrapper(cell: Element): boolean {
  const childTables = Array.from(cell.children).filter((c) => c.tagName === "TABLE");
  if (childTables.length === 0) return false;
  // It's a wrapper if all children are tables or whitespace-only text
  const nonTableChildren = Array.from(cell.children).filter((c) => c.tagName !== "TABLE");
  for (const child of nonTableChildren) {
    if ((child.textContent ?? "").trim()) return false;
    if (child.querySelector("img, a, h1, h2, h3, h4, h5, h6, p, span, hr")) return false;
  }
  return true;
}

function findContentTable(doc: Document): Element {
  const tables = doc.querySelectorAll("table");
  let best: Element | null = null;
  let bestScore = 0;

  for (const table of tables) {
    const rows = table.querySelectorAll("tr");
    if (rows.length < 2) continue;

    let score = 0;
    for (const row of Array.from(rows)) {
      const tds = row.querySelectorAll("td, th");
      for (const td of Array.from(tds)) {
        if (isTableWrapper(td)) continue;
        const len = countChars(td);
        if (len > 20) score += 3;
        else if (len > 5) score += 2;
        else if (td.querySelector("img")) score += 2;
        else if (td.querySelector("hr")) score += 1;
        else if (len > 0) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = table;
    }
  }

  return best ?? doc.body;
}

function classifyCell(el: Element): BlockType {
  if (isSpacerRow(el)) return "spacer";
  if (hasOnlyHr(el)) return "divider";

  const img = hasImg(el);
  const heading = hasHeading(el);

  // Image with no link — short alt text → logo, otherwise image
  if (img && !heading && countChars(el) < 40) return "logo";

  // Image with link → image
  if (img) return "image";

  // Heading
  if (heading) return "header";

  // Button
  if (hasButtonStyling(el)) return "button";

  // Footer text
  if (isFooterText(el.textContent ?? "")) return "footer";

  // Has text → text
  if (countChars(el) > 0) return "text";

  return "spacer";
}

function buildBlock(el: Element, type: BlockType): EmailBlock {
  const style = elStyle(el);
  const align = alignFromStyle(style, el);
  const pad = extractPadding(el);

  switch (type) {
    case "header": {
      const h = hasHeading(el);
      const text = h ? (h.textContent ?? "").trim() : (el.textContent ?? "").trim();
      const hStyle = h ? elStyle(h) : style;
      const fontSize = styleVal(hStyle, "font-size")
        ?? (h ? fontSizeFromTag(h.tagName) : "24");
      const color = extractColor(hStyle, "color", "#111827");
      return { id: uid(), type: "header", content: { text, fontSize, color, alignment: align, padding: pad.t } };
    }

    case "text": {
      const paragraphs: string[] = [];
      const pEls = el.querySelectorAll("p");
      if (pEls.length > 0) {
        pEls.forEach((p) => {
          const txt = p.innerHTML.trim();
          if (txt) paragraphs.push(txt);
        });
      } else if (el.querySelector("a")) {
        paragraphs.push(el.innerHTML.trim());
      } else {
        const lines = (el.innerHTML ?? "").trim().split(/<br\s*\/?>/i);
        lines.forEach((l) => {
          const clean = l.replace(/<\/?[^>]+>/g, "").trim();
          if (clean) paragraphs.push(clean);
        });
      }
      const content = paragraphs.join("<br>");
      const color = extractColor(style, "color", "#374151");
      const fontSize = styleVal(style, "font-size") ?? "16";
      const lineHeight = styleVal(style, "line-height") ?? "1.6";
      return { id: uid(), type: "text", content: { text: content || (el.textContent ?? "").trim(), fontSize, color, lineHeight, padding: pad.t } };
    }

    case "image":
    case "logo": {
      const img = el.querySelector("img");
      const src = img?.getAttribute("src") ?? "";
      const alt = img?.getAttribute("alt") ?? "";
      const width = img?.getAttribute("width") ?? styleVal(elStyle(img!), "max-width") ?? "";
      const linkUrl = el.querySelector("a")?.getAttribute("href") ?? "";
      const block: EmailBlock = { id: uid(), type, content: { src, alt, width: width || "100%", alignment: align } };
      if (linkUrl) block.content.linkUrl = linkUrl;
      return block;
    }

    case "button": {
      const a = el.querySelector("a") ?? (el.tagName.toLowerCase() === "a" ? el : null);
      const aStyle = a ? elStyle(a) : style;
      const label = a?.textContent?.trim() ?? "Click here";
      const url = a?.getAttribute("href") ?? "#";
      const bgColor = extractColor(style, "background-color", "")
        || extractColor(aStyle, "background-color", "")
        || extractColor(style, "background", "")
        || "#6366f1";
      const textColor = extractColor(aStyle, "color", "#ffffff");
      const fontSize = styleVal(aStyle, "font-size") ?? "14";
      const borderRadius = styleVal(style, "border-radius")
        ?? styleVal(aStyle, "border-radius")
        ?? "6";
      return { id: uid(), type: "button", content: { text: label, url, color: textColor, bgColor, alignment: align, fontSize, borderRadius, padding: pad.t } };
    }

    case "divider": {
      const hr = el.querySelector("hr");
      const hrStyle = hr ? elStyle(hr) : "";
      const dividerColor = styleVal(hrStyle, "border-top-color")
        ?? styleVal(hrStyle, "color")
        ?? "#e5e7eb";
      return { id: uid(), type: "divider", content: { color: dividerColor, padding: pad.t } };
    }

    case "footer": {
      const text = (el.textContent ?? "").trim();
      const color = extractColor(style, "color", "#9ca3af");
      const fontSize = styleVal(style, "font-size") ?? "12";
      return { id: uid(), type: "footer", content: { text, fontSize, color, alignment: align, padding: pad.t } };
    }

    case "spacer": {
      const ht = styleVal(style, "height")
        ?? styleVal(style, "line-height")
        ?? "24";
      return { id: uid(), type: "spacer", content: { height: ht } };
    }

    default:
      return { id: uid(), type: "text", content: { text: el.textContent?.trim() ?? "", fontSize: "16", color: "#374151" } };
  }
}

function processRow(
  container: Element,
  blocks: EmailBlock[],
  footerSeen: { v: boolean }
): void {
  for (const cell of Array.from(container.children).filter((c) => c.tagName === "TD" || c.tagName === "TH")) {
    const text = (cell.textContent ?? "").trim();
    const html = cell.innerHTML.trim();

    if (!text && !html) continue;

    // Skip tracking pixel cells
    let hasTracking = false;
    for (const img of Array.from(cell.querySelectorAll("img"))) {
      const src = img.getAttribute("src") ?? "";
      const w = img.getAttribute("width");
      const h = img.getAttribute("height");
      if ((w === "1" || h === "1") && /pixel|track|beacon|spacer/i.test(src)) {
        hasTracking = true;
        break;
      }
    }
    if (hasTracking) continue;

    // If cell is a table wrapper (only contains a table), recurse into it
    if (isTableWrapper(cell)) {
      const t = firstChildTable(cell);
      if (t) {
        for (const row of Array.from(t.children).filter((c) => c.tagName === "TR")) {
          processRow(row, blocks, footerSeen);
        }
      }
      continue;
    }

    let type = classifyCell(cell);

    if (type === "footer") footerSeen.v = true;
    if (footerSeen.v && type !== "footer" && type !== "spacer" && type !== "divider") {
      type = "footer";
    }

    const block = buildBlock(cell, type);
    if (block) blocks.push(block);
  }
}

export function htmlToBlocks(rawHtml: string): EmailBlock[] {
  counter = 0;

  // Inline CSS before stripping <style> tags — preserves styling in block properties
  let inlined: string;
  try {
    inlined = juice(rawHtml, {
      removeStyleTags: true,
      preserveMediaQueries: true,
      preserveFontFaces: true,
    });
  } catch {
    inlined = rawHtml;
  }

  const html = inlined
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<!--/g, "").replace(/-->/g, "");

  const dom = new JSDOM(html);
  const contentTable = findContentTable(dom.window.document);
  const rows = contentTable.querySelectorAll("tr");
  const blocks: EmailBlock[] = [];
  const footerSeen = { v: false };

  for (const row of Array.from(rows)) {
    processRow(row, blocks, footerSeen);
  }

  // Deduplicate consecutive blocks with same type+content
  const deduped: EmailBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const prev = blocks[i - 1];

    if (b.type === "spacer" && prev?.type === "spacer") continue;

    if (prev && b.type === prev.type && b.type !== "button" && b.type !== "image") {
      if (JSON.stringify(prev.content) === JSON.stringify(b.content)) continue;
    }

    deduped.push(b);
  }

  return deduped;
}
