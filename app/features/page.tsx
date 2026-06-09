import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Users, Mail, FormInput, GitFork, BarChart3, Sparkles, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Mail,
    title: "Newsletter Campaigns",
    description: "Create and send beautiful newsletters with our intuitive editor. Support for rich text, HTML, and templates.",
    details: [
      "WYSIWYG and HTML mode",
      "Template library",
      "Schedule sending",
      "A/B testing",
      "Open and click tracking",
    ],
  },
  {
    icon: Users,
    title: "Audience Management",
    description: "Manage your subscribers with powerful tools for segmentation and growth tracking.",
    details: [
      "Subscriber import/export",
      "Custom fields and tags",
      "Dynamic segments",
      "Engagement tracking",
      "Growth analytics",
    ],
  },
  {
    icon: FormInput,
    title: "Form Builder",
    description: "Capture subscribers with customizable forms that embed anywhere.",
    details: [
      "Drag-and-drop builder",
      "Custom fields",
      "Embed scripts",
      "Hosted form pages",
      "Spam protection",
    ],
  },
  {
    icon: GitFork,
    title: "Automation Loops",
    description: "Build visual automation workflows that respond to subscriber actions.",
    details: [
      "Trigger-based automation",
      "Email sequences",
      "Conditional logic",
      "Delay actions",
      "Tag management",
    ],
  },
  {
    icon: Sparkles,
    title: "AI Content Generation",
    description: "Generate newsletter content, subject lines, and templates with AI assistance.",
    details: [
      "Newsletter generation",
      "Subject line suggestions",
      "Tone adjustment",
      "Template creation",
      "Content ideas",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track performance with detailed analytics and actionable insights.",
    details: [
      "Dashboard KPIs",
      "Campaign analytics",
      "Subscriber growth charts",
      "Form conversion rates",
      "Export reports",
    ],
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your data is protected with industry-standard security practices.",
    details: [
      "SSL encryption",
      "Multi-tenant isolation",
      "GDPR compliant",
      "Data backups",
      "Access controls",
    ],
  },
  {
    icon: Zap,
    title: "Integrations",
    description: "Connect Loopra with your favorite tools and services.",
    details: [
      "API access",
      "Webhook support",
      "Flutterwave payments",
      "Resend email delivery",
      "Custom integrations",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="container py-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Everything you need in one platform
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Loopra combines audience management, email campaigns, automation, and analytics
            into a single, easy-to-use platform.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border rounded-lg p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--color-primary-color-0)" }}
                >
                  <feature.icon
                    className="h-5 w-5"
                    style={{ color: "var(--color-role-primary)" }}
                  />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--color-role-accent)" }}
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
