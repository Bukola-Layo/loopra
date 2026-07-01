import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { htmlToBlocks } from "@/lib/html-to-blocks";
import { apiSuccess, apiError, handleApiError } from "@/types/api";
import { serializeSections, wrapInSections } from "@/lib/email-builder";

export async function POST(req: NextRequest) {
  try {
    const { html, templateId } = await req.json();

    if (!html) {
      return apiError("html is required", 422);
    }

    const blocks = htmlToBlocks(html);

    // Cache in DB if templateId is provided
    if (templateId) {
      const sections = wrapInSections(blocks);
      const serialized = serializeSections(sections);
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
