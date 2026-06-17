import { db } from "@/lib/db";

const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type GenerateEmailContentParams = {
  prompt: string;
  tone?: string;
  length?: "short" | "medium" | "long";
};

export async function generateEmailContent({
  prompt,
  tone = "professional",
  length = "medium",
}: GenerateEmailContentParams): Promise<string> {
  const lengthGuide = {
    short: "2-3 paragraphs",
    medium: "4-5 paragraphs",
    long: "6-8 paragraphs",
  };

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert email copywriter. Write in a ${tone} tone. Keep it ${lengthGuide[length]}. Use HTML formatting.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function generateSubjectLine(
  prompt: string
): Promise<string> {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert email marketer. Generate compelling email subject lines. Return ONLY the subject line, no quotes or prefixes.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function trackAiUsage(
  workspaceId: string,
  userId: string,
  type: string,
  inputTokens: number,
  outputTokens: number,
  prompt?: string,
  result?: string
) {
  const costPer1kInput = 0.00015;
  const costPer1kOutput = 0.0006;
  const costUSD =
    (inputTokens / 1000) * costPer1kInput +
    (outputTokens / 1000) * costPer1kOutput;

  await db.aiGeneration.create({
    data: {
      workspaceId,
      userId,
      type,
      inputTokens,
      outputTokens,
      costUSD,
      model: AI_MODEL,
      prompt,
      result,
    },
  });
}

export async function checkAiLimit(
  workspaceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = await db.aiUsageLimit.findUnique({
    where: { workspaceId },
  });

  if (!limit) {
    return { allowed: true, remaining: 5 };
  }

  const now = new Date();
  if (now > limit.resetAt) {
    await db.aiUsageLimit.update({
      where: { workspaceId },
      data: { usedThisMonth: 0, resetAt: getNextMonth() },
    });
    return { allowed: true, remaining: limit.monthlyLimit };
  }

  return {
    allowed: limit.usedThisMonth < limit.monthlyLimit,
    remaining: Math.max(0, limit.monthlyLimit - limit.usedThisMonth),
  };
}

function getNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
