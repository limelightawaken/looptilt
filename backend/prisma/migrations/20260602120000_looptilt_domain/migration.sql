-- CreateEnum
CREATE TYPE "EspProvider" AS ENUM ('NONE', 'KIT', 'BEEHIIV', 'KLAVIYO', 'MAILCHIMP');

-- CreateEnum
CREATE TYPE "FingerprintStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED');

-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "espProvider" "EspProvider" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_issues" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archive_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_fingerprints" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "status" "FingerprintStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "topics" JSONB,
    "voice" JSONB,
    "audience" JSONB,
    "depthFormat" JSONB,
    "obsessions" JSONB,
    "summary" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghostwriter_drafts" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "fingerprintId" TEXT,
    "title" TEXT NOT NULL,
    "outline" JSONB,
    "content" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ghostwriter_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esp_connections" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "provider" "EspProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletters_userId_idx" ON "newsletters"("userId");

-- CreateIndex
CREATE INDEX "archive_issues_newsletterId_idx" ON "archive_issues"("newsletterId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_fingerprints_newsletterId_key" ON "newsletter_fingerprints"("newsletterId");

-- CreateIndex
CREATE INDEX "ghostwriter_drafts_newsletterId_idx" ON "ghostwriter_drafts"("newsletterId");

-- CreateIndex
CREATE UNIQUE INDEX "esp_connections_newsletterId_key" ON "esp_connections"("newsletterId");

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_issues" ADD CONSTRAINT "archive_issues_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_fingerprints" ADD CONSTRAINT "newsletter_fingerprints_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghostwriter_drafts" ADD CONSTRAINT "ghostwriter_drafts_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghostwriter_drafts" ADD CONSTRAINT "ghostwriter_drafts_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "newsletter_fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esp_connections" ADD CONSTRAINT "esp_connections_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
