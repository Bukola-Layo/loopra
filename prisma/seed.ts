import { PrismaClient } from "@prisma/client";
import { seedEmailTemplates } from "../scripts/seed-templates";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create subscription plans
  const freePlan = await db.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      price: 0,
      currency: "USD",
      billingCycle: "monthly",
      features: ["Up to 500 subscribers", "1 workspace", "Basic analytics"],
      limits: { subscribers: 500, workspaces: 1, campaignsPerMonth: 5 },
    },
  });

  const proPlan = await db.subscriptionPlan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      price: 29,
      currency: "USD",
      billingCycle: "monthly",
      features: [
        "Up to 5,000 subscribers",
        "3 workspaces",
        "Advanced analytics",
        "AI content generation",
      ],
      limits: {
        subscribers: 5000,
        workspaces: 3,
        campaignsPerMonth: 50,
        aiGenerations: 100,
      },
    },
  });

  const businessPlan = await db.subscriptionPlan.upsert({
    where: { slug: "business" },
    update: {},
    create: {
      name: "Business",
      slug: "business",
      price: 79,
      currency: "USD",
      billingCycle: "monthly",
      features: [
        "Up to 50,000 subscribers",
        "Unlimited workspaces",
        "Premium analytics",
        "Priority support",
        "Unlimited AI generations",
      ],
      limits: {
        subscribers: 50000,
        workspaces: -1,
        campaignsPerMonth: -1,
        aiGenerations: -1,
      },
    },
  });

  // Seed email templates from Postmark & Cerberus
  await seedEmailTemplates(db);

  console.log("Seed complete!");
  console.log(`  - ${[freePlan, proPlan, businessPlan].length} subscription plans`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
