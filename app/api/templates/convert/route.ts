import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

type EmailBlock = {
  id: string;
  type: "header" | "text" | "image" | "logo" | "button" | "link" | "divider" | "spacer" | "footer" | "social" | "raw";
  content: Record<string, string>;
};

const AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

function generateId(prefix: string): string {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${prefix}_${suffix}`;
}

const SYSTEM_PROMPT = `You are an expert email developer working on Loopra, a block-based email editor.

Loopra's editor has these block types: header, text, image, logo, button, link, divider, spacer, footer, social.
Return a flat JSON array of blocks (no nesting).

Each block has:
{
  "id": "blk_001",
  "type": "text",
  "content": {
    "text": "Hello {{first_name}}",
    "fontSize": "16",
    "color": "#ffffff",
    "lineHeight": "1.6",
    "padding": "8"
  }
}

Block content fields by type:

header:
  text, fontSize, color, alignment, padding

text:
  text, fontSize, color, lineHeight, padding

image:
  src, alt, width, alignment, linkUrl

logo:
  src, alt, width, alignment

button:
  text, url, color, bgColor, alignment, borderRadius, padding

link:
  text, url, color, fontSize, alignment

divider:
  color, padding

spacer:
  height

footer:
  text, fontSize, color, alignment

RULES:
1. Every <h1>-<h6> becomes a header block — extract fontSize from inline styles or use defaults (h1=32, h2=28, h3=24, h4=20, h5=16, h6=14)
2. Every <p>, <li>, <td>, <span> with text becomes a text block
3. Every <img> becomes an image block (extract src, alt, width)
4. <a> tags styled as buttons get type=button; plain links get type=link
5. <hr> becomes a divider block
6. Empty rows/spacers become spacer blocks
7. The first logo or brand header becomes a header or logo block
8. Footer content (unsubscribe, address) becomes a footer block
9. Replace merge tags: [Product Name] → {{company_name}}, {{product_name}} → {{company_name}}, {{action_url}} → {{cta_url}}, {{{pm:unsubscribe}}} → {{unsubscribe_url}}, any name variable → {{first_name}}
10. Preserve inline colors — do NOT use defaults if the source HTML has explicit background/text/button colors
11. Skip <head>, <style>, HTML comments, MSO conditionals, tracking pixels

Return ONLY valid JSON array. No explanation, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { html, templateId } = await req.json();

    if (!html) {
      return apiError("html is required", 422);
    }

    const prompt = `Convert this HTML email into Loopra's block JSON format:\n\n${html}`;

    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      return apiError("AI conversion failed — no response", 502);
    }

    const raw = data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const blocks: EmailBlock[] = JSON.parse(clean);

    if (!Array.isArray(blocks)) {
      return apiError("AI conversion returned invalid format", 502);
    }

    // Ensure every block has a unique id
    const seen = new Set<string>();
    for (const block of blocks) {
      if (!block.id || seen.has(block.id)) {
        block.id = generateId("blk");
      }
      seen.add(block.id);
    }

    // Cache in DB if templateId is provided
    if (templateId) {
      const serialized = JSON.stringify({ v: 1, blocks });
      await db.emailTemplate.update({
        where: { id: templateId },
        data: { blocksJson: serialized },
      }).catch(() => {
        // Silently fail caching — non-critical
      });
    }

    return apiSuccess({ blocks });
  } catch (error) {
    return handleApiError(error);
  }
}
