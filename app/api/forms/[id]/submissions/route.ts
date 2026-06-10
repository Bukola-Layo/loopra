import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = await getWorkspaceId();
    const form = await db.form.findFirst({
      where: { id: params.id, workspaceId },
    });
    if (!form) {
      return Response.json({ error: "Form not found" }, { status: 404 });
    }

    const submissions = await db.formSubmission.findMany({
      where: { formId: params.id },
      include: { subscriber: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return apiSuccess({ submissions });
  } catch (error) {
    return handleApiError(error);
  }
}
