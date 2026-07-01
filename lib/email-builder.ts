export type Alignment = "left" | "center" | "right";

export type DividerStyle = "solid" | "dashed" | "dotted";

export interface BlockStyles {
  _opacity?: string;
  _borderRadius?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

export interface HeaderContent extends BlockStyles {
  text: string;
  fontSize: string;
  alignment: Alignment;
  color: string;
  fontFamily?: string;
  fontWeight?: string;
  letterSpacing?: string;
  logoSrc: string;
  logoWidth: string;
}

export interface TextContent extends BlockStyles {
  text: string;
  fontSize: string;
  color: string;
  fontFamily?: string;
  lineHeight?: string;
  fontWeight?: string;
  letterSpacing?: string;
}

export interface ImageContent extends BlockStyles {
  src: string;
  alt: string;
  width: string;
  linkTo?: string;
}

export interface ButtonContent extends BlockStyles {
  text: string;
  url: string;
  color: string;
  bgColor: string;
  alignment: Alignment;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
}

export interface DividerContent extends BlockStyles {
  color: string;
  width?: string;
  style?: DividerStyle;
}

export interface FooterContent extends BlockStyles {
  text: string;
  fontSize: string;
  color: string;
  fontFamily?: string;
}

export interface SpacerContent extends BlockStyles {
  height: string;
}

export interface LogoContent extends BlockStyles {
  src: string;
  alt: string;
  width: string;
  alignment: Alignment;
  padding: string;
}

export interface LinkContent extends BlockStyles {
  text: string;
  url: string;
  fontSize: string;
  color: string;
  alignment: Alignment;
  fontFamily?: string;
  fontWeight?: string;
}

export interface SocialContent extends BlockStyles {
  alignment: Alignment;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  iconStyle?: "text" | "icon";
}

export interface RawContent extends BlockStyles {
  html: string;
}

export interface BlockContentMap {
  header: HeaderContent;
  text: TextContent;
  image: ImageContent;
  button: ButtonContent;
  divider: DividerContent;
  footer: FooterContent;
  spacer: SpacerContent;
  logo: LogoContent;
  link: LinkContent;
  social: SocialContent;
  raw: RawContent;
}

export type BlockType = keyof BlockContentMap;

export type EmailBlock = {
  [K in BlockType]: { id: string; type: K; content: BlockContentMap[K] };
}[BlockType];

export interface SectionStyles {
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
}

export interface Column {
  id: string;
  width: number;
  blocks: EmailBlock[];
}

export interface Section {
  id: string;
  columns: Column[];
  styles?: SectionStyles;
}

export function createColumn(width: number, blocks?: EmailBlock[]): Column {
  return { id: crypto.randomUUID(), width, blocks: blocks ?? [] };
}

export function createSection(columns?: Column[], styles?: SectionStyles): Section {
  return { id: crypto.randomUUID(), columns: columns ?? [createColumn(100)], styles };
}

export function flattenBlocks(sections: Section[]): EmailBlock[] {
  return sections.flatMap((s) => s.columns.flatMap((c) => c.blocks));
}

export function flattenSections(sections: Section[]): Section[] {
  return sections;
}

export function wrapInSections(blocks: EmailBlock[]): Section[] {
  if (blocks.length === 0) return [];
  return [createSection([createColumn(100, blocks)])];
}

export function sectionsToHtml(sections: Section[]): string {
  const sectionHtml = sections.map(renderSection).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @@media only screen and (max-width: 480px) {
      .loopra-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  ${sectionHtml}
</body>
</html>`;
}

function renderSection(section: Section): string {
  const bg = section.styles?.backgroundColor ?? "transparent";
  const pad = section.styles?.padding ?? "24px 16px";
  const br = section.styles?.borderRadius ?? "0";

  const cols = section.columns.map(renderColumn).join("\n");

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:${bg};">
    <tr>
      <td align="center" style="padding:${pad};">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:${br};overflow:hidden;">
          <tr>
            ${cols}
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderColumn(col: Column): string {
  const blocksHtml = col.blocks.map(renderBlock).join("\n");
  return `<td class="loopra-col" style="width:${col.width}%;vertical-align:top;display:inline-block;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
      ${blocksHtml}
    </table>
  </td>`;
}

export function createBlock(type: BlockType): EmailBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "header":
      return { id, type, content: { text: "Your Logo", fontSize: "24", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" } } as EmailBlock;
    case "text":
      return { id, type, content: { text: "Enter your text here...", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" } } as EmailBlock;
    case "image":
      return { id, type, content: { src: "/placeholder.svg", alt: "Image", width: "100%", linkTo: "" } } as EmailBlock;
    case "button":
      return { id, type, content: { text: "Click here", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" } } as EmailBlock;
    case "divider":
      return { id, type, content: { color: "#e5e7eb", width: "100", style: "solid" } } as EmailBlock;
    case "footer":
      return { id, type, content: { text: "© 2026 Your Company. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" } } as EmailBlock;
    case "spacer":
      return { id, type, content: { height: "24" } } as EmailBlock;
    case "logo":
      return { id, type, content: { src: "", alt: "Logo", width: "200", alignment: "center", padding: "24" } } as EmailBlock;
    case "link":
      return { id, type, content: { text: "Click here", url: "https://example.com", fontSize: "14", color: "#6366f1", alignment: "center", fontFamily: "", fontWeight: "" } } as EmailBlock;
    case "social":
      return { id, type, content: { alignment: "center", facebook: "", twitter: "", instagram: "", linkedin: "", youtube: "", iconStyle: "text" } } as EmailBlock;
    case "raw":
      return { id, type, content: { html: "" } } as EmailBlock;
  }
}

function blockPadding(block: EmailBlock): string {
  const c = block.content as unknown as Record<string, string>;
  const t = c.paddingTop ?? "";
  const r = c.paddingRight ?? "";
  const b = c.paddingBottom ?? "";
  const l = c.paddingLeft ?? "";
  if (t && r && b && l) return `${t}px ${r}px ${b}px ${l}px`;
  if (t) return `${t}px 32px`;
  return "8px 32px";
}

function blockStyleAttr(block: EmailBlock): string {
  const styles: string[] = [];
  const c = block.content as unknown as Record<string, string>;
  if (c._borderRadius && c._borderRadius !== "0") styles.push(`border-radius:${c._borderRadius}px`);
  if (c._opacity && c._opacity !== "100") styles.push(`opacity:${Number(c._opacity) / 100}`);
  return styles.length ? ` style="${styles.join(";")}"` : "";
}

const FONT_FAMILY = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

function fontFamily(val: string | undefined): string {
  return val && val.trim() ? val : FONT_FAMILY;
}

export function blocksToRows(blocks: EmailBlock[]): string {
  return blocks.map(renderBlock).join("\n");
}

export function blocksToBodyHtml(blocks: EmailBlock[]): string {
  const rows = blocksToRows(blocks);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`;
}

export function blocksToHtml(blocks: EmailBlock[]): string {
  const body = blocks.map(renderBlock).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderBlock(block: EmailBlock): string {
  const c = block.content as unknown as Record<string, string>;
  const pad = blockPadding(block);
  const extra = blockStyleAttr(block);
  const ff = fontFamily(c.fontFamily);

  switch (block.type) {
    case "header":
      if (c.logoSrc) {
        return `<tr><td style="padding:${pad};text-align:${c.alignment ?? "center"};"${extra}>
          <img src="${escapeAttr(c.logoSrc)}" alt="${escapeAttr(c.text ?? "Logo")}" style="max-width:${c.logoWidth ?? "200"}px;height:auto;display:inline-block;" />
        </td></tr>`;
      }
      return `<tr><td style="padding:${pad};text-align:${c.alignment ?? "center"};"${extra}>
        <span style="font-size:${c.fontSize ?? "24"}px;color:${c.color ?? "#111827"};font-weight:${c.fontWeight ?? "700"};${c.letterSpacing ? `letter-spacing:${c.letterSpacing}px;` : ""}font-family:${ff};">${escapeHtml(c.text ?? "Your Logo")}</span>
      </td></tr>`;

    case "text":
      return `<tr><td style="padding:${pad};font-size:${c.fontSize ?? "16"}px;color:${c.color ?? "#374151"};line-height:${c.lineHeight ?? "1.6"};${c.fontWeight ? `font-weight:${c.fontWeight};` : ""}${c.letterSpacing ? `letter-spacing:${c.letterSpacing}px;` : ""}font-family:${ff};"${extra}>
        ${escapeHtml(c.text ?? "")}
      </td></tr>`;

    case "image": {
      const img = `<img src="${escapeAttr(c.src ?? "")}" alt="${escapeAttr(c.alt ?? "")}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`;
      const wrapped = c.linkTo ? `<a href="${escapeAttr(c.linkTo)}" target="_blank">${img}</a>` : img;
      return `<tr><td style="padding:${pad};text-align:center;"${extra}>
        ${wrapped}
      </td></tr>`;
    }

    case "button": {
      const br = c.borderRadius && c.borderRadius !== "0" ? `border-radius:${c.borderRadius}px;` : "border-radius:6px;";
      const border = c.borderColor ? `border:${c.borderWidth || "1"}px solid ${c.borderColor};` : "";
      return `<tr><td style="padding:${pad};text-align:${c.alignment ?? "center"};"${extra}>
        <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
          <tr>
            <td style="${br}background-color:${c.bgColor ?? "#6366f1"};padding:12px 24px;text-align:center;${border}">
              <a href="${escapeAttr(c.url ?? "#")}" style="color:${c.color ?? "#ffffff"};font-size:${c.fontSize ?? "14"}px;font-weight:${c.fontWeight ?? "600"};text-decoration:none;font-family:${ff};">${escapeHtml(c.text ?? "Click here")}</a>
            </td>
          </tr>
        </table>
      </td></tr>`;
    }

    case "divider": {
      const w = c.width && c.width !== "100" ? `${c.width}%` : "100%";
      const dividerStyle = c.style ?? "solid";
      return `<tr><td style="padding:${pad};"${extra}>
        <hr style="border:none;border-top:1px ${dividerStyle} ${c.color ?? "#e5e7eb"};margin:0;width:${w};" />
      </td></tr>`;
    }

    case "footer":
      return `<tr><td style="padding:${pad};text-align:center;font-size:${c.fontSize ?? "12"}px;color:${c.color ?? "#9ca3af"};font-family:${ff};"${extra}>
        ${escapeHtml(c.text ?? "")}
      </td></tr>`;

    case "spacer":
      return `<tr><td style="padding:0;font-size:${c.height ?? "24"}px;line-height:${c.height ?? "24"}px;"${extra}>&nbsp;</td></tr>`;

    case "logo":
      return `<tr><td style="padding:${c.padding ?? "24"}px 32px;text-align:${c.alignment ?? "center"};"${extra}>
        ${c.src ? `<img src="${escapeAttr(c.src)}" alt="${escapeAttr(c.alt ?? "Logo")}" style="max-width:${c.width ?? "200"}px;height:auto;display:inline-block;" />` : `<span style="font-size:20px;color:#9ca3af;font-family:${ff};">[Logo]</span>`}
      </td></tr>`;

    case "link":
      return `<tr><td style="padding:${pad};text-align:${c.alignment ?? "center"};"${extra}>
        <a href="${escapeAttr(c.url ?? "#")}" style="font-size:${c.fontSize ?? "14"}px;color:${c.color ?? "#6366f1"};font-weight:${c.fontWeight ?? "400"};text-decoration:underline;font-family:${ff};">${escapeHtml(c.text ?? "Click here")}</a>
      </td></tr>`;

    case "social": {
      const platforms = ["facebook", "twitter", "instagram", "linkedin", "youtube"] as const;
      const links = platforms
        .filter((k) => c[k])
        .map((k) => `<a href="${escapeAttr(c[k])}" style="color:#6b7280;text-decoration:none;font-size:14px;margin:0 8px;font-family:${ff};">${k.charAt(0).toUpperCase() + k.slice(1)}</a>`)
        .join("");
      return `<tr><td style="padding:${pad};text-align:${c.alignment ?? "center"};"${extra}>
        ${links || '<span style="font-size:12px;color:#9ca3af;">Add social media links</span>'}
      </td></tr>`;
    }

    case "raw":
      return `<tr><td style="padding:0;"${extra}>
        ${c.html ?? ""}
      </td></tr>`;

    default:
      return "";
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function tpl<T extends BlockType>(type: T, content: BlockContentMap[T]): EmailBlock {
  return { id: crypto.randomUUID(), type, content } as unknown as EmailBlock;
}

export const BUILT_IN_TEMPLATES: Array<{ name: string; category: string; blocks: EmailBlock[] }> = [
  {
    name: "Welcome Email",
    category: "Onboarding",
    blocks: [
      createBlock("spacer"),
      tpl("header", { text: "Welcome!", fontSize: "32", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      tpl("spacer", { height: "16" }),
      tpl("text", { text: "Hi there,\n\nThanks for joining! We're excited to have you on board. Here's what you can expect from us.", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      tpl("button", { text: "Get Started", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      tpl("divider", { color: "#e5e7eb", width: "100", style: "solid" }),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
  {
    name: "Newsletter",
    category: "Newsletter",
    blocks: [
      tpl("header", { text: "Monthly Newsletter", fontSize: "28", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      tpl("divider", { color: "#e5e7eb", width: "100", style: "solid" }),
      tpl("text", { text: "Here's what's new this month...", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      tpl("button", { text: "Read More", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      tpl("divider", { color: "#e5e7eb", width: "100", style: "solid" }),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
  {
    name: "Promotional",
    category: "Marketing",
    blocks: [
      tpl("header", { text: "Special Offer!", fontSize: "30", alignment: "center", color: "#dc2626", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      tpl("spacer", { height: "24" }),
      tpl("text", { text: "Limited time offer! Get 20% off your next purchase.", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      createBlock("divider"),
      tpl("button", { text: "Shop Now", url: "https://example.com", color: "#ffffff", bgColor: "#dc2626", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      createBlock("spacer"),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
  {
    name: "Product Update",
    category: "Product",
    blocks: [
      tpl("header", { text: "What's New", fontSize: "28", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      createBlock("spacer"),
      tpl("text", { text: "We've shipped some exciting updates this week:", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      tpl("text", { text: "• New dashboard\n• Improved performance\n• Bug fixes", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      tpl("button", { text: "Explore", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      createBlock("divider"),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
  {
    name: "Re-engagement",
    category: "Marketing",
    blocks: [
      tpl("header", { text: "We Miss You!", fontSize: "28", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      createBlock("spacer"),
      tpl("text", { text: "It's been a while! Here's a special offer to welcome you back.", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      createBlock("divider"),
      tpl("button", { text: "Come Back", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      createBlock("spacer"),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
  {
    name: "Thank You",
    category: "Transactional",
    blocks: [
      tpl("header", { text: "Thank You!", fontSize: "28", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200", fontFamily: "", fontWeight: "700", letterSpacing: "" }),
      createBlock("spacer"),
      tpl("text", { text: "Thank you for your purchase! Your order has been confirmed.", fontSize: "16", color: "#374151", fontFamily: "", lineHeight: "1.6", fontWeight: "", letterSpacing: "" }),
      createBlock("divider"),
      tpl("button", { text: "View Order", url: "https://example.com", color: "#ffffff", bgColor: "#059669", alignment: "center", fontFamily: "", fontSize: "14", fontWeight: "600", borderRadius: "6", borderColor: "", borderWidth: "" }),
      createBlock("spacer"),
      tpl("footer", { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af", fontFamily: "" }),
    ],
  },
];

export function serializeSections(sections: Section[]): string {
  const cleaned = sections.map((s) => ({
    ...s,
    columns: s.columns.map((c) => ({
      ...c,
      blocks: c.blocks.map((b) => ({
        id: b.id,
        type: b.type,
        content: b.content as unknown as Record<string, string>,
      })),
    })),
  }));
  return JSON.stringify({ v: 2, sections: cleaned });
}

export function serializeBlocks(blocks: EmailBlock[]): string {
  return JSON.stringify({ v: 1, blocks });
}

export function deserializeBlocks(json: string): EmailBlock[] | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.v === 1 && Array.isArray(parsed.blocks)) {
      return parsed.blocks;
    }
    if (parsed && parsed.v === 2 && Array.isArray(parsed.sections)) {
      return flattenBlocks(parsed.sections);
    }
    return null;
  } catch {
    return null;
  }
}

export function deserializeSections(json: string): Section[] | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.v === 2 && Array.isArray(parsed.sections)) {
      return parsed.sections;
    }
    if (parsed && parsed.v === 1 && Array.isArray(parsed.blocks)) {
      return wrapInSections(parsed.blocks);
    }
    return null;
  } catch {
    return null;
  }
}

export function anyToHtml(content: string | null | undefined): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.v === 2 && Array.isArray(parsed.sections)) {
      return sectionsToHtml(parsed.sections);
    }
    if (parsed && parsed.v === 1 && Array.isArray(parsed.blocks)) {
      return blocksToHtml(parsed.blocks);
    }
    return content;
  } catch {
    return content;
  }
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  header: "Header",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  footer: "Footer",
  spacer: "Spacer",
  logo: "Logo",
  link: "Link",
  social: "Social Media",
  raw: "Raw HTML",
};
