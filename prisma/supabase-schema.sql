-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('active', 'unsubscribed', 'bounced');

-- CreateEnum
CREATE TYPE "SubscriberSource" AS ENUM ('manual', 'import', 'form', 'website_form', 'instagram', 'facebook', 'newsletter', 'api', 'page', 'other');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('html', 'markdown');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "AfterSubscribeAction" AS ENUM ('none', 'welcome_email', 'start_loop');

-- CreateEnum
CREATE TYPE "LoopStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "LoopTriggerType" AS ENUM ('form_submission', 'tag_added', 'subscriber_created', 'campaign_opened', 'campaign_clicked');

-- CreateEnum
CREATE TYPE "LoopActionType" AS ENUM ('send_email', 'delay', 'apply_tag', 'remove_tag', 'condition', 'webhook');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'past_due');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "TemplateSource" AS ENUM ('OFFICIAL', 'AI_GENERATED', 'INDUSTRY', 'USER_TEMPLATE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "pageId" UUID,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'active',
    "source" "SubscriberSource" NOT NULL DEFAULT 'manual',
    "customFields" JSONB,
    "lastEngagedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_tags" (
    "id" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "subscriber_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_members" (
    "id" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    CONSTRAINT "segment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "pageId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'active',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "validation" JSONB,
    "options" JSONB,
    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "subscriberId" UUID,
    "data" JSONB,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_pages" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "template" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'draft',
    "settings" JSONB,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "showSubscriberCount" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriber_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "contentType" "ContentType" NOT NULL DEFAULT 'html',
    "templateId" UUID,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "sendAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_sends" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "campaign_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "linkClicked" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loops" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "LoopStatus" NOT NULL DEFAULT 'disabled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loop_triggers" (
    "id" UUID NOT NULL,
    "loopId" UUID NOT NULL,
    "type" "LoopTriggerType" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loop_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loop_actions" (
    "id" UUID NOT NULL,
    "loopId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "LoopActionType" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loop_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loop_executions" (
    "id" UUID NOT NULL,
    "loopId" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "ExecutionStatus" NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    CONSTRAINT "loop_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loop_event_logs" (
    "id" UUID NOT NULL,
    "executionId" UUID NOT NULL,
    "actionId" UUID NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loop_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT,
    "thumbnail" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "industry" TEXT,
    "source" "TemplateSource" NOT NULL DEFAULT 'OFFICIAL',
    "html" TEXT,
    "thumbnail" TEXT,
    "aiPrompt" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_templates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "html" TEXT,
    "thumbnail" TEXT,
    "originalTemplateId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DECIMAL(10,6) NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_limits" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 5,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_usage_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "features" JSONB,
    "limits" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "flutterwaveReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" UUID,
    "resourceType" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_summaries" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "analytics_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_key" ON "verification_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_key" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_domain_key" ON "Workspace"("domain");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "subscribers_workspaceId_status_idx" ON "subscribers"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "subscribers_pageId_idx" ON "subscribers"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_workspaceId_email_key" ON "subscribers"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "subscriber_tags_subscriberId_tag_idx" ON "subscriber_tags"("subscriberId", "tag");

-- CreateIndex
CREATE INDEX "segments_workspaceId_idx" ON "segments"("workspaceId");

-- CreateIndex
CREATE INDEX "segment_members_segmentId_subscriberId_idx" ON "segment_members"("segmentId", "subscriberId");

-- CreateIndex
CREATE INDEX "forms_workspaceId_status_idx" ON "forms"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "forms_pageId_idx" ON "forms"("pageId");

-- CreateIndex
CREATE INDEX "subscriber_pages_workspaceId_status_idx" ON "subscriber_pages"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_pages_workspaceId_slug_key" ON "subscriber_pages"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "campaigns_workspaceId_status_idx" ON "campaigns"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "campaign_sends_campaignId_subscriberId_idx" ON "campaign_sends"("campaignId", "subscriberId");

-- CreateIndex
CREATE INDEX "campaign_events_campaignId_eventType_idx" ON "campaign_events"("campaignId", "eventType");

-- CreateIndex
CREATE INDEX "loops_workspaceId_status_idx" ON "loops"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "loop_triggers_loopId_key" ON "loop_triggers"("loopId");

-- CreateIndex
CREATE INDEX "loop_executions_loopId_subscriberId_status_idx" ON "loop_executions"("loopId", "subscriberId", "status");

-- CreateIndex
CREATE INDEX "loop_event_logs_executionId_idx" ON "loop_event_logs"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_slug_key" ON "email_templates"("slug");

-- CreateIndex
CREATE INDEX "ai_generations_workspaceId_createdAt_idx" ON "ai_generations"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_limits_workspaceId_key" ON "ai_usage_limits"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscriptions_workspaceId_status_idx" ON "subscriptions"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_flutterwaveReference_key" ON "payments"("flutterwaveReference");

-- CreateIndex
CREATE INDEX "analytics_events_workspaceId_eventType_timestamp_idx" ON "analytics_events"("workspaceId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "analytics_summaries_workspaceId_date_metric_idx" ON "analytics_summaries"("workspaceId", "date", "metric");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_read_createdAt_idx" ON "notifications"("workspaceId", "read", "createdAt");
