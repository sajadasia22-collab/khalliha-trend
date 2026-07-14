-- Phase 14: professional creator profiles.
-- Username stays nullable so existing creators can claim one without a destructive backfill.
ALTER TABLE "CreatorProfile"
ADD COLUMN "username" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "coverUrl" TEXT,
ADD COLUMN "contentCategories" "CampaignCategory"[] NOT NULL DEFAULT ARRAY[]::"CampaignCategory"[],
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "isProfilePublic" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "CreatorProfile_username_key" ON "CreatorProfile"("username");
