import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId, requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const workspaces = await db.workspace.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true, subscribers: true } },
      },
    });

    return apiSuccess({ workspaces });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const workspace = await db.workspace.create({
      data: {
        name: result.data.name,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });

    return apiSuccess({ workspace }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
