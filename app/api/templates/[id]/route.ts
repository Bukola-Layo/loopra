import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  content: z.string().optional(),
  thumbnail: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const template = await db.template.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!template) {
      return apiError("Template not found", 404);
    }

    return apiSuccess({ template });
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
    const result = updateTemplateSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const existing = await db.template.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Template not found", 404);
    }

    const template = await db.template.update({
      where: { id: params.id },
      data: result.data,
    });

    return apiSuccess({ template });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const existing = await db.template.findFirst({
      where: { id: params.id, workspaceId },
    });

    if (!existing) {
      return apiError("Template not found", 404);
    }

    await db.template.delete({ where: { id: params.id } });

    return apiSuccess({ message: "Template deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
