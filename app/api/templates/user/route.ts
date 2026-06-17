import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  html: z.string().optional(),
  thumbnail: z.string().optional(),
  originalTemplateId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  html: z.string().optional(),
  thumbnail: z.string().optional(),
});

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function GET() {
  try {
    const userId = await getUserId();
    const templates = await db.userTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ templates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 422);
    }
    const template = await db.userTemplate.create({
      data: { userId, ...result.data },
    });
    return apiSuccess({ template }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return apiError("Template ID required", 422);
    const result = updateSchema.safeParse(data);
    if (!result.success) return apiError("Validation failed", 422);

    const existing = await db.userTemplate.findFirst({
      where: { id, userId },
    });
    if (!existing) return apiError("Template not found", 404);

    const template = await db.userTemplate.update({
      where: { id },
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
