import { db } from "./db";
import { transporter, fromEmail } from "./mail";
import type { Prisma } from "@prisma/client";
import { createNotification } from "./notification";
import { anyToHtml } from "./email-builder";

type LoopWithRelations = Awaited<ReturnType<typeof getLoopWithRelations>>;

async function getLoopWithRelations(loopId: string, workspaceId: string) {
  return db.loop.findFirst({
    where: { id: loopId, workspaceId },
    include: {
      trigger: true,
      actions: { orderBy: { sequence: "asc" } },
    },
  });
}

type ExecutionPayload = {
  loopId: string;
  subscriberId: string;
  workspaceId: string;
};

export async function evaluateTriggers(
  workspaceId: string,
  eventType: string,
  eventData: Record<string, unknown>
) {
  const loops = await db.loop.findMany({
    where: { workspaceId, status: "active" },
    include: { trigger: true },
  });

  const matched: Array<{ loopId: string; subscriberId: string }> = [];

  for (const loop of loops) {
    if (!loop.trigger) continue;

    const subscriberId = resolveSubscriberFromEvent(eventType, eventData);
    if (!subscriberId) continue;

    const match = matchTrigger(loop.trigger.type, loop.trigger.config, eventType, eventData);
    if (!match) continue;

    matched.push({ loopId: loop.id, subscriberId });
  }

  for (const m of matched) {
    await startExecution(m.loopId, m.subscriberId, workspaceId).catch((err) =>
      console.error(`Loop execution failed for loop=${m.loopId}:`, err)
    );
  }

  return matched;
}

function resolveSubscriberFromEvent(
  eventType: string,
  eventData: Record<string, unknown>
): string | null {
  if (eventData.subscriberId) return eventData.subscriberId as string;
  const subscriber = eventData.subscriber as Record<string, unknown> | undefined;
  if (subscriber?.id) return subscriber.id as string;
  return null;
}

function matchTrigger(
  triggerType: string,
  config: unknown,
  eventType: string,
  eventData: Record<string, unknown>
): boolean {
  const cfg = (config as Record<string, unknown>) ?? {};

  switch (triggerType) {
    case "form_submission":
      return (
        eventType === "form_submission" &&
        (!cfg.formId || cfg.formId === eventData.formId)
      );
    case "tag_added":
      return (
        eventType === "tag_added" &&
        (!cfg.tagName || cfg.tagName === eventData.tagName)
      );
    case "subscriber_created":
      return eventType === "subscriber_created";
    case "campaign_opened":
      return (
        eventType === "campaign_opened" &&
        (!cfg.campaignId || cfg.campaignId === eventData.campaignId)
      );
    case "campaign_clicked":
      return (
        eventType === "campaign_clicked" &&
        (!cfg.campaignId || cfg.campaignId === eventData.campaignId)
      );
    default:
      return false;
  }
}

export async function startExecution(
  loopId: string,
  subscriberId: string,
  workspaceId: string
) {
  const loop = await getLoopWithRelations(loopId, workspaceId);
  if (!loop || loop.status !== "active") return;

  const execution = await db.loopExecution.create({
    data: {
      loopId,
      subscriberId,
      status: "running",
      startedAt: new Date(),
    },
  });

  await createNotification({
    workspaceId,
    type: "loop_triggered",
    title: "Loop triggered",
    description: `"${loop.name}" started for a subscriber`,
    link: `/dashboard/loops/${loopId}`,
  });

  process.nextTick(() => {
    runActions(execution.id, loop, subscriberId, workspaceId).catch((err) =>
      console.error(`Error in loop actions loop=${loopId}:`, err)
    );
  });

  return execution;
}

