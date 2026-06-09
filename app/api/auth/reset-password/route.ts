import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { token, email, password } = result.data;

    // Find password reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { email },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Password reset token not found" },
        { status: 404 }
      );
    }

    // Check token validity
    if (resetToken.token !== token) {
      return NextResponse.json(
        { error: "Invalid password reset token" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > resetToken.expires) {
      return NextResponse.json(
        { error: "Password reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user
    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete reset token
    await db.passwordResetToken.delete({
      where: { email },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
