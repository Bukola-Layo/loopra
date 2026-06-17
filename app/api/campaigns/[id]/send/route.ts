import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";
import { sendCampaign } from "@/lib/email";

const sendCampaignSchema = z.object({
  segmentIds: z.array(z.string()).optional(),
  subscriberIds: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = sendCampaignSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const campaign = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    if (campaign.status !== "draft") {
      return apiError("Can only send draft campaigns", 400);
    }

    try {
      const { sent, failed } = await sendCampaign(params.id, workspaceId, {
        segmentIds: result.data.segmentIds,
        subscriberIds: result.data.subscriberIds,
      });

      return apiSuccess({
        sent,
        failed,
        message: `Campaign sent to ${sent} recipient${sent !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
      });
    } catch (error) {
      await db.campaign.update({
        where: { id: params.id },
        data: { status: "draft" },
      });
      return handleApiError(error);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
