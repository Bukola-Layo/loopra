import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await db.image.findUnique({
      where: { id: params.id },
      select: { data: true, mimeType: true },
    });

    if (!image) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(image.data as unknown as BodyInit, {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
