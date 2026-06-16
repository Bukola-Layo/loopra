import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { transporter, fromEmail } from "@/lib/mail";
import crypto from "crypto";

const sendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = sendVerificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email } = result.data;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return NextResponse.json(
        { message: "Verification email sent if account exists" },
        { status: 200 }
      );
    }

    // If already verified, return success
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Generate token
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Upsert verification token
    await db.verificationToken.upsert({
      where: { email },
      update: { token, expires },
      create: { email, token, expires },
    });

    // Send email
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Verify your Loopra email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Verify your email</h2>
          <p>Thanks for signing up to Loopra! Click the link below to verify your email address.</p>
          <p>
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verifyUrl}</p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't create this account, you can ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
