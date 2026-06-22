import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const generateBlocksSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert email designer. Generate an email as an array of block objects in JSON format.

Each block has:
- "type": one of "header", "text", "image", "button", "divider", "footer", "spacer", "logo", "link", "social"
- "content": an object with string key-value pairs for the block's properties

Block properties:
- header: text (fallback text), fontSize (px), alignment (left/center/right), color (hex), logoSrc (optional), logoWidth (px, optional)
- text: text (content), fontSize (px), color (hex)
- image: src (URL), alt (text), width (e.g. "100%")
- button: text (label), url (link), color (text hex), bgColor (background hex), alignment (left/center/right)
- divider: color (hex)
- footer: text (content), fontSize (px), color (hex)
- spacer: height (px)
- logo: src (URL), alt (text), width (px), alignment (left/center/right), padding (px)
- link: text (label), url (URL), fontSize (px), color (hex), alignment (left/center/right)
- social: alignment (left/center/right), facebook (URL), twitter (URL), instagram (URL), linkedin (URL), youtube (URL)

Design rules:
- Use professional colors: primary #dd2d4a (Loopra red), accent #2cadc0 (teal), backgrounds #fafafa
- Ensure good spacing between sections
- Header at top, footer at bottom
- Use divider sparingly
- Make the email feel complete and ready to send
- Return ONLY valid JSON array, no markdown or explanation

Example:
[
  { "type": "header", "content": { "text": "Welcome!", "fontSize": "28", "alignment": "center", "color": "#dd2d4a" } },
  { "type": "spacer", "content": { "height": "16" } },
  { "type": "text", "content": { "text": "Hello there,\\n\\nThanks for joining us!", "fontSize": "16", "color": "#374151" } },
  { "type": "button", "content": { "text": "Get Started", "url": "https://example.com", "color": "#ffffff", "bgColor": "#dd2d4a", "alignment": "center" } },
  { "type": "divider", "content": { "color": "#e5e7eb" } },
  { "type": "footer", "content": { "text": "© 2026 Loopra. All rights reserved.", "fontSize": "12", "color": "#9ca3af" } }
]`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json();
    const result = generateBlocksSchema.safeParse(body);
    if (!result.success) return apiError("Validation failed", 422);

    const { prompt } = result.data;

    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate an email for: ${prompt}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "[]";

    // Parse the JSON response, cleaning markdown fences if present
    const jsonStr = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let blocks: unknown;
    try {
      blocks = JSON.parse(jsonStr);
    } catch {
      return apiError("AI returned invalid JSON");
    }

    if (!Array.isArray(blocks)) {
      return apiError("AI response is not an array");
    }

    // Assign IDs and validate structure
    const validated = blocks.map((b: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      type: typeof b.type === "string" ? b.type : "text",
      content: typeof b.content === "object" && b.content !== null ? b.content : {},
    }));

    return apiSuccess({ blocks: validated });
  } catch (error) {
    return handleApiError(error);
  }
}
