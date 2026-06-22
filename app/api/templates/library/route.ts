import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const industry = searchParams.get("industry");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isPublished: true };

    if (category) where.category = category;
    if (industry) where.industry = industry;
    if (source) where.source = source;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const templates = await db.emailTemplate.findMany({
      where: where as Prisma.EmailTemplateWhereInput,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ templates });
  } catch (error) {
    return handleApiError(error);
  }
}
