import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { name, campaignId } = body;

    if (!name?.trim() || !campaignId) {
      return apiError("name and campaignId are required", 422);
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return apiError("Campaign not found", 404);

    const template = await db.userTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        html: campaign.content ?? undefined,
      },
    });

    return apiSuccess({ template }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
