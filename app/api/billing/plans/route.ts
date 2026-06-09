import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/types/api";

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
