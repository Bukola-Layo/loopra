import { NextRequest } from "next/server";
import { z } from "zod";
import { getWorkspaceId } from "@/lib/auth";
import { evaluateTriggers } from "@/lib/loops-engine";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const evaluateSchema = z.object({
  eventType: z.string().min(1),
  eventData: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const result = evaluateSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 422);
    }

    const matched = await evaluateTriggers(
      workspaceId,
      result.data.eventType,
      result.data.eventData
    );

    return apiSuccess({ triggered: matched.length, matched });
  } catch (error) {
    return handleApiError(error);
  }
}
