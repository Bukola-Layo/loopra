import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("cid");
  const subscriberId = searchParams.get("sid");
  const url = searchParams.get("url");

  if (campaignId && subscriberId) {
    try {
      await db.campaignSend.updateMany({
        where: { campaignId, subscriberId, clickedAt: null },
        data: { clickedAt: new Date() },
      });

      await db.campaignEvent.create({
        data: {
          campaignId,
          subscriberId,
          eventType: "click",
          linkClicked: url,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error("Click tracking error:", err);
    }
  }

  const destination = url ? decodeURIComponent(url) : "/";
  return Response.redirect(destination, 302);
}
