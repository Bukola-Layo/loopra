/**
 * Template mapping — defines which source files map to which
 * EmailTemplate records and their metadata.
 */

export type TemplateEntry = {
  /** Relative path inside the source directory */
  file: string;
  /** Display name */
  name: string;
  /** Category (title-cased to match existing seed data) */
  category: string;
  /** URL-safe slug (must be unique) */
  slug: string;
  /** Short description for the library card */
  description: string;
  /** Industry tag */
  industry: string;
};

// ─── Postmark Templates ─────────────────────────────────────────────────────
// Located under raw-templates/postmark-templates/templates-inlined/{variant}/<dir>/content.html
// We use the "basic" variant (clean, minimal CSS-inlined templates).

export const POSTMARK_TEMPLATES: TemplateEntry[] = [
  {
    file: "welcome/content.html",
    name: "Welcome Email",
    category: "Onboarding",
    slug: "postmark-welcome",
    description:
      "A warm, professional welcome email for new subscribers with a clear call-to-action.",
    industry: "General",
  },
  {
    file: "password-reset/content.html",
    name: "Password Reset",
    category: "Transactional",
    slug: "postmark-password-reset",
    description:
      "Secure password reset email with a time-limited action link.",
    industry: "SaaS",
  },
  {
    file: "receipt/content.html",
    name: "Purchase Receipt",
    category: "Transactional",
    slug: "postmark-receipt",
    description:
      "Clean purchase receipt with line items and order summary.",
    industry: "E-commerce",
  },
  {
    file: "invoice/content.html",
    name: "Invoice",
    category: "Transactional",
    slug: "postmark-invoice",
    description:
      "Professional invoice email with billing details and payment link.",
    industry: "General",
  },
  {
    file: "comment-notification/content.html",
    name: "Comment Notification",
    category: "Notification",
    slug: "postmark-comment-notification",
    description:
      "Notify users about new comments or replies on their content.",
    industry: "SaaS",
  },
  {
    file: "trial-expiring/content.html",
    name: "Trial Expiring",
    category: "Notification",
    slug: "postmark-trial-expiring",
    description:
      "Alert users that their free trial is about to end with an upgrade CTA.",
    industry: "SaaS",
  },
  {
    file: "dunning/content.html",
    name: "Payment Failed",
    category: "Transactional",
    slug: "postmark-payment-failed",
    description:
      "Notify customers about a failed payment with instructions to update billing details.",
    industry: "E-commerce",
  },
  {
    file: "trial-expired/content.html",
    name: "Trial Ended",
    category: "Notification",
    slug: "postmark-trial-ended",
    description:
      "Inform users their trial has ended with options to upgrade or extend.",
    industry: "SaaS",
  },
  {
    file: "user-invitation/content.html",
    name: "User Invitation",
    category: "Onboarding",
    slug: "postmark-user-invitation",
    description:
      "Invite a teammate or collaborator to join your workspace.",
    industry: "SaaS",
  },
];

// ─── Cerberus Patterns ──────────────────────────────────────────────────────
// Located under raw-templates/Cerberus/<file>.html

export const CERBERUS_TEMPLATES: TemplateEntry[] = [
  {
    file: "cerberus-fluid.html",
    name: "Fluid Starter",
    category: "Starter",
    slug: "cerberus-fluid",
    description:
      "Single-column fluid layout that works everywhere — a blank canvas for custom designs.",
    industry: "General",
  },
  {
    file: "cerberus-hybrid.html",
    name: "Hybrid Starter",
    category: "Starter",
    slug: "cerberus-hybrid",
    description:
      "Multi-column layout without media queries — great for hybrid responsive emails.",
    industry: "General",
  },
  {
    file: "cerberus-responsive.html",
    name: "Responsive Starter",
    category: "Starter",
    slug: "cerberus-responsive",
    description:
      "Full responsive email starter with media queries for modern email clients.",
    industry: "General",
  },
];
