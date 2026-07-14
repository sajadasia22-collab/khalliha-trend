CREATE TABLE "CreatorPortfolioItem" (
    "id" TEXT NOT NULL,
    "creatorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" "Platform" NOT NULL,
    "projectUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorPortfolioItem_creatorProfileId_projectUrl_key"
ON "CreatorPortfolioItem"("creatorProfileId", "projectUrl");

CREATE INDEX "CreatorPortfolioItem_creatorProfileId_sortOrder_createdAt_idx"
ON "CreatorPortfolioItem"("creatorProfileId", "sortOrder", "createdAt");

ALTER TABLE "CreatorPortfolioItem"
ADD CONSTRAINT "CreatorPortfolioItem_creatorProfileId_fkey"
FOREIGN KEY ("creatorProfileId") REFERENCES "CreatorProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
