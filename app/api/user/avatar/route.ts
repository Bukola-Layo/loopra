import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("User ID required", { status: 400 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: { image: true },
    });

    if (!user || !user.image || !user.image.startsWith("data:")) {
      return new NextResponse("Not found", { status: 404 });
    }

    const match = user.image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return new NextResponse("Invalid image format", { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("Avatar API error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
