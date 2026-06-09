import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    } : {};

    const [
      subscriberCount,
      activeSubscriberCount,
      campaignCount,
      sentCampaignCount,
      formCount,
      recentCampaigns,
      recentSubscribers,
    ] = await Promise.all([
      db.subscriber.count({ where: { workspaceId } }),
      db.subscriber.count({ where: { workspaceId, status: "active" } }),
      db.campaign.count({ where: { workspaceId } }),
      db.campaign.count({ where: { workspaceId, status: "sent" } }),
      db.form.count({ where: { workspaceId } }),
      db.campaign.findMany({
        where: { workspaceId, ...dateFilter },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.subscriber.findMany({
        where: { workspaceId, ...dateFilter },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { tags: true },
      }),
    ]);

    return apiSuccess({
      metrics: {
        subscribers: subscriberCount,
        activeSubscribers: activeSubscriberCount,
        campaigns: campaignCount,
        sentCampaigns: sentCampaignCount,
        forms: formCount,
      },
      recentCampaigns,
      recentSubscribers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
