import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubscribe } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("cid") ?? "";
  const subscriberId = searchParams.get("sid") ?? "";
  const signature = searchParams.get("sig") ?? "";

  if (!verifyUnsubscribe(campaignId, subscriberId, signature)) {
    return new Response("Invalid unsubscribe link", { status: 400 });
  }

  if (subscriberId) {
    try {
      await db.subscriber.update({
        where: { id: subscriberId },
        data: { status: "unsubscribed" },
      });

      if (campaignId) {
        await db.campaignSend.updateMany({
          where: { campaignId, subscriberId },
          data: { unsubscribed: true },
        });

        await db.campaignEvent.create({
          data: {
            campaignId,
            subscriberId,
            eventType: "unsubscribe",
            timestamp: new Date(),
          },
        });
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Unsubscribed</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f5;">
  <div style="text-align:center;padding:32px;background:white;border-radius:8px;max-width:400px;">
    <h1 style="font-size:20px;margin:0 0 8px;">Unsubscribed</h1>
    <p style="color:#71717a;font-size:14px;margin:0;">You have been unsubscribed successfully. You will no longer receive emails from this workspace.</p>
  </div>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
