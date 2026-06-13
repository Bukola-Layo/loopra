import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const loop = await db.loop.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!loop) {
      return apiError("Loop not found", 404);
    }

    const executions = await db.loopExecution.findMany({
      where: { loopId: params.id },
      include: {
        subscriber: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        eventLogs: {
          include: { action: { select: { type: true, sequence: true } } },
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { triggeredAt: "desc" },
      take: 50,
    });

    return apiSuccess({ executions });
  } catch (error) {
    return handleApiError(error);
  }
}
