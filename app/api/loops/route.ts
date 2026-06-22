import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const actionSchema = z.object({
  sequence: z.number(),
  type: z.enum(["send_email", "delay", "apply_tag", "remove_tag", "condition", "webhook"]),
  config: z.record(z.unknown()).optional(),
});

const createLoopSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(["form_submission", "tag_added", "subscriber_created", "campaign_opened", "campaign_clicked"]),
    config: z.record(z.unknown()).optional(),
  }),
  actions: z.array(actionSchema).min(1),
});

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const loops = await db.loop.findMany({
      where: { workspaceId },
      include: {
        trigger: true,
        actions: { orderBy: { sequence: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ loops });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createLoopSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const { trigger, actions, ...loopData } = result.data;

    const loop = await db.loop.create({
      data: {
        workspaceId,
        name: loopData.name,
        description: loopData.description,
        trigger: {
          create: {
            type: trigger.type,
            config: trigger.config as Prisma.InputJsonValue | undefined,
          },
        },
        actions: {
          create: actions.map((a) => ({
            sequence: a.sequence,
            type: a.type,
            config: a.config as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      include: {
        trigger: true,
        actions: { orderBy: { sequence: "asc" } },
      },
    });

    return apiSuccess({ loop }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
