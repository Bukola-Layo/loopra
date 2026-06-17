import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { templateId } = body;

    if (!templateId) return apiError("templateId is required", 422);

    const original = await db.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!original) return apiError("Template not found", 404);

    const duplicate = await db.userTemplate.create({
      data: {
        userId: session.user.id,
        name: `${original.name} (copy)`,
        html: original.html,
        thumbnail: original.thumbnail,
        originalTemplateId: original.id,
      },
    });

    return apiSuccess({ template: duplicate }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
