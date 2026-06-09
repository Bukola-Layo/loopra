import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const result = verifyEmailSchema.safeParse({ token, email });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { token: verifyToken, email: verifyEmail } = result.data;

    // Find verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { email: verifyEmail },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Verification token not found" },
        { status: 404 }
      );
    }

    // Check token validity
    if (verificationToken.token !== verifyToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Update user
    await db.user.update({
      where: { email: verifyEmail },
      data: { emailVerified: new Date() },
    });

    // Delete verification token
    await db.verificationToken.delete({
      where: { email: verifyEmail },
    });

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
