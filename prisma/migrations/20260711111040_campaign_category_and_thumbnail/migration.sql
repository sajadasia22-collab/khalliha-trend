-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM ('PRODUCT', 'BEAUTY', 'FOOD', 'FASHION', 'TECH', 'ENTERTAINMENT', 'GAMING', 'OTHER');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "category" "CampaignCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "thumbnailUrl" TEXT;

-- CreateIndex
CREATE INDEX "Campaign_category_idx" ON "Campaign"("category");
