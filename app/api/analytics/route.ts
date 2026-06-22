import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const [subscriberCount, campaignCount, formCount] = await Promise.all([
      db.subscriber.count({ where: { workspaceId } }),
      db.campaign.count({ where: { workspaceId } }),
      db.form.count({ where: { workspaceId } }),
    ]);

    return apiSuccess({
      metrics: {
        subscribers: subscriberCount,
        campaigns: campaignCount,
        forms: formCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
