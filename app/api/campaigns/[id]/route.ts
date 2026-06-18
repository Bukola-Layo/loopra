import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "scheduled", "sending", "sent"]).optional(),
  sendAt: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const campaign = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    return apiSuccess({ campaign });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = updateCampaignSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    if (existing.status === "sent" || existing.status === "sending") {
      return apiError("Cannot update sent or sending campaigns", 400);
    }

    const campaign = await db.campaign.update({
      where: { id: params.id },
      data: result.data,
    });

    return apiSuccess({ campaign });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const existing = await db.campaign.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Campaign not found", 404);
    }

    await db.campaign.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Campaign deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
