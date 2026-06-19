import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification || notification.workspaceId !== workspaceId) {
      return apiError("Notification not found", 404);
    }

    const updated = await db.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return apiSuccess({ notification: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
