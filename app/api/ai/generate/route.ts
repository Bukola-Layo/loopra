import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";
import { db } from "@/lib/db";
import { generateEmailContent, generateSubjectLine, trackAiUsage, checkAiLimit } from "@/lib/ai";

const generateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  type: z.enum(["content", "subject"]),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const workspaceId = await getWorkspaceId();

    const { allowed, remaining } = await checkAiLimit(workspaceId);
    if (!allowed) {
      return apiError(
        `Monthly AI generation limit reached. ${remaining} remaining.`,
        429
      );
    }

    const body = await req.json();
    const result = generateSchema.safeParse(body);
    if (!result.success) return apiError("Validation failed", 422);

    const { prompt, type } = result.data;

    let generated: string;
    if (type === "subject") {
      generated = await generateSubjectLine(prompt);
    } else {
      generated = await generateEmailContent({ prompt, tone: "professional", length: "medium" });
    }

    // Track usage
    const inputTokens = prompt.length;
    const outputTokens = generated.length;
    await trackAiUsage(
      workspaceId,
      session.user.id,
      type,
      inputTokens,
      outputTokens,
      prompt,
      generated
    );

    // Increment usage counter
    const limit = await db.aiUsageLimit.findUnique({
      where: { workspaceId },
    });
    if (limit) {
      await db.aiUsageLimit.update({
        where: { workspaceId },
        data: { usedThisMonth: { increment: 1 } },
      });
    } else {
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await db.aiUsageLimit.create({
        data: {
          workspaceId,
          monthlyLimit: 5,
          usedThisMonth: 1,
          resetAt,
        },
      });
    }

    const responseBody: Record<string, string> = {};
    if (type === "subject") {
      responseBody.subject = generated;
    } else {
      responseBody.content = generated;
    }

    return apiSuccess(responseBody);
  } catch (error) {
    return handleApiError(error);
  }
}
