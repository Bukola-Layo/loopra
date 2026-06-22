import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Mail, GitFork, BarChart3, Check } from "lucide-react";
import { FaqItem } from "@/components/marketing/faq-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const features = [
  {
    icon: Mail,
    title: "Newsletter Campaigns",
    description: "Create beautiful newsletters with our drag-and-drop editor. Schedule, send, and track engagement.",
  },
  {
    icon: Users,
    title: "Audience Management",
    description: "Grow your subscriber list with forms and embeds. Segment your audience for targeted campaigns.",
  },
  {
    icon: GitFork,
    title: "Automation Loops",
    description: "Build visual automation workflows triggered by subscriber actions. No coding required.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track opens, clicks, and subscriber growth. Make data-driven decisions for your content.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Up to 1,000 subscribers",
      "1 form",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Starter",
    price: "$9",
    description: "For growing audiences",
    features: [
      "Up to 10,000 subscribers",
      "5 forms",
      "Automation Loops",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Pro",
    price: "$49",
    description: "For power users",
    features: [
      "Up to 100,000 subscribers",
      "Unlimited forms",
      "AI content generation",
      "Custom templates",
      "API access",
      "Dedicated support",
    ],
    cta: "Start free trial",
    href: "/signup",
  },
];

export default function LandingPage() {
  return (
    <MarketingLayout>
      <section className="container py-24 md:py-32 animate-fade-in-up">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-float">
            The easiest way to grow and automate{" "}
            <span style={{ color: "var(--color-role-primary)" }}>
              audience communication
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Loopra helps creators, startups, and small businesses collect subscribers,
            send newsletters, and build automation workflows — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t py-24 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to grow your audience
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From subscriber capture to analytics, Loopra provides a complete toolkit
              for audience communication.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-xl p-px transition-transform duration-300 hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(236,57,82,0.15), rgba(236,57,82,0.05), rgba(44,173,192,0.15))",
                }}
              >
                <div className="space-y-4 rounded-xl bg-background p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--color-primary-color-0)" }}
                  >
                    <feature.icon
                      className="h-6 w-6"
                      style={{ color: "var(--color-role-primary)" }}
                    />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t py-24 bg-muted/30 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose the plan that fits your needs. No hidden fees. Upgrade or cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-lg md:scale-105 bg-background"
                    : "bg-background/50"
                }`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--color-role-primary)" }}
                  >
                    Most popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "$0" && (
                      <span className="text-muted-foreground ml-1">/mo</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={plan.href} className="w-full">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t py-24 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
        <div className="container max-w-3xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about Loopra.
            </p>
          </div>
          <div className="space-y-3">
            <FaqItem
              question="What is Loopra?"
              answer="Loopra is a communication automation platform for creators, startups, and small businesses. It lets you collect subscribers, send newsletters, build automation workflows, segment audiences, and track engagement — all without coding."
            />
            <FaqItem
              question="Is there a free plan?"
              answer="Yes! Our Free plan supports up to 1,000 subscribers with basic analytics and email support. No credit card required to get started."
            />
            <FaqItem
              question="Can I send emails to my existing subscribers?"
              answer="Absolutely. You can import your existing subscriber list via CSV or connect with popular tools. We handle deduplication and ensure compliance with email regulations."
            />
            <FaqItem
              question="What are Automation Loops?"
              answer="Loops are visual automation workflows that trigger based on subscriber actions — like signing up, clicking a link, or opening an email. You can build multi-step sequences without any coding."
            />
            <FaqItem
              question="Can I create custom email templates?"
              answer="Yes. Use our drag-and-drop visual editor to design beautiful emails. You can start from pre-built library templates or create your own from scratch."
            />
            <FaqItem
              question="How does AI content generation work?"
              answer="Describe the email you want, and our AI generates a complete design with text and layout. You can then customize every block in the visual editor."
            />
            <FaqItem
              question="Can I upgrade or cancel anytime?"
              answer="Yes. You can upgrade, downgrade, or cancel your subscription at any time. If you cancel, you'll retain access to paid features until the end of your billing period."
            />
            <FaqItem
              question="Is my data secure?"
              answer="We take security seriously. All data is encrypted in transit and at rest. We use industry-standard practices and never share your data with third parties."
            />
          </div>
        </div>
      </section>

      <section className="border-t py-24 animate-fade-in-up" style={{ animationDelay: "0.8s", backgroundColor: "var(--color-primary-color-0)" }}>
        <div className="container text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to simplify your audience communication?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of creators and businesses using Loopra to grow their audience.
            Start free, no credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start building for free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
