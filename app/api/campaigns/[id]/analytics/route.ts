import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

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

    const [sends, events] = await Promise.all([
      db.campaignSend.findMany({
        where: { campaignId: params.id },
        select: {
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          bounced: true,
          unsubscribed: true,
        },
      }),
      db.campaignEvent.findMany({
        where: { campaignId: params.id },
        orderBy: { timestamp: "asc" },
      }),
    ]);

    type CampaignSendRow = { sentAt: Date | null; openedAt: Date | null; clickedAt: Date | null; bounced: boolean; unsubscribed: boolean };

    const totalSent = sends.length;
    const totalOpened = sends.filter((s: CampaignSendRow) => s.openedAt).length;
    const totalClicked = sends.filter((s: CampaignSendRow) => s.clickedAt).length;
    const totalBounced = sends.filter((s: CampaignSendRow) => s.bounced).length;
    const totalUnsubscribed = sends.filter((s: CampaignSendRow) => s.unsubscribed).length;

    return apiSuccess({
      campaign,
      metrics: {
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        unsubscribed: totalUnsubscribed,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        clickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0,
        bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0,
      },
      events,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
