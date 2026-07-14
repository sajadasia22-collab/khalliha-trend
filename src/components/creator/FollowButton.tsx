"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "../ui/Toast";
import { CheckIcon, UsersIcon } from "../ui/icons";

type Props = {
  username: string;
  isAuthenticated: boolean;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  followingCount: number;
};

export function FollowButton({
  username,
  isAuthenticated,
  isOwnProfile,
  initialIsFollowing,
  initialFollowersCount,
  followingCount,
}: Props) {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/creators/${encodeURIComponent(username)}/follow`,
        { method: isFollowing ? "DELETE" : "POST" },
      );
      const json = await response.json();
      if (!response.ok) {
        showToast(json.error?.message ?? "تعذّر تحديث المتابعة.", "error");
        return;
      }
      setIsFollowing(json.data.isFollowing);
      setFollowersCount(json.data.followersCount);
      showToast(
        json.data.isFollowing ? "تمت المتابعة." : "تم إلغاء المتابعة.",
        "success",
      );
    } catch {
      showToast("تعذّر الاتصال بالسيرفر.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      <div className="flex items-center gap-4 text-xs font-bold text-[var(--color-text-secondary)]">
        <span>
          <strong className="text-base text-[var(--color-text)]">{followersCount}</strong>{" "}
          متابع
        </span>
        <span>
          <strong className="text-base text-[var(--color-text)]">{followingCount}</strong>{" "}
          يتابع
        </span>
      </div>

      {isOwnProfile ? (
        <Link
          href="/creator/profile"
          className="btn-outline justify-center px-6 py-3 text-sm"
        >
          إدارة ملفك
        </Link>
      ) : isAuthenticated ? (
        <button
          type="button"
          onClick={toggleFollow}
          disabled={loading}
          aria-pressed={isFollowing}
          className={`${isFollowing ? "btn-outline" : "btn-primary"} justify-center px-6 py-3 text-sm`}
        >
          {loading ? (
            <span className="btn-spinner" aria-hidden="true" />
          ) : isFollowing ? (
            <CheckIcon size={17} aria-hidden="true" />
          ) : (
            <UsersIcon size={17} aria-hidden="true" />
          )}
          {isFollowing ? "تتابعه" : "متابعة"}
        </button>
      ) : (
        <Link href="/login" className="btn-primary justify-center px-6 py-3 text-sm">
          <UsersIcon size={17} aria-hidden="true" />
          سجّل دخول للمتابعة
        </Link>
      )}
    </div>
  );
}
