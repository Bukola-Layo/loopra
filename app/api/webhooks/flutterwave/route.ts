import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyFlutterwaveWebhook } from "@/lib/flutterwave";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("verif-hash") ?? "";

    if (!verifyFlutterwaveWebhook(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const data = JSON.parse(payload);

    const { event, data: eventData } = data;

    if (event === "charge.completed" && eventData.status === "successful") {
      const { tx_ref, amount, currency, customer } = eventData;

      const subscription = await db.subscription.findFirst({
        where: {
          payments: {
            some: {
              flutterwaveReference: tx_ref,
            },
          },
        },
      });

      if (subscription) {
        await db.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: parseFloat(amount),
            currency: currency ?? "USD",
            status: "success",
            flutterwaveReference: tx_ref,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
