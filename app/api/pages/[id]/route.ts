import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updatePageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).nullable().optional(),
  logo: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
  showSubscriberCount: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const { id } = await params;

    const page = await db.subscriberPage.findFirst({
      where: { id, workspaceId },
      include: {
        forms: {
          include: { fields: { orderBy: { position: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { subscribers: true } },
      },
    });

    if (!page) {
      return apiError("Page not found", 404);
    }

    return apiSuccess({ page });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const { id } = await params;
    const body = await req.json();

    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid input", 400, "VALIDATION_ERROR", {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const page = await db.subscriberPage.findFirst({
      where: { id, workspaceId },
    });
    if (!page) {
      return apiError("Page not found", 404);
    }

    if (parsed.data.slug) {
      const existing = await db.subscriberPage.findUnique({
        where: { workspaceId_slug: { workspaceId, slug: parsed.data.slug } },
      });
      if (existing && existing.id !== id) {
        return apiError("A page with this slug already exists", 409, "SLUG_TAKEN");
      }
    }

    const updateData = {
      ...parsed.data,
      settings: parsed.data.settings as Prisma.InputJsonValue | undefined,
    };
    const updated = await db.subscriberPage.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess({ page: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const { id } = await params;

    const page = await db.subscriberPage.findFirst({
      where: { id, workspaceId },
    });
    if (!page) {
      return apiError("Page not found", 404);
    }

    await db.subscriberPage.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
