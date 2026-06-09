import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateFormSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const form = await db.form.findFirst({
      where: { id: params.id, workspaceId },
      include: { fields: { orderBy: { position: "asc" } } },
    });

    if (!form) {
      return apiError("Form not found", 404);
    }

    return apiSuccess({ form });
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
    const result = updateFormSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.form.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Form not found", 404);
    }

    const form = await db.form.update({
      where: { id: params.id },
      data: {
        name: result.data.name,
        description: result.data.description,
        settings: result.data.settings as Prisma.InputJsonValue | undefined,
      },
      include: { fields: { orderBy: { position: "asc" } } },
    });

    return apiSuccess({ form });
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
    const existing = await db.form.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Form not found", 404);
    }

    await db.form.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Form deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
