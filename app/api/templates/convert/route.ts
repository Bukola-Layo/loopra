import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { htmlToBlocks } from "@/lib/html-to-blocks";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const { html, templateId } = await req.json();

    if (!html) {
      return apiError("html is required", 422);
    }

    const blocks = htmlToBlocks(html);

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
