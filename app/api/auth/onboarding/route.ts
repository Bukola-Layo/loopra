import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  workspaceName: z.string().min(1).max(100),
  goals: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as string;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 422 });
    }

    await db.workspace.update({
      where: { id: workspaceId },
      data: { name: result.data.workspaceName },
    });

    return NextResponse.json({ message: "Onboarding complete" });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
