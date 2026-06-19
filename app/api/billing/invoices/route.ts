import { db } from "@/lib/db";
import { getWorkspaceId } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/types/api";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();

    const subscription = await db.subscription.findFirst({
      where: { workspaceId },
      include: {
        plan: { select: { name: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const invoices =
      subscription?.payments.map((p) => ({
        id: p.id,
        date: p.createdAt,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        planName: subscription.plan.name,
        reference: p.flutterwaveReference,
      })) ?? [];

    return apiSuccess({ invoices });
  } catch (error) {
    return handleApiError(error);
  }
}
