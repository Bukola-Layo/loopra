import { NextRequest } from "next/server";
import { db } from "@/lib/db";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///y5BAAAAAAALAAAAAABAAEAAAICTAEAOw==",
  "base64"
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("cid");
  const subscriberId = searchParams.get("sid");

  if (campaignId && subscriberId) {
    try {
      await db.campaignSend.updateMany({
        where: { campaignId, subscriberId, openedAt: null },
        data: { openedAt: new Date() },
      });

      await db.campaignEvent.create({
        data: {
          campaignId,
          subscriberId,
          eventType: "open",
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error("Tracking error:", err);
    }
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
