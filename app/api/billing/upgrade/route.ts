import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId, requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";
import { initiateCheckout } from "@/lib/flutterwave";
import { canUpgrade } from "@/lib/billing";

const upgradeSchema = z.object({
  planId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const session = await requireAuth();
    const body = await req.json();

    const parsed = upgradeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid input", 400);
    }

    const targetPlan = await db.subscriptionPlan.findUnique({
      where: { id: parsed.data.planId },
    });
    if (!targetPlan) {
      return apiError("Plan not found", 404);
    }

    const currentSubscription = await db.subscription.findFirst({
      where: { workspaceId, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (currentSubscription) {
      if (!canUpgrade(currentSubscription.plan.slug, targetPlan.slug)) {
        return apiError("Cannot upgrade to this plan", 400);
      }
    }

    if (Number(targetPlan.price) === 0) {
      const existing = await db.subscription.findFirst({
        where: { workspaceId, status: "active" },
      });

      if (existing) {
        await db.subscription.update({
          where: { id: existing.id },
          data: { status: "cancelled", cancelledAt: new Date() },
        });
      }

      const subscription = await db.subscription.create({
        data: {
          workspaceId,
          planId: targetPlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        },
      });

      return apiSuccess({ subscription, checkoutUrl: null });
    }

    const checkoutUrl = await initiateCheckout({
      email: session.user.email,
      amount: Number(targetPlan.price),
      currency: targetPlan.currency,
      planId: targetPlan.id,
      callbackUrl: `${
        process.env.NEXT_PUBLIC_APP_URL ?? ""
      }/dashboard/settings/billing`,
    });

    if (!checkoutUrl) {
      return apiError("Failed to initiate payment", 500);
    }

    return apiSuccess({ checkoutUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
