import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const importSubscriberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  source: z.enum(["manual", "import", "website_form", "instagram", "facebook", "newsletter", "api", "other"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const { subscribers: rawSubscribers } = body as { subscribers: unknown[] };

    if (!Array.isArray(rawSubscribers) || rawSubscribers.length === 0) {
      return apiError("No subscribers provided", 422);
    }

    const results = { created: 0, skipped: 0, errors: 0 };

    for (const raw of rawSubscribers) {
      const result = importSubscriberSchema.safeParse(raw);
      if (!result.success) {
        results.errors++;
        continue;
      }

      const { email, firstName, lastName, source } = result.data;
      const subscriberSource = source ?? "import";

      const existing = await db.subscriber.findUnique({
        where: { workspaceId_email: { workspaceId, email } },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      try {
        await db.subscriber.create({
          data: {
            workspaceId,
            email,
            firstName,
            lastName,
            source: subscriberSource,
            customFields: {} as Prisma.InputJsonValue,
          },
        });
        results.created++;
      } catch {
        results.errors++;
      }
    }

    return apiSuccess({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
