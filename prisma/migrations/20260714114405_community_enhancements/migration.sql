-- AlterTable
ALTER TABLE "CommunityComment" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "linkDescription" TEXT,
ADD COLUMN     "linkImageUrl" TEXT,
ADD COLUMN     "linkTitle" TEXT;

-- CreateTable
CREATE TABLE "CommunityPostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostImage_pkey" PRIMARY KEY ("id")
);

-- Preserve every image published before multi-image posts were introduced.
INSERT INTO "CommunityPostImage" ("id", "postId", "url", "sortOrder")
SELECT 'legacy_' || md5("id"), "id", "imageUrl", 0
FROM "CommunityPost"
WHERE "imageUrl" IS NOT NULL;

-- CreateIndex
CREATE INDEX "CommunityPostImage_postId_idx" ON "CommunityPostImage"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPostImage_postId_sortOrder_key" ON "CommunityPostImage"("postId", "sortOrder");

-- CreateIndex
CREATE INDEX "CommunityComment_parentId_status_createdAt_idx" ON "CommunityComment"("parentId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityPostImage" ADD CONSTRAINT "CommunityPostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
