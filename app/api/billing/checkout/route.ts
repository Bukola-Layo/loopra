import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { initiateCheckout } from "@/lib/flutterwave";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const checkoutSchema = z.object({
  planId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const plan = await db.subscriptionPlan.findUnique({
      where: { id: result.data.planId },
    });

    if (!plan) {
      return apiError("Plan not found", 404);
    }

    const checkoutUrl = await initiateCheckout({
      email: session.user.email,
      amount: Number(plan.price),
      currency: plan.currency,
      planId: plan.id,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/settings`,
    });

    return apiSuccess({ checkoutUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
