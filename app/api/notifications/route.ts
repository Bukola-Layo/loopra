import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.notification.count({
        where: { workspaceId, read: false },
      }),
    ]);

    return apiSuccess({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();

    if (body.markAllRead) {
      await db.notification.updateMany({
        where: { workspaceId, read: false },
        data: { read: true },
      });
      return apiSuccess({ success: true });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
