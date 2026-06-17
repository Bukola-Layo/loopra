import { PrismaClient } from "@prisma/client";

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

  // Seed email templates
  const templates = [
    {
      name: "Welcome Email",
      slug: "welcome-email",
      description: "A warm welcome email for new subscribers",
      category: "Onboarding",
      industry: "General",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h1 style="color: #dd2d4a;">Welcome aboard!</h1>
<p>We're excited to have you join our community. Here's what you can expect:</p>
<ul>
  <li>Regular updates and insights</li>
  <li>Exclusive offers and content</li>
  <li>Tips to get the most out of our platform</li>
</ul>
<p>If you have any questions, just reply to this email.</p>
<p style="color: #666;">The Team</p>
</div>`,
      isPublished: true,
    },
    {
      name: "Product Announcement",
      slug: "product-announcement",
      description: "Announce a new product or feature launch",
      category: "Announcement",
      industry: "SaaS",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h1 style="color: #dd2d4a;">Introducing Our Latest Feature</h1>
<p>We've been working hard to bring you something new. Something that will change the way you work.</p>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h2 style="margin-top: 0;">Feature Name</h2>
  <p>Brief description of the feature and its benefits.</p>
</div>
<p>Ready to try it? <a href="#" style="color: #dd2d4a;">Get started now</a></p>
</div>`,
      isPublished: true,
    },
    {
      name: "Monthly Newsletter",
      slug: "monthly-newsletter",
      description: "A clean monthly newsletter template",
      category: "Newsletter",
      industry: "General",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dd2d4a;">
  <h1 style="color: #dd2d4a; margin: 0;">Monthly Update</h1>
  <p style="color: #666;">Your monthly roundup of news and updates</p>
</div>
<div style="padding: 20px 0;">
  <h2>This Month's Highlights</h2>
  <p>Content goes here...</p>
</div>
<div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
  <p>You're receiving this because you subscribed to our newsletter.</p>
  <p><a href="#" style="color: #999;">Unsubscribe</a></p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Event Invitation",
      slug: "event-invitation",
      description: "Invite subscribers to your next webinar or event",
      category: "Events",
      industry: "General",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="text-align: center; padding: 30px 0;">
  <h1 style="color: #dd2d4a; margin: 0;">You're Invited!</h1>
</div>
<div style="text-align: center; padding: 20px; background: #fafafa; border-radius: 8px; margin: 10px 0;">
  <h2 style="margin-top: 0;">Event Title Here</h2>
  <p style="color: #666;">Date: January 15, 2026</p>
  <p style="color: #666;">Time: 2:00 PM EST</p>
  <a href="#" style="display: inline-block; background: #dd2d4a; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 10px;">RSVP Now</a>
</div>
<p>We'd love to see you there! Space is limited, so reserve your spot today.</p>
<div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
  <p><a href="#" style="color: #999;">Unsubscribe</a></p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Promo Offer",
      slug: "promo-offer",
      description: "A bold promotional email with discount offers",
      category: "Marketing",
      industry: "E-commerce",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #dd2d4a; color: #fff; text-align: center; padding: 40px 20px; border-radius: 8px 8px 0 0;">
  <h1 style="margin: 0; font-size: 32px;">50% OFF</h1>
  <p style="font-size: 18px; margin-top: 8px;">Limited Time Offer</p>
</div>
<div style="padding: 30px 20px; background: #fff;">
  <p>Don't miss out on our biggest sale of the year! For a limited time, enjoy 50% off all products.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="display: inline-block; background: #2cadc0; color: #fff; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Shop Now</a>
  </div>
  <p style="color: #666; font-size: 14px;">Offer expires January 31, 2026. Cannot be combined with other offers.</p>
</div>
<div style="text-align: center; padding: 20px; background: #f5f5f5; border-radius: 0 0 8px 8px; color: #999; font-size: 12px;">
  <p><a href="#" style="color: #999;">Unsubscribe</a> | <a href="#" style="color: #999;">View in browser</a></p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Feedback Request",
      slug: "feedback-request",
      description: "Politely ask subscribers for their feedback",
      category: "Engagement",
      industry: "SaaS",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="padding: 30px 20px;">
  <h1 style="color: #dd2d4a;">We'd Love Your Feedback</h1>
  <p>Hi there,</p>
  <p>Your opinion matters to us. We're always looking to improve, and we'd be grateful if you could take a moment to share your thoughts.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="display: inline-block; background: #dd2d4a; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Take Survey</a>
  </div>
  <p style="color: #666; font-size: 14px;">It takes less than 2 minutes. Your responses are anonymous.</p>
  <p>Thank you for helping us improve!</p>
  <p style="color: #999;">— The Team</p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Re-engagement",
      slug: "re-engagement",
      description: "Win back inactive subscribers",
      category: "Engagement",
      industry: "General",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="text-align: center; padding: 30px 20px;">
  <h1 style="color: #dd2d4a;">We Miss You!</h1>
  <p style="font-size: 18px; color: #666;">It's been a while since we last heard from you.</p>
</div>
<div style="padding: 20px; background: #fafafa; border-radius: 8px; margin: 10px 0;">
  <p>We'd love to have you back! Here's a special offer just for you:</p>
  <div style="text-align: center; margin: 20px 0;">
    <div style="background: #2cadc0; color: #fff; padding: 8px 24px; border-radius: 4px; display: inline-block; font-weight: 700; font-size: 24px;">20% OFF</div>
  </div>
  <p>Use code <strong>WELCOME20</strong> on your next purchase. Valid for 7 days.</p>
</div>
<div style="text-align: center; padding: 16px;">
  <a href="#" style="display: inline-block; background: #dd2d4a; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Claim Offer</a>
</div>
<div style="text-align: center; padding: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
  <p>Not interested? <a href="#" style="color: #999;">Unsubscribe</a></p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Password Reset",
      slug: "password-reset",
      description: "Secure password reset email for auth flows",
      category: "Transactional",
      industry: "SaaS",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="padding: 30px 20px;">
  <h1 style="color: #dd2d4a;">Reset Your Password</h1>
  <p>We received a request to reset the password for your account.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="display: inline-block; background: #dd2d4a; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reset Password</a>
  </div>
  <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL: <br/><span style="color: #666;">https://loopra.app/reset-password?token=abc123</span></p>
</div>
</div>`,
      isPublished: true,
    },
    {
      name: "Weekly Digest",
      slug: "weekly-digest",
      description: "Curated weekly content roundup for your subscribers",
      category: "Newsletter",
      industry: "Media",
      source: "OFFICIAL" as const,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="border-bottom: 3px solid #dd2d4a; padding: 20px 0; text-align: center;">
  <h1 style="color: #333; margin: 0;">Weekly Digest</h1>
  <p style="color: #999; font-size: 14px;">Week of January 12, 2026</p>
</div>
<div style="padding: 20px 0;">
  <div style="margin-bottom: 24px;">
    <h2 style="color: #dd2d4a;">Top Story</h2>
    <h3>How to Grow Your Audience in 2026</h3>
    <p style="color: #666;">Actionable strategies to build and nurture your email list this year.</p>
    <a href="#" style="color: #dd2d4a;">Read more →</a>
  </div>
  <div style="margin-bottom: 24px;">
    <h2 style="color: #dd2d4a;">Product Updates</h2>
    <h3>New Features Released This Week</h3>
    <p style="color: #666;">Check out the latest improvements we've shipped.</p>
    <a href="#" style="color: #dd2d4a;">Learn more →</a>
  </div>
  <div style="margin-bottom: 24px;">
    <h2 style="color: #dd2d4a;">From the Blog</h2>
    <h3>5 Email Marketing Tips That Actually Work</h3>
    <p style="color: #666;">Proven techniques to boost your open and click rates.</p>
    <a href="#" style="color: #dd2d4a;">Read article →</a>
  </div>
</div>
<div style="text-align: center; padding: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
  <p><a href="#" style="color: #999;">Unsubscribe</a> | <a href="#" style="color: #999;">Manage preferences</a></p>
</div>
</div>`,
      isPublished: true,
    },
  ];

  for (const template of templates) {
    await db.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }

  console.log("Seed complete!");
  console.log(`  - ${[freePlan, proPlan, businessPlan].length} subscription plans`);
  console.log(`  - ${templates.length} email templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
