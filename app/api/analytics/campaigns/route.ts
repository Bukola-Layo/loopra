import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where: { workspaceId },
        include: {
          _count: { select: { sends: true, events: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.campaign.count({ where: { workspaceId } }),
    ]);

    return apiSuccess({ campaigns, total, page });
  } catch (error) {
    return handleApiError(error);
  }
}
