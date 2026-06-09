import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  content: z.string().optional(),
  contentType: z.enum(["html", "markdown"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const campaigns = await db.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ campaigns });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createCampaignSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const campaign = await db.campaign.create({
      data: {
        workspaceId,
        ...result.data,
        status: "draft",
      },
    });

    return apiSuccess({ campaign }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
