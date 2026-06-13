import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const existing = await db.loop.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Loop not found", 404);
    }

    const loop = await db.loop.update({
      where: { id: params.id },
      data: { status: "paused" },
      include: {
        trigger: true,
        actions: { orderBy: { sequence: "asc" } },
      },
    });

    return apiSuccess({ loop });
  } catch (error) {
    return handleApiError(error);
  }
}
