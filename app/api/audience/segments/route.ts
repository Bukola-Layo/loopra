import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const segments = await db.segment.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });
    return apiSuccess({ segments });
  } catch (error) {
    return handleApiError(error);
  }
}