async function runActions(
  executionId: string,
  loop: LoopWithRelations,
  subscriberId: string,
  workspaceId: string
) {
  if (!loop) return;

  const subscriber = await db.subscriber.findFirst({
    where: { id: subscriberId, workspaceId },
  });
  if (!subscriber) {
    await db.loopExecution.update({
      where: { id: executionId },
      data: { status: "failed", lastError: "Subscriber not found" },
    });
    return;
  }

  for (const action of loop.actions) {
    const log = await db.loopEventLog.create({
      data: {
        executionId,
        actionId: action.id,
        status: "running",
      },
    });

    try {
      const result = await executeActionWithRetry(
        action,
        subscriber
      );

      await db.loopEventLog.update({
        where: { id: log.id },
        data: {
          status: "completed",
          result: result as Prisma.InputJsonValue | undefined,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      await db.loopEventLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          error: message,
          timestamp: new Date(),
        },
      });

      await db.loopExecution.update({
        where: { id: executionId },
        data: { status: "failed", lastError: message },
      });

      return;
    }
  }

  await db.loopExecution.update({
    where: { id: executionId },
    data: { status: "completed", completedAt: new Date() },
  });
}

async function executeActionWithRetry(
  action: NonNullable<LoopWithRelations>["actions"][number],
  subscriber: { id: string; email: string; firstName?: string | null }
) {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
      return await executeAction(action, subscriber);
    } catch (err) {
      lastError = err;
      console.error(
        `Action ${action.type}[${action.id}] attempt ${attempt + 1}/${maxRetries} failed:`,
        err
      );
    }
  }

  throw lastError;
}

export async function executeAction(
  action: NonNullable<LoopWithRelations>["actions"][number],
  subscriber: { id: string; email: string; firstName?: string | null }
) {
  const config = (action.config ?? {}) as Record<string, unknown>;

  switch (action.type) {
    case "send_email":
      return executeSendEmail(config, subscriber);
    case "delay":
      return executeDelay(config);
    case "apply_tag":
      return executeApplyTag(config, subscriber.id);
    case "remove_tag":
      return executeRemoveTag(config, subscriber.id);
    case "condition":
      return executeCondition(config, subscriber);
    case "webhook":
      return executeWebhook(config);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function executeSendEmail(
  config: Record<string, unknown>,
  subscriber: { id: string; email: string; firstName?: string | null }
) {
  const subject = config.subject as string;
  const content = config.content as string;
  if (!subject || !content) throw new Error("Email action missing subject or content");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const rendered = anyToHtml(content);
  const html = buildEmailDocument(rendered || content, baseUrl, subscriber.id);

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: subscriber.email,
      subject,
      html,
    });
  } catch (err) {
    throw new Error(`Email send failed: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  return { sent: true, email: subscriber.email };
}

function buildEmailDocument(
  body: string,
  baseUrl: string,
  subscriberId: string
) {
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
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <img src="${baseUrl}/api/track/open?sid=${subscriberId}" alt="" width="1" height="1" style="display:none;width:1px;height:1px;" />
</body>
</html>`;
}

async function executeDelay(config: Record<string, unknown>) {
  const durationMinutes = (config.durationMinutes as number) ?? 0;
  if (durationMinutes > 0) {
    await sleep(durationMinutes * 60 * 1000);
  }
  return { delayed: true, durationMinutes };
}

async function executeApplyTag(
  config: Record<string, unknown>,
  subscriberId: string
) {
  const tagName = config.tagName as string;
  if (!tagName) throw new Error("Apply tag action missing tagName");

  const existing = await db.subscriberTag.findFirst({
    where: { subscriberId, tag: tagName },
  });

  if (!existing) {
    await db.subscriberTag.create({
      data: { subscriberId, tag: tagName },
    });
  }

  return { tag: tagName, applied: !existing };
}

async function executeRemoveTag(
  config: Record<string, unknown>,
  subscriberId: string
) {
  const tagName = config.tagName as string;
  if (!tagName) throw new Error("Remove tag action missing tagName");

  await db.subscriberTag.deleteMany({
    where: { subscriberId, tag: tagName },
  });

  return { tag: tagName, removed: true };
}

async function executeCondition(
  config: Record<string, unknown>,
  subscriber: { id: string; email: string; firstName?: string | null }
) {
  const field = config.field as string;
  const operator = config.operator as string;
  const value = config.value as string;

  if (!field || !operator || value === undefined) {
    throw new Error("Condition action missing field, operator, or value");
  }

  let actualValue: string | null | undefined;

  switch (field) {
    case "email":
      actualValue = subscriber.email;
      break;
    case "firstName":
    case "first_name":
      actualValue = subscriber.firstName;
      break;
    default:
      const tags = await db.subscriberTag.findMany({
        where: { subscriberId: subscriber.id },
        select: { tag: true },
      });
      if (field === "hasTag") {
        actualValue = tags.some((t) => t.tag === value) ? "true" : "false";
      } else {
        actualValue = null;
      }
  }

  let passed = false;

  switch (operator) {
    case "equals":
      passed = actualValue === value;
      break;
    case "not_equals":
      passed = actualValue !== value;
      break;
    case "contains":
      passed = (actualValue ?? "").toLowerCase().includes(value.toLowerCase());
      break;
    case "not_contains":
      passed = !(actualValue ?? "").toLowerCase().includes(value.toLowerCase());
      break;
    case "is_set":
      passed = actualValue != null && actualValue !== "";
      break;
    case "is_not_set":
      passed = actualValue == null || actualValue === "";
      break;
    default:
      passed = false;
  }

  if (!passed) {
    throw new SkipActionError("Condition not met, skipping remaining actions");
  }

  return { condition: { field, operator, value }, passed };
}

async function executeWebhook(config: Record<string, unknown>) {
  const url = config.url as string;
  const method = (config.method as string) ?? "POST";
  const headers = (config.headers as Record<string, string>) ?? {};
  const body = config.body as string | undefined;

  if (!url) throw new Error("Webhook action missing url");

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ?? undefined,
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
  }

  return { url, status: response.status };
}

class SkipActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkipActionError";
  }
}

export async function processPendingDelays(workspaceId: string) {
  const pendingExecutions = await db.loopExecution.findMany({
    where: {
      status: "running",
    },
    include: {
      loop: {
        include: {
          trigger: true,
          actions: { orderBy: { sequence: "asc" } },
        },
      },
    },
  });

  for (const execution of pendingExecutions) {
    const lastLog = await db.loopEventLog.findFirst({
      where: { executionId: execution.id, status: "completed" },
      orderBy: { timestamp: "desc" },
    });

    if (!lastLog) continue;

    const lastAction = execution.loop.actions.find((a) => a.id === lastLog.actionId);
    if (!lastAction || lastAction.type !== "delay") continue;

    const config = (lastAction.config ?? {}) as Record<string, unknown>;
    const durationMinutes = (config.durationMinutes as number) ?? 0;
    const elapsed = (Date.now() - lastLog.timestamp.getTime()) / 1000 / 60;

    if (elapsed >= durationMinutes) {
      const remainingActions = execution.loop.actions.filter(
        (a) => a.sequence > lastAction.sequence
      );

      if (remainingActions.length > 0) {
        process.nextTick(() => {
          continueExecution(execution.id, remainingActions, execution.loop, workspaceId).catch(
            (err) => console.error(`Error continuing execution ${execution.id}:`, err)
          );
        });
      } else {
        await db.loopExecution.update({
          where: { id: execution.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }
    }
  }
}

async function continueExecution(
  executionId: string,
  remainingActions: NonNullable<LoopWithRelations>["actions"],
  loop: LoopWithRelations,
  workspaceId: string
) {
  const execution = await db.loopExecution.findUnique({
    where: { id: executionId },
  });
  if (!execution) return;

  const subscriber = await db.subscriber.findFirst({
    where: { id: execution.subscriberId, workspaceId },
  });
  if (!subscriber) return;

  for (const action of remainingActions) {
    const log = await db.loopEventLog.create({
      data: {
        executionId,
        actionId: action.id,
        status: "running",
      },
    });

    try {
      const result = await executeActionWithRetry(action, subscriber);

      await db.loopEventLog.update({
        where: { id: log.id },
        data: {
          status: "completed",
          result: result as Prisma.InputJsonValue | undefined,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      await db.loopEventLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          error: message,
          timestamp: new Date(),
        },
      });

      await db.loopExecution.update({
        where: { id: executionId },
        data: { status: "failed", lastError: message },
      });

      return;
    }
  }

  await db.loopExecution.update({
    where: { id: executionId },
    data: { status: "completed", completedAt: new Date() },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type { LoopWithRelations, ExecutionPayload };
