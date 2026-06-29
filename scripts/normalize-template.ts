/**
 * normalize-template.ts
 *
 * Cleans and normalizes raw email HTML before storing in the database:
 *  1. Inlines all CSS (critical for email client compatibility)
 *  2. Replaces source-specific tokens with Loopra merge tags
 *  3. Strips HTML comments
 */

import juice from "juice";

export type NormalizedTemplate = {
  html: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  industry: string;
};

type NormalizeMeta = {
  name: string;
  slug: string;
  category: string;
  description: string;
  industry: string;
};

/**
 * Takes raw HTML from a template source and returns a normalized version
 * ready for database insertion.
 */
export function normalizeTemplate(
  rawHtml: string,
  meta: NormalizeMeta
): NormalizedTemplate {
  // 1. Inline all CSS — critical for email client compatibility
  let html = juice(rawHtml, {
    removeStyleTags: true,
    preserveMediaQueries: true,
    preserveFontFaces: true,
  });

  // 2. Replace Postmark-style tokens with Loopra merge tags
  html = html
    .replace(/\{\{product_name\}\}/g, "{{company_name}}")
    .replace(/\{\{product_url\}\}/g, "{{company_url}}")
    .replace(/\{\{action_url\}\}/g, "{{cta_url}}")
    .replace(/\{\{support_url\}\}/g, "{{support_link}}")
    .replace(/\{\{support_email\}\}/g, "{{support_email}}")
    .replace(/\{\{login_url\}\}/g, "{{login_url}}")
    .replace(/\{\{name\}\}/g, "{{first_name}}")
    .replace(/\{\{sender_name\}\}/g, "{{sender_name}}")
    .replace(/\{\{company_name\}\}/g, "{{company_name}}")
    .replace(/\{\{company_address\}\}/g, "{{company_address}}")
    .replace(/\{\{help_url\}\}/g, "{{support_link}}")
    .replace(/\{\{billing_url\}\}/g, "{{billing_link}}")
    .replace(/\{\{close_account_url\}\}/g, "{{account_deletion_url}}")
    .replace(/\{\{feedback_url\}\}/g, "{{feedback_url}}")
    .replace(/\{\{export_url\}\}/g, "{{export_link}}")
    .replace(/\{\{invoice_url\}\}/g, "{{invoice_link}}")
    .replace(/\{\{trial_extension_url\}\}/g, "{{trial_extension_url}}")
    .replace(/\[UNSUBSCRIBE\]/g, "{{unsubscribe_url}}")
    .replace(/\[WEBVIEW\]/g, "{{webview_url}}");

  // 3. Strip HTML comments (but preserve conditional comments for Outlook)
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");

  // 4. Trim excessive whitespace
  html = html.replace(/\n{3,}/g, "\n\n").trim();

  return {
    html,
    name: meta.name,
    slug: meta.slug,
    category: meta.category,
    description: meta.description,
    industry: meta.industry,
  };
}
