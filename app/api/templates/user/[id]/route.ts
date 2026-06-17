import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  html: z.string().optional(),
  designJson: z.string().optional(),
  thumbnail: z.string().optional(),
});

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const template = await db.userTemplate.findFirst({
      where: { id: params.id, userId },
    });
    if (!template) return apiError("Template not found", 404);
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
    const userId = await getUserId();
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return apiError("Validation failed", 422);

    const existing = await db.userTemplate.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return apiError("Template not found", 404);

    const template = await db.userTemplate.update({
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
    const userId = await getUserId();
    const existing = await db.userTemplate.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return apiError("Template not found", 404);

    await db.userTemplate.delete({ where: { id: params.id } });
    return apiSuccess({ message: "Template deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
