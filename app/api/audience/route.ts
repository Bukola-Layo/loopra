import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const createSubscriberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  source: z.enum(["manual", "import", "website_form", "instagram", "facebook", "newsletter", "api", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const pageId = searchParams.get("pageId") ?? "";

    const where: Prisma.SubscriberWhereInput = { workspaceId };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (pageId) {
      where.pageId = pageId;
    }

    const [subscribers, total] = await Promise.all([
      db.subscriber.findMany({
        where,
        include: { tags: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.subscriber.count({ where }),
    ]);

    return apiSuccess({ subscribers, total, page });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = createSubscriberSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422, "VALIDATION_ERROR");
    }

    const { email, firstName, lastName, source, tags, customFields } = result.data;
    const subscriberSource = source ?? "manual";

    const existing = await db.subscriber.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
    });

    if (existing) {
      return apiError("Subscriber already exists", 409, "DUPLICATE");
    }

    const subscriber = await db.subscriber.create({
      data: {
        workspaceId,
        email,
        firstName,
        lastName,
        source: subscriberSource,
        customFields: (customFields ?? {}) as Prisma.InputJsonValue,
        tags: tags
          ? { create: tags.map((tag) => ({ tag })) }
          : undefined,
      },
      include: { tags: true },
    });

    return apiSuccess({ subscriber }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
