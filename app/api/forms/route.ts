import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const fieldSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["text", "email", "select", "checkbox", "textarea"]),
  required: z.boolean().default(false),
  position: z.number(),
  options: z.array(z.string()).optional(),
});

const createFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  pageId: z.string().uuid().optional(),
  fields: z.array(fieldSchema).min(1),
  settings: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const forms = await db.form.findMany({
      where: { workspaceId },
      include: {
        fields: { orderBy: { position: "asc" } },
        page: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ forms });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createFormSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const { fields, ...formData } = result.data;

    const form = await db.form.create({
      data: {
        workspaceId,
        name: formData.name,
        description: formData.description,
        pageId: formData.pageId,
        settings: formData.settings as Prisma.InputJsonValue | undefined,
        fields: {
          create: fields,
        },
      },
      include: { fields: true, page: { select: { id: true, name: true, slug: true } } },
    });

    return apiSuccess({ form }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
