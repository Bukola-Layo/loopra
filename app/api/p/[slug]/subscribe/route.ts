import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/types/api";
import { evaluateTriggers } from "@/lib/loops-engine";

const subscribeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid email", 400, "VALIDATION_ERROR", {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const page = await db.subscriberPage.findFirst({
      where: { slug, status: "published" },
    });
    if (!page) {
      return apiError("Page not found", 404);
    }

    const { email, firstName, lastName } = parsed.data;

    const existing = await db.subscriber.findUnique({
      where: { workspaceId_email: { workspaceId: page.workspaceId, email } },
    });

    let subscriber;
    if (existing) {
      subscriber = await db.subscriber.update({
        where: { id: existing.id },
        data: {
          firstName: firstName ?? existing.firstName,
          lastName: lastName ?? existing.lastName,
          pageId: existing.pageId ?? page.id,
          lastEngagedAt: new Date(),
        },
      });
    } else {
      subscriber = await db.subscriber.create({
        data: {
          workspaceId: page.workspaceId,
          pageId: page.id,
          email,
          firstName,
          lastName,
          source: "page",
        },
      });

      await db.subscriberPage.update({
        where: { id: page.id },
        data: { subscriberCount: { increment: 1 } },
      });
    }

    evaluateTriggers(page.workspaceId, "subscriber_created", {
      subscriberId: subscriber.id,
      email: subscriber.email,
      source: "page",
      pageId: page.id,
      pageSlug: page.slug,
    }).catch(() => {});

    return apiSuccess({ success: true, subscriber: { id: subscriber.id, email: subscriber.email } }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
