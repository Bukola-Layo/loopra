import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateSubscriberSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
  source: z.enum(["manual", "import", "website_form", "instagram", "facebook", "newsletter", "api", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const subscriber = await db.subscriber.findFirst({
      where: { id: params.id, workspaceId },
      include: { tags: true },
    });

    if (!subscriber) {
      return apiError("Subscriber not found", 404);
    }

    return apiSuccess({ subscriber });
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
    const result = updateSubscriberSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.subscriber.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Subscriber not found", 404);
    }

    const subscriber = await db.subscriber.update({
      where: { id: params.id },
      data: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        status: result.data.status,
        source: result.data.source,
        customFields: result.data.customFields as Prisma.InputJsonValue | undefined,
        tags: result.data.tags
          ? {
              deleteMany: {},
              create: result.data.tags.map((tag) => ({ tag })),
            }
          : undefined,
      },
      include: { tags: true },
    });

    return apiSuccess({ subscriber });
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
    const existing = await db.subscriber.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Subscriber not found", 404);
    }

    await db.subscriber.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Subscriber deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
