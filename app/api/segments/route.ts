import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  criteria: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const segments = await db.segment.findMany({
      where: { workspaceId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ segments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createSegmentSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const segment = await db.segment.create({
      data: {
        workspaceId,
        name: result.data.name,
        criteria: result.data.criteria as Prisma.InputJsonValue | undefined,
      },
    });

    return apiSuccess({ segment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
