import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST() {
  try {
    const workspaceId = await getWorkspaceId();

    const subscription = await db.subscription.findFirst({
      where: { workspaceId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return apiError("No active subscription found", 404);
    }

    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        currentPeriodEnd: new Date(),
      },
    });

    return apiSuccess({ subscription: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
