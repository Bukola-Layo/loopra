import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const forms = await db.form.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { submissions: true } },
        submissions: {
          select: { timestamp: true },
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ forms });
  } catch (error) {
    return handleApiError(error);
  }
}
