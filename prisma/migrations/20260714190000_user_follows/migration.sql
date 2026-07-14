CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "followedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserFollow_no_self_follow" CHECK ("followerUserId" <> "followedUserId")
);

CREATE UNIQUE INDEX "UserFollow_followerUserId_followedUserId_key"
ON "UserFollow"("followerUserId", "followedUserId");

CREATE INDEX "UserFollow_followerUserId_createdAt_idx"
ON "UserFollow"("followerUserId", "createdAt");

CREATE INDEX "UserFollow_followedUserId_createdAt_idx"
ON "UserFollow"("followedUserId", "createdAt");

ALTER TABLE "UserFollow"
ADD CONSTRAINT "UserFollow_followerUserId_fkey"
FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow"
ADD CONSTRAINT "UserFollow_followedUserId_fkey"
FOREIGN KEY ("followedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
