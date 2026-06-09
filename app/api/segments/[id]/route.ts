import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateSegmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  criteria: z.record(z.unknown()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const segment = await db.segment.findFirst({
      where: { id: params.id, workspaceId },
      include: { _count: { select: { members: true } } },
    });

    if (!segment) {
      return apiError("Segment not found", 404);
    }

    return apiSuccess({ segment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = updateSegmentSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.segment.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Segment not found", 404);
    }

    const data: Record<string, unknown> = {};
    if (result.data.name) data.name = result.data.name;
    if (result.data.criteria) data.criteria = result.data.criteria as Prisma.InputJsonValue;

    const segment = await db.segment.update({
      where: { id: params.id },
      data,
    });

    return apiSuccess({ segment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const existing = await db.segment.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Segment not found", 404);
    }

    await db.segment.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Segment deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
