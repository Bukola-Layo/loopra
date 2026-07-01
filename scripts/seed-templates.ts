/**
 * seed-templates.ts
 *
 * Reads raw HTML from cloned Postmark Templates and Cerberus repos,
 * normalizes each template, and upserts into the `email_templates` table.
 *
 * Usage:
 *   npx tsx scripts/seed-templates.ts
 *
 * Prerequisites:
 *   - Clone repos into raw-templates/ (see README)
 *   - pnpm add -D juice jsdom @types/jsdom
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { normalizeTemplate } from "./normalize-template";
import { htmlToBlocks } from "../lib/html-to-blocks";
import { serializeBlocks } from "../lib/email-builder";
import { POSTMARK_TEMPLATES, CERBERUS_TEMPLATES, CUSTOM_TEMPLATES } from "./template-map";

const BASE_DIRS = {
  postmark: path.resolve("raw-templates/postmark-templates/templates/basic"),
  cerberus: path.resolve("raw-templates/Cerberus"),
  custom: path.resolve("raw-templates/custom"),
};

export async function seedEmailTemplates(db: PrismaClient) {
  console.log("  Seeding email templates...\n");

  let seededCount = 0;
  let skippedCount = 0;

  // ─── Postmark Templates ──────────────────────────────────────────────
  console.log("  Processing Postmark Templates...");
  for (const entry of POSTMARK_TEMPLATES) {
    const filePath = path.join(BASE_DIRS.postmark, entry.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Not found: ${entry.file} — skipping "${entry.name}"`);
      skippedCount++;
      continue;
    }

    const rawHtml = fs.readFileSync(filePath, "utf-8");
    const normalized = normalizeTemplate(rawHtml, {
      name: entry.name,
      slug: entry.slug,
      category: entry.category,
      description: entry.description,
      industry: entry.industry,
    });

    const blocks = htmlToBlocks(normalized.html);
    const blocksJson = serializeBlocks(blocks);

    await db.emailTemplate.upsert({
      where: { slug: normalized.slug },
      update: {
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
      create: {
        slug: normalized.slug,
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
    });

    console.log(`  ✓ ${normalized.name} (${normalized.category})`);
    seededCount++;
  }

  // ─── Cerberus Patterns ────────────────────────────────────────────────
  console.log("  Processing Cerberus Patterns...");
  for (const entry of CERBERUS_TEMPLATES) {
    const filePath = path.join(BASE_DIRS.cerberus, entry.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Not found: ${filePath} — skipping "${entry.name}"`);
      skippedCount++;
      continue;
    }

    const rawHtml = fs.readFileSync(filePath, "utf-8");
    const normalized = normalizeTemplate(rawHtml, {
      name: entry.name,
      slug: entry.slug,
      category: entry.category,
      description: entry.description,
      industry: entry.industry,
    });

    const blocks = htmlToBlocks(normalized.html);
    const blocksJson = serializeBlocks(blocks);

    await db.emailTemplate.upsert({
      where: { slug: normalized.slug },
      update: {
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
      create: {
        slug: normalized.slug,
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
    });

    console.log(`  ✓ ${normalized.name} (${normalized.category})`);
    seededCount++;
  }

  // ─── Custom Templates ────────────────────────────────────────────────
  console.log("  Processing Custom Templates...");
  for (const entry of CUSTOM_TEMPLATES) {
    const filePath = path.join(BASE_DIRS.custom, entry.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  Not found: ${filePath} — skipping "${entry.name}"`);
      skippedCount++;
      continue;
    }

    const rawHtml = fs.readFileSync(filePath, "utf-8");
    const normalized = normalizeTemplate(rawHtml, {
      name: entry.name,
      slug: entry.slug,
      category: entry.category,
      description: entry.description,
      industry: entry.industry,
    });

    const blocks = htmlToBlocks(normalized.html);
    const blocksJson = serializeBlocks(blocks);

    await db.emailTemplate.upsert({
      where: { slug: normalized.slug },
      update: {
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
      create: {
        slug: normalized.slug,
        name: normalized.name,
        html: normalized.html,
        blocksJson,
        category: normalized.category,
        description: normalized.description,
        industry: normalized.industry,
        source: "OFFICIAL",
        isPublished: true,
      },
    });

    console.log(`  ✓ ${normalized.name} (${normalized.category})`);
    seededCount++;
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  Seeded: ${seededCount} templates`);
  if (skippedCount > 0) {
    console.log(`  Skipped: ${skippedCount} templates (files not found)`);
  }
}

// Run directly when executed as `npx tsx scripts/seed-templates.ts`
const isMain = process.argv[1]?.includes("seed-templates");
if (isMain) {
  const db = new PrismaClient();
  seedEmailTemplates(db)
    .catch((err: unknown) => {
      console.error("\n❌ Seed failed:", err);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
