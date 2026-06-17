export type BlockType =
  | "header"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "footer"
  | "spacer"
  | "logo"
  | "link"
  | "social";

export type EmailBlock = {
  id: string;
  type: BlockType;
  content: Record<string, string>;
};

export function createBlock(type: BlockType): EmailBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "header":
      return { id, type, content: { text: "Your Logo", fontSize: "24", alignment: "center", color: "#111827", logoSrc: "", logoWidth: "200" } };
    case "text":
      return { id, type, content: { text: "Enter your text here...", fontSize: "16", color: "#374151" } };
    case "image":
      return { id, type, content: { src: "/placeholder.svg", alt: "Image", width: "100%" } };
    case "button":
      return { id, type, content: { text: "Click here", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center" } };
    case "divider":
      return { id, type, content: { color: "#e5e7eb" } };
    case "footer":
      return { id, type, content: { text: "© 2026 Your Company. All rights reserved.", fontSize: "12", color: "#9ca3af" } };
    case "spacer":
      return { id, type, content: { height: "24" } };
    case "logo":
      return { id, type, content: { src: "", alt: "Logo", width: "200", alignment: "center", padding: "24" } };
    case "link":
      return { id, type, content: { text: "Click here", url: "https://example.com", fontSize: "14", color: "#6366f1", alignment: "center" } };
    case "social":
      return { id, type, content: { alignment: "center", facebook: "", twitter: "", instagram: "", linkedin: "", youtube: "" } };
  }
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
  const c = block.content;
  switch (block.type) {
    case "header":
      if (c.logoSrc) {
        return `<tr><td style="padding:24px 32px 16px;text-align:${c.alignment ?? "center"};">
          <img src="${escapeAttr(c.logoSrc)}" alt="${escapeAttr(c.text ?? "Logo")}" style="max-width:${c.logoWidth ?? "200"}px;height:auto;display:inline-block;" />
        </td></tr>`;
      }
      return `<tr><td style="padding:24px 32px 16px;text-align:${c.alignment ?? "center"};">
        <span style="font-size:${c.fontSize ?? "24"}px;color:${c.color ?? "#111827"};font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(c.text ?? "Your Logo")}</span>
      </td></tr>`;

    case "text":
      return `<tr><td style="padding:8px 32px;font-size:${c.fontSize ?? "16"}px;color:${c.color ?? "#374151"};line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${escapeHtml(c.text ?? "")}
      </td></tr>`;

    case "image":
      return `<tr><td style="padding:8px 32px;text-align:center;">
        <img src="${escapeAttr(c.src ?? "")}" alt="${escapeAttr(c.alt ?? "")}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />
      </td></tr>`;

    case "button":
      return `<tr><td style="padding:16px 32px;text-align:${c.alignment ?? "center"};">
        <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
          <tr>
            <td style="border-radius:6px;background-color:${c.bgColor ?? "#6366f1"};padding:12px 24px;text-align:center;">
              <a href="${escapeAttr(c.url ?? "#")}" style="color:${c.color ?? "#ffffff"};font-size:14px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(c.text ?? "Click here")}</a>
            </td>
          </tr>
        </table>
      </td></tr>`;

    case "divider":
      return `<tr><td style="padding:16px 32px;">
        <hr style="border:none;border-top:1px solid ${c.color ?? "#e5e7eb"};margin:0;" />
      </td></tr>`;

    case "footer":
      return `<tr><td style="padding:16px 32px 24px;text-align:center;font-size:${c.fontSize ?? "12"}px;color:${c.color ?? "#9ca3af"};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        ${escapeHtml(c.text ?? "")}
      </td></tr>`;

    case "spacer":
      return `<tr><td style="padding:0;font-size:${c.height ?? "24"}px;line-height:${c.height ?? "24"}px;">&nbsp;</td></tr>`;

    case "logo":
      return `<tr><td style="padding:${c.padding ?? "24"}px 32px;text-align:${c.alignment ?? "center"};">
        ${c.src ? `<img src="${escapeAttr(c.src)}" alt="${escapeAttr(c.alt ?? "Logo")}" style="max-width:${c.width ?? "200"}px;height:auto;display:inline-block;" />` : `<span style="font-size:20px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">[Logo]</span>`}
      </td></tr>`;

    case "link":
      return `<tr><td style="padding:8px 32px;text-align:${c.alignment ?? "center"};">
        <a href="${escapeAttr(c.url ?? "#")}" style="font-size:${c.fontSize ?? "14"}px;color:${c.color ?? "#6366f1"};text-decoration:underline;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(c.text ?? "Click here")}</a>
      </td></tr>`;

    case "social": {
      const links = ["facebook", "twitter", "instagram", "linkedin", "youtube"]
        .filter((k) => c[k])
        .map((k) => `<a href="${escapeAttr(c[k])}" style="color:#6b7280;text-decoration:none;font-size:14px;margin:0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${k.charAt(0).toUpperCase() + k.slice(1)}</a>`)
        .join("");
      return `<tr><td style="padding:16px 32px;text-align:${c.alignment ?? "center"};">
        ${links || '<span style="font-size:12px;color:#9ca3af;">Add social media links</span>'}
      </td></tr>`;
    }

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

export const BUILT_IN_TEMPLATES: Array<{ name: string; category: string; blocks: EmailBlock[] }> = [
  {
    name: "Welcome Email",
    category: "Onboarding",
    blocks: [
      createBlock("spacer"),
      { ...createBlock("header"), content: { text: "Welcome!", fontSize: "32", alignment: "center", color: "#111827" } },
      { ...createBlock("spacer"), content: { height: "16" } },
      { ...createBlock("text"), content: { text: "Hi there,\n\nThanks for joining! We're excited to have you on board. Here's what you can expect from us.", fontSize: "16", color: "#374151" } },
      { ...createBlock("button"), content: { text: "Get Started", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center" } },
      { ...createBlock("divider") },
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
  {
    name: "Newsletter",
    category: "Newsletter",
    blocks: [
      { ...createBlock("header"), content: { text: "Monthly Newsletter", fontSize: "28", alignment: "center", color: "#111827" } },
      { ...createBlock("divider") },
      { ...createBlock("text"), content: { text: "Here's what's new this month...", fontSize: "16", color: "#374151" } },
      { ...createBlock("button"), content: { text: "Read More", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center" } },
      { ...createBlock("divider") },
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
  {
    name: "Promotional",
    category: "Marketing",
    blocks: [
      { ...createBlock("header"), content: { text: "Special Offer!", fontSize: "30", alignment: "center", color: "#dc2626" } },
      { ...createBlock("spacer") },
      { ...createBlock("text"), content: { text: "Limited time offer! Get 20% off your next purchase.", fontSize: "16", color: "#374151" } },
      createBlock("divider"),
      { ...createBlock("button"), content: { text: "Shop Now", url: "https://example.com", color: "#ffffff", bgColor: "#dc2626", alignment: "center" } },
      createBlock("spacer"),
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
  {
    name: "Product Update",
    category: "Product",
    blocks: [
      { ...createBlock("header"), content: { text: "What's New", fontSize: "28", alignment: "center", color: "#111827" } },
      createBlock("spacer"),
      { ...createBlock("text"), content: { text: "We've shipped some exciting updates this week:", fontSize: "16", color: "#374151" } },
      { ...createBlock("text"), content: { text: "• New dashboard\n• Improved performance\n• Bug fixes", fontSize: "16", color: "#374151" } },
      { ...createBlock("button"), content: { text: "Explore", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center" } },
      createBlock("divider"),
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
  {
    name: "Re-engagement",
    category: "Marketing",
    blocks: [
      { ...createBlock("header"), content: { text: "We Miss You!", fontSize: "28", alignment: "center", color: "#111827" } },
      createBlock("spacer"),
      { ...createBlock("text"), content: { text: "It's been a while! Here's a special offer to welcome you back.", fontSize: "16", color: "#374151" } },
      createBlock("divider"),
      { ...createBlock("button"), content: { text: "Come Back", url: "https://example.com", color: "#ffffff", bgColor: "#6366f1", alignment: "center" } },
      createBlock("spacer"),
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
  {
    name: "Thank You",
    category: "Transactional",
    blocks: [
      { ...createBlock("header"), content: { text: "Thank You!", fontSize: "28", alignment: "center", color: "#111827" } },
      createBlock("spacer"),
      { ...createBlock("text"), content: { text: "Thank you for your purchase! Your order has been confirmed.", fontSize: "16", color: "#374151" } },
      createBlock("divider"),
      { ...createBlock("button"), content: { text: "View Order", url: "https://example.com", color: "#ffffff", bgColor: "#059669", alignment: "center" } },
      createBlock("spacer"),
      { ...createBlock("footer"), content: { text: "© 2026 Loopra. All rights reserved.", fontSize: "12", color: "#9ca3af" } },
    ],
  },
];

export function serializeBlocks(blocks: EmailBlock[]): string {
  return JSON.stringify({ v: 1, blocks });
}

export function deserializeBlocks(json: string): EmailBlock[] | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.v === 1 && Array.isArray(parsed.blocks)) {
      return parsed.blocks;
    }
    return null;
  } catch {
    return null;
  }
}

export function anyToHtml(content: string | null | undefined): string {
  if (!content) return "";
  const blocks = deserializeBlocks(content);
  if (blocks) return blocksToHtml(blocks);
  return content;
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
};
