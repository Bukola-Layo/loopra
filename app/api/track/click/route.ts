import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function validateUrl(raw: string): string | null {
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = new URL(decoded);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return decoded;
  } catch {
    return null;
  }
}

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

  const destination = url ? validateUrl(url) : null;
  return Response.redirect(destination ?? "/", 302);
}
