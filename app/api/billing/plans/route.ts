import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/types/api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });

    return apiSuccess({ plans });
  } catch (error) {
    return handleApiError(error);
  }
}
