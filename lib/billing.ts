import { db } from "@/lib/db";

type PlanLimits = {
  subscribers: number;
  workspaces: number;
  campaignsPerMonth: number;
  aiGenerations: number;
};

type PlanFeatures = {
  name: string;
  slug: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  limits: PlanLimits;
};

export async function getWorkspacePlan(workspaceId: string): Promise<{
  plan: PlanFeatures | null;
  usage: {
    subscribers: number;
    workspaces: number;
    campaignsPerMonth: number;
    aiGenerations: number;
  };
}> {
  const [subscription, subscriberCount, workspaceCount, campaignCount, aiCount] =
    await Promise.all([
      db.subscription.findFirst({
        where: { workspaceId, status: "active" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      db.subscriber.count({ where: { workspaceId } }),
      db.workspaceMember.count({ where: { workspaceId } }),
      db.campaign.count({
        where: {
          workspaceId,
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      db.aiGeneration.count({
        where: {
          workspaceId,
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
    ]);

  const plan = subscription?.plan;
  const limits = (plan?.limits ?? {}) as Record<string, number>;
  const features = (plan?.features ?? []) as string[];

  return {
    plan: plan
      ? {
          name: plan.name,
          slug: plan.slug,
          price: Number(plan.price),
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          features,
          limits: {
            subscribers: limits.subscribers ?? 500,
            workspaces: limits.workspaces ?? 1,
            campaignsPerMonth: limits.campaignsPerMonth ?? 5,
            aiGenerations: limits.aiGenerations ?? 0,
          },
        }
      : null,
    usage: {
      subscribers: subscriberCount,
      workspaces: workspaceCount,
      campaignsPerMonth: campaignCount,
      aiGenerations: aiCount,
    },
  };
}

export async function checkPlanLimit(
  workspaceId: string,
  resource: keyof PlanLimits,
  increment = 1
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const { plan, usage } = await getWorkspacePlan(workspaceId);

  if (!plan) {
    return { allowed: false, limit: 0, current: 0 };
  }

  const limit = plan.limits[resource];
  const current = usage[resource];

  if (limit === -1) {
    return { allowed: true, limit, current };
  }

  return {
    allowed: current + increment <= limit,
    limit,
    current,
  };
}

export function canUpgrade(
  currentSlug: string,
  targetSlug: string
): boolean {
  const tiers = ["free", "starter", "pro", "business"];
  const currentIdx = tiers.indexOf(currentSlug);
  const targetIdx = tiers.indexOf(targetSlug);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx > currentIdx;
}

export function canDowngrade(
  currentSlug: string,
  targetSlug: string
): boolean {
  const tiers = ["free", "starter", "pro", "business"];
  const currentIdx = tiers.indexOf(currentSlug);
  const targetIdx = tiers.indexOf(targetSlug);
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx < currentIdx;
}

export function getPlanTier(slug: string): number {
  const tiers: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    business: 3,
  };
  return tiers[slug] ?? 0;
}
