import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/types/api";
import { flattenBlocks } from "@/lib/email-builder";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await db.emailTemplate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        industry: true,
        source: true,
        html: true,
        blocksJson: true,
        thumbnail: true,
        aiPrompt: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let blocks: unknown = null;
    if (template?.blocksJson) {
      try {
        const parsed = JSON.parse(template.blocksJson);
        if (parsed.v === 1 && Array.isArray(parsed.blocks)) {
          blocks = parsed.blocks;
        } else if (parsed.v === 2 && Array.isArray(parsed.sections)) {
          blocks = flattenBlocks(parsed.sections);
        } else {
          blocks = parsed;
        }
      } catch {
        blocks = null;
      }
    }

    return apiSuccess({
      template: template ? { ...template, blocks } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
