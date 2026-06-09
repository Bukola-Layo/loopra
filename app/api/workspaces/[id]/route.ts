import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo: z.string().url().optional().nullable(),
  domain: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const workspace = await db.workspace.findFirst({
      where: {
        id: params.id,
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true, subscribers: true, forms: true, campaigns: true } },
      },
    });

    if (!workspace) {
      return apiError("Workspace not found", 404);
    }

    return apiSuccess({ workspace });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const result = updateWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.workspace.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!existing) {
      return apiError("Workspace not found", 404);
    }

    const workspace = await db.workspace.update({
      where: { id: params.id },
      data: result.data,
    });

    return apiSuccess({ workspace });
  } catch (error) {
    return handleApiError(error);
  }
}
