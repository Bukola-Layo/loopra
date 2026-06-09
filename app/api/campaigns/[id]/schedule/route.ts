import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const scheduleCampaignSchema = z.object({
  sendAt: z.string().datetime(),
  segmentIds: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = scheduleCampaignSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    if (existing.status !== "draft") {
      return apiError("Can only schedule draft campaigns", 400);
    }

    const campaign = await db.campaign.update({
      where: { id: params.id },
      data: {
        status: "scheduled",
        sendAt: new Date(result.data.sendAt),
      },
    });

    return apiSuccess({ campaign });
  } catch (error) {
    return handleApiError(error);
  }
}
