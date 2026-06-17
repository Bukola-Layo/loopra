import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transporter, fromEmail } from "@/lib/mail";
import { deserializeBlocks, blocksToHtml } from "@/lib/email-builder";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

const testSendSchema = z.object({
  content: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return apiError("Not authenticated", 401);

    const body = await req.json();
    const result = testSendSchema.safeParse(body);
    if (!result.success) return apiError("Validation failed", 422);

    const campaign = await db.campaign.findFirst({
      where: { id: params.id },
    });
    if (!campaign) return apiError("Campaign not found", 404);

    // Convert blocks back to HTML
    const blocks = deserializeBlocks(result.data.content);
    const html = blocks ? blocksToHtml(blocks) : result.data.content;

    await transporter.sendMail({
      from: fromEmail,
      to: session.user.email,
      subject: `[Test] ${campaign.subject}`,
      html,
    });

    return apiSuccess({ message: `Test email sent to ${session.user.email}` });
  } catch (error) {
    return handleApiError(error);
  }
}
