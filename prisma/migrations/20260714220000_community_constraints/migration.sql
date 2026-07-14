ALTER TABLE "CommunityReport"
ADD CONSTRAINT "CommunityReport_exactly_one_target"
CHECK (num_nonnulls("postId", "commentId") = 1);

ALTER TABLE "UserBlock"
ADD CONSTRAINT "UserBlock_no_self_block"
CHECK ("blockerUserId" <> "blockedUserId");

ALTER TABLE "UserMute"
ADD CONSTRAINT "UserMute_no_self_mute"
CHECK ("muterUserId" <> "mutedUserId");
