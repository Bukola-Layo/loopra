import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";
import { getWorkspacePlan } from "@/lib/billing";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const subscription = await db.subscription.findFirst({
      where: { workspaceId, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const { usage } = await getWorkspacePlan(workspaceId);

    return apiSuccess({ subscription: subscription ? { ...subscription, usage } : null });
  } catch (error) {
    return handleApiError(error);
  }
}
