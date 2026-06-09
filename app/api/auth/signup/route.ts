import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { resend } from "@/lib/resend";
import crypto from "crypto";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { email, password, firstName, lastName } = result.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    await db.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        email,
        token: verificationToken,
        expires,
      },
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_xxxx")) {
      try {
        await resend.emails.send({
          from: "noreply@loopra.com",
          to: email,
          subject: "Verify your Loopra email",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>Welcome to Loopra, ${firstName}!</h2>
              <p>Thanks for signing up! Click the link below to verify your email address and get started.</p>
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
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    return NextResponse.json(
      { message: "Account created successfully. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
