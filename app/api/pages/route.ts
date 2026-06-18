import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createPageSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  template: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  showSubscriberCount: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const sort = searchParams.get("sort") ?? "newest";

    const where: Prisma.SubscriberPageWhereInput = { workspaceId };

    if (status === "published" || status === "draft") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.SubscriberPageOrderByWithRelationInput =
      sort === "oldest" ? { createdAt: "asc" } :
      sort === "subscribers" ? { subscriberCount: "desc" } :
      { createdAt: "desc" };

    const [pages, totalPages, totalSubscribers] = await Promise.all([
      db.subscriberPage.findMany({
        where,
        include: {
          _count: { select: { forms: true, subscribers: true } },
        },
        orderBy,
      }),
      db.subscriberPage.count({ where: { workspaceId } }),
      db.subscriber.aggregate({
        where: { workspaceId },
        _count: true,
      }),
    ]);

    return apiSuccess({
      pages,
      stats: {
        totalPages,
        totalSubscribers: totalSubscribers._count,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();

    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid input", 400, "VALIDATION_ERROR", {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, slug, description, template, logo, coverImage, showSubscriberCount, settings } = parsed.data;

    const existing = await db.subscriberPage.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
    });
    if (existing) {
      return apiError("A page with this slug already exists", 409, "SLUG_TAKEN");
    }

    const page = await db.subscriberPage.create({
      data: {
        workspaceId,
        name,
        slug,
        description,
        template,
        logo,
        coverImage,
        showSubscriberCount,
        settings: settings as Prisma.InputJsonValue | undefined,
      },
    });

    return apiSuccess({ page }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
