import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

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

    const where: Prisma.SubscriberWhereInput = {
      workspaceId,
      status: "active",
    };
    if (result.data.segmentIds?.length) {
      where.segmentMembers = {
        some: { segmentId: { in: result.data.segmentIds } },
      };
    }
    if (result.data.subscriberIds?.length) {
      where.id = { in: result.data.subscriberIds };
    }

    const subscribers = await db.subscriber.findMany({
      where,
      select: { id: true },
    });

    await db.campaign.update({
      where: { id: params.id },
      data: {
        status: "sending",
        recipientCount: subscribers.length,
        sentAt: new Date(),
      },
    });

    return apiSuccess({
      sent: subscribers.length,
      queued: subscribers.length,
      message: "Campaign queued for sending",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
