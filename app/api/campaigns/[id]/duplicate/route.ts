import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const duplicateCampaignSchema = z.object({
  newTitle: z.string().min(1).max(200).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = duplicateCampaignSchema.safeParse(body);

    const existing = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    const campaign = await db.campaign.create({
      data: {
        workspaceId,
        title: result.data?.newTitle ?? `${existing.title} (Copy)`,
        subject: existing.subject,
        content: existing.content,
        contentType: existing.contentType,
        status: "draft",
      },
    });

    return apiSuccess({ campaign }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
