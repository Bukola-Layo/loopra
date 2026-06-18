import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const { id } = await params;
    const body = await req.json();
    const publish = body.publish === true;

    const page = await db.subscriberPage.findFirst({
      where: { id, workspaceId },
    });
    if (!page) {
      return apiError("Page not found", 404);
    }

    const updated = await db.subscriberPage.update({
      where: { id },
      data: { status: publish ? "published" : "draft" },
    });

    return apiSuccess({ page: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
