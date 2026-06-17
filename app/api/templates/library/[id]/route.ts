import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await db.emailTemplate.findUnique({
      where: { id: params.id },
    });

    return apiSuccess({ template: template ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
