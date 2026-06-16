import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateLoopSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "disabled"]).optional(),
  trigger: z.object({
    type: z.enum(["form_submission", "tag_added", "subscriber_created", "campaign_opened", "campaign_clicked"]),
    config: z.record(z.unknown()).optional(),
  }).optional(),
  actions: z.array(z.object({
    sequence: z.number(),
    type: z.enum(["send_email", "delay", "apply_tag", "remove_tag", "condition", "webhook"]),
    config: z.record(z.unknown()).optional(),
  })).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const loop = await db.loop.findFirst({
      where: { id: params.id, workspaceId },
      include: {
        trigger: true,
        actions: { orderBy: { sequence: "asc" } },
      },
    });

    if (!loop) {
      return apiError("Loop not found", 404);
    }

    return apiSuccess({ loop });
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
    const result = updateLoopSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.loop.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Loop not found", 404);
    }

    const { trigger, actions, ...loopData } = result.data;

    const loop = await db.loop.update({
      where: { id: params.id },
      data: {
        ...loopData,
        ...(trigger && {
          trigger: {
            upsert: {
              create: {
                type: trigger.type,
                config: trigger.config as Prisma.InputJsonValue | undefined,
              },
              update: {
                type: trigger.type,
                config: trigger.config as Prisma.InputJsonValue | undefined,
              },
            },
          },
        }),
        ...(actions && {
          actions: {
            deleteMany: {},
            create: actions.map((a) => ({
              sequence: a.sequence,
              type: a.type,
              config: a.config as Prisma.InputJsonValue | undefined,
            })),
          },
        }),
      },
      include: {
        trigger: true,
        actions: { orderBy: { sequence: "asc" } },
      },
    });

    return apiSuccess({ loop });
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
    const existing = await db.loop.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Loop not found", 404);
    }

    await db.loop.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Loop deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
