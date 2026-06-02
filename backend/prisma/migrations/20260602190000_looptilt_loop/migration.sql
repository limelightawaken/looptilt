-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('LIVE_KIT', 'SIMULATOR');

-- CreateEnum
CREATE TYPE "SubscriberState" AS ENUM ('ACTIVE', 'BOUNCED', 'CANCELLED', 'COMPLAINED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('LINK_CLICK', 'OPEN', 'ACTIVATE', 'UNSUBSCRIBE', 'BOUNCE', 'COMPLAIN', 'FORM_SUBSCRIBE', 'TAG_ADD', 'TAG_REMOVE', 'POLL_ANSWER', 'RATE', 'MORE_LIKE_THIS', 'LESS_LIKE_THIS', 'REPLY');

-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('NEW', 'WARMING', 'ENGAGED', 'COOLING', 'DORMANT', 'REACTIVATED');

-- CreateEnum
CREATE TYPE "DepthPreference" AS ENUM ('UNKNOWN', 'SKIMMER', 'DEEP');

-- CreateEnum
CREATE TYPE "SegmentKind" AS ENUM ('DEFAULT_LIFECYCLE', 'DEFAULT_DEPTH', 'DEFAULT_AFFINITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'PUBLISHING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('PENDING', 'GENERATED', 'PUBLISHED', 'FAILED');

-- AlterTable
ALTER TABLE "newsletter_fingerprints" ADD COLUMN "generatedBy" TEXT;

-- AlterTable
ALTER TABLE "esp_connections" ADD COLUMN "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATOR',
ADD COLUMN "apiKeyEncrypted" TEXT,
ADD COLUMN "kitAccountId" TEXT,
ADD COLUMN "webhookIds" JSONB,
ADD COLUMN "customFieldKeyMap" JSONB;

-- CreateTable
CREATE TABLE "newsletter_topics" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "subTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "espSubscriberId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "state" "SubscriberState" NOT NULL DEFAULT 'ACTIVE',
    "source" "DataSource" NOT NULL,
    "signupTrigger" TEXT,
    "channel" TEXT,
    "referringNewsletter" TEXT,
    "signupContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_events" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "source" "DataSource" NOT NULL,
    "topicId" TEXT,
    "linkUrl" TEXT,
    "position" TEXT,
    "value" DOUBLE PRECISION,
    "rawPayload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reader_fingerprints" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "topicAffinities" JSONB NOT NULL,
    "depthPreference" "DepthPreference" NOT NULL DEFAULT 'UNKNOWN',
    "tonePreference" TEXT,
    "lifecycleStage" "LifecycleStage" NOT NULL DEFAULT 'NEW',
    "churnPropensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openRate" DOUBLE PRECISION,
    "signalCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reader_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SegmentKind" NOT NULL,
    "description" TEXT,
    "rationale" TEXT,
    "definition" JSONB,
    "kitTagId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_memberships" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segment_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "topicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sends" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SendStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_variants" (
    "id" TEXT NOT NULL,
    "sendId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "kitBroadcastId" TEXT,
    "status" "VariantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletter_topics_newsletterId_idx" ON "newsletter_topics"("newsletterId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_topics_newsletterId_slug_key" ON "newsletter_topics"("newsletterId", "slug");

-- CreateIndex
CREATE INDEX "subscribers_newsletterId_source_idx" ON "subscribers"("newsletterId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_newsletterId_email_key" ON "subscribers"("newsletterId", "email");

-- CreateIndex
CREATE INDEX "signal_events_newsletterId_source_idx" ON "signal_events"("newsletterId", "source");

-- CreateIndex
CREATE INDEX "signal_events_subscriberId_idx" ON "signal_events"("subscriberId");

-- CreateIndex
CREATE INDEX "signal_events_occurredAt_idx" ON "signal_events"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "reader_fingerprints_subscriberId_key" ON "reader_fingerprints"("subscriberId");

-- CreateIndex
CREATE INDEX "segments_newsletterId_idx" ON "segments"("newsletterId");

-- CreateIndex
CREATE INDEX "segment_memberships_subscriberId_idx" ON "segment_memberships"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "segment_memberships_segmentId_subscriberId_key" ON "segment_memberships"("segmentId", "subscriberId");

-- CreateIndex
CREATE INDEX "content_blocks_newsletterId_idx" ON "content_blocks"("newsletterId");

-- CreateIndex
CREATE INDEX "sends_newsletterId_idx" ON "sends"("newsletterId");

-- CreateIndex
CREATE UNIQUE INDEX "segment_variants_sendId_segmentId_key" ON "segment_variants"("sendId", "segmentId");

-- AddForeignKey
ALTER TABLE "newsletter_topics" ADD CONSTRAINT "newsletter_topics_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_events" ADD CONSTRAINT "signal_events_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_events" ADD CONSTRAINT "signal_events_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_events" ADD CONSTRAINT "signal_events_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "newsletter_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reader_fingerprints" ADD CONSTRAINT "reader_fingerprints_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_memberships" ADD CONSTRAINT "segment_memberships_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_memberships" ADD CONSTRAINT "segment_memberships_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_variants" ADD CONSTRAINT "segment_variants_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_variants" ADD CONSTRAINT "segment_variants_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
