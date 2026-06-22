import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiError("Authentication required", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const { image } = body;

    if (typeof image !== "string") {
      return apiError("Invalid image data", 400);
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    await db.user.update({
      where: { id: userId },
      data: { image },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
