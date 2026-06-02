-- CreateEnum
CREATE TYPE "EspAuthMethod" AS ENUM ('API_KEY', 'OAUTH');

-- AlterTable
ALTER TABLE "esp_connections" ADD COLUMN     "authMethod" "EspAuthMethod" NOT NULL DEFAULT 'API_KEY',
ADD COLUMN     "oauthAccessTokenEncrypted" TEXT,
ADD COLUMN     "oauthRefreshTokenEncrypted" TEXT,
ADD COLUMN     "oauthScope" TEXT,
ADD COLUMN     "oauthTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "esp_oauth_states" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esp_oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "esp_oauth_states_state_key" ON "esp_oauth_states"("state");

-- CreateIndex
CREATE INDEX "esp_oauth_states_expiresAt_idx" ON "esp_oauth_states"("expiresAt");
