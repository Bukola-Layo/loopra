import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await db.form.findUnique({
      where: { id: params.id },
      include: { fields: { orderBy: { position: "asc" } } },
    });

    if (!form) {
      return Response.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status === "disabled") {
      return Response.json({ error: "This form is no longer accepting submissions" }, { status: 403 });
    }

    const formData = await req.formData();
    const data: Record<string, string> = {};
    let email = "";

    for (const [key, value] of formData.entries()) {
      const str = typeof value === "string" ? value : "";
      data[key] = str;
      if (key.toLowerCase() === "email" && str) {
        email = str;
      }
    }

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 422 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

    let subscriber = await db.subscriber.findUnique({
      where: { workspaceId_email: { workspaceId: form.workspaceId, email } },
    });

    if (!subscriber) {
      subscriber = await db.subscriber.create({
        data: {
          workspaceId: form.workspaceId,
          email,
          source: "form",
          customFields: data,
        },
      });
    }

    await db.formSubmission.create({
      data: {
        formId: params.id,
        subscriberId: subscriber.id,
        data,
        ipAddress,
      },
    });

    return Response.redirect(
      new URL("/?subscribed=true", req.url).toString(),
      302
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
