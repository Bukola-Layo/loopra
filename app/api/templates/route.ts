import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  content: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const templates = await db.template.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ templates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createTemplateSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const template = await db.template.create({
      data: {
        workspaceId,
        ...result.data,
      },
    });

    return apiSuccess({ template }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
