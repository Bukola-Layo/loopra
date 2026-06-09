import Link from "next/link";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="container py-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
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
                  ? "border-primary shadow-lg scale-105"
                  : ""
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
      </section>
    </MarketingLayout>
  );
}
