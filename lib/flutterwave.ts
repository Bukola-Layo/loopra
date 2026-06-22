import { createHmac } from "crypto";

export function verifyFlutterwaveWebhook(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET ?? "";
  if (!secret) return false;

  const hash = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

export async function verifyPayment(transactionId: string): Promise<boolean> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY ?? "";
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  return data.status === "success" && data.data.status === "successful";
}

export async function initiateCheckout(params: {
  email: string;
  amount: number;
  currency?: string;
  planId: string;
  callbackUrl: string;
}): Promise<string | null> {
  const txRef = `loopra-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const response = await fetch(
    "https://api.flutterwave.com/v3/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: params.amount,
        currency: params.currency ?? "USD",
        redirect_url: params.callbackUrl,
        customer: {
          email: params.email,
        },
        meta: {
          planId: params.planId,
        },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.data?.link ?? null;
}
