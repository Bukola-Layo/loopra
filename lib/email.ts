import { transporter, fromEmail } from "./mail";
import { db } from "./db";
import { marked } from "marked";
import { deserializeBlocks, blocksToRows } from "./email-builder";

const TRACKING_PIXEL_BASE64 =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function wrapLinks(
  html: string,
  campaignId: string,
  subscriberId: string,
  baseUrl: string
): string {
  return html.replace(
    /href="([^"]+)"/g,
    (_match, url: string) => {
      if (url.startsWith(baseUrl)) return `href="${url}"`;
      return `href="${baseUrl}/api/track/click?cid=${campaignId}&sid=${subscriberId}&url=${encodeURIComponent(url)}"`;
    }
  );
}

export async function renderEmailHtml(
  content: string,
  contentType: string,
  campaignId: string,
  subscriberId: string,
  baseUrl: string
): Promise<string> {
  const processed =
    contentType === "markdown"
      ? await marked(content)
      : content;

  // If content is serialized blocks JSON, convert to row HTML
  const bodyContent = (() => {
    const blocks = deserializeBlocks(processed);
    if (blocks) return blocksToRows(blocks);
    return processed;
  })();

  const withLinks = wrapLinks(bodyContent, campaignId, subscriberId, baseUrl);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px;">
              ${withLinks}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <a href="${baseUrl}/api/track/unsubscribe?cid=${campaignId}&sid=${subscriberId}" style="color:#a1a1aa;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <img src="${baseUrl}/api/track/open?cid=${campaignId}&sid=${subscriberId}" alt="" width="1" height="1" style="display:none;width:1px;height:1px;" />
</body>
</html>`;
}

export async function sendCampaign(
  campaignId: string,
  workspaceId: string,
  {
    segmentIds,
    subscriberIds,
  }: { segmentIds?: string[]; subscriberIds?: string[] } = {}
): Promise<{ sent: number; failed: number }> {
  const [campaign, subscribers] = await Promise.all([
    db.campaign.findFirst({ where: { id: campaignId, workspaceId } }),
    resolveRecipients(workspaceId, { segmentIds, subscriberIds }),
  ]);

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "draft") throw new Error("Can only send draft campaigns");

  await db.campaign.update({
    where: { id: campaign.id },
    data: { status: "sending" },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      const html = await renderEmailHtml(
        campaign.content ?? "",
        campaign.contentType,
        campaign.id,
        subscriber.id,
        baseUrl
      );

      try {
        await transporter.sendMail({
          from: fromEmail,
          to: subscriber.email,
          subject: campaign.subject,
          html,
        });
      } catch (err) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
        failed++;
        await db.campaignSend.create({
          data: {
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            bounced: true,
            sentAt: new Date(),
          },
        });
        continue;
      }

      await db.campaignSend.create({
        data: {
          campaignId: campaign.id,
          subscriberId: subscriber.id,
          sentAt: new Date(),
        },
      });

      sent++;
    } catch (err) {
      console.error(`Error sending to ${subscriber.email}:`, err);
      failed++;
    }
  }

  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: "sent",
      recipientCount: sent,
      sentAt: new Date(),
    },
  });

  return { sent, failed };
}

async function resolveRecipients(
  workspaceId: string,
  opts: { segmentIds?: string[]; subscriberIds?: string[] }
) {
  const where: Record<string, unknown> = { workspaceId, status: "active" };

  if (opts.segmentIds?.length) {
    where.segmentMembers = { some: { segmentId: { in: opts.segmentIds } } };
  }
  if (opts.subscriberIds?.length) {
    where.id = { in: opts.subscriberIds };
  }

  return db.subscriber.findMany({ where, select: { id: true, email: true } });
}
