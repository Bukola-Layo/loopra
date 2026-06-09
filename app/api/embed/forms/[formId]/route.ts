import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/types/api";

const submitFormSchema = z.object({
  data: z.record(z.unknown()),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const form = await db.form.findUnique({
      where: { id: params.formId },
      include: { fields: true },
    });

    if (!form) {
      return apiError("Form not found", 404);
    }

    const body = await req.json();
    const result = submitFormSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid submission", 422);
    }

    const { data } = result.data;
    const email = data.email as string | undefined;

    let subscriberId: string | undefined;

    if (email) {
      const existingSubscriber = await db.subscriber.findFirst({
        where: {
          workspaceId: form.workspaceId,
          email,
        },
      });

      if (existingSubscriber) {
        subscriberId = existingSubscriber.id;
      } else {
        const newSubscriber = await db.subscriber.create({
          data: {
            workspaceId: form.workspaceId,
            email,
            firstName: (data.firstName as string) ?? (data.first_name as string),
            lastName: (data.lastName as string) ?? (data.last_name as string),
            customFields: data as Prisma.InputJsonValue,
          },
        });
        subscriberId = newSubscriber.id;
      }
    }

    await db.formSubmission.create({
      data: {
        formId: params.formId,
        subscriberId,
        data: data as Prisma.InputJsonValue,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
      },
    });

    return Response.json(
      { success: true, message: "Thank you for subscribing!" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return Response.json(
      { error: "Something went wrong" },
      { status: 500, headers: corsHeaders }
    );
  }
}
