import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError("Authentication required", 401, "UNAUTHORIZED");

    const { image: base64Data, filename, mimeType } = await req.json() as {
      image: string;
      filename?: string;
      mimeType?: string;
    };

    if (!base64Data || typeof base64Data !== "string") {
      return apiError("No image data provided", 422);
    }

    const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return apiError("Invalid image data format", 422);

    const detectedMime = match[1];
    const rawBase64 = match[2];
    const buffer = Buffer.from(rawBase64, "base64");
    const size = buffer.length;

    if (size > 10 * 1024 * 1024) return apiError("Image exceeds 10MB limit", 413);

    const userId = (session.user as Record<string, unknown>).id as string;
    const workspaceId = (session.user as Record<string, unknown>).workspaceId as string;
    if (!workspaceId) return apiError("No workspace found", 400);

    const image = await db.image.create({
      data: {
        workspaceId,
        userId,
        filename: filename ?? "upload",
        mimeType: mimeType ?? detectedMime,
        data: buffer,
        size,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return apiSuccess({ url: `${baseUrl}/api/image/${image.id}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
