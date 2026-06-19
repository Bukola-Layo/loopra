import { db } from "@/lib/db";

type NotificationType = "subscriber_added" | "campaign_sent" | "loop_triggered" | "page_published";

export async function createNotification({
  workspaceId,
  type,
  title,
  description,
  link,
}: {
  workspaceId: string;
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
}) {
  await db.notification.create({
    data: { workspaceId, type, title, description, link },
  });
}
