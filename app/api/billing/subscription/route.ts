import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const subscription = await db.subscription.findFirst({
      where: { workspaceId, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ subscription });
  } catch (error) {
    return handleApiError(error);
  }
}
