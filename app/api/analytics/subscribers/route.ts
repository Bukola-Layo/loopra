import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const interval = searchParams.get("interval") ?? "day";

    const [activeCount, bouncedCount] = await Promise.all([
      db.subscriber.count({ where: { workspaceId, status: "active" } }),
      db.subscriber.count({ where: { workspaceId, status: "bounced" } }),
    ]);

    const totalSubscribers = await db.subscriber.count({ where: { workspaceId } });
    const unsubscribed = await db.subscriber.count({
      where: { workspaceId, status: "unsubscribed" },
    });

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    } : {};

    const growth = await db.subscriber.findMany({
      where: { workspaceId, ...dateFilter },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({
      metrics: {
        total: totalSubscribers,
        active: activeCount,
        unsubscribed,
        bounced: bouncedCount,
      },
      growth,
      interval,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
