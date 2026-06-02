/*
  Warnings:

  - You are about to drop the column `newsletterId` on the `content_blocks` table. All the data in the column will be lost.
  - Added the required column `sendId` to the `content_blocks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentBlockKind" AS ENUM ('CONTENT', 'LINK', 'IMAGE', 'PROMOTION', 'INSTRUCTION');

-- DropForeignKey
ALTER TABLE "content_blocks" DROP CONSTRAINT "content_blocks_newsletterId_fkey";

-- DropIndex
DROP INDEX "content_blocks_newsletterId_idx";

-- AlterTable
ALTER TABLE "content_blocks" DROP COLUMN "newsletterId",
ADD COLUMN     "kind" "ContentBlockKind" NOT NULL DEFAULT 'CONTENT',
ADD COLUMN     "sendId" TEXT NOT NULL,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "intent" DROP NOT NULL,
ALTER COLUMN "body" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "content_blocks_sendId_idx" ON "content_blocks"("sendId");

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;
