"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowStartIcon } from "../ui/icons";
import { PostCard, type CommunityCurrentUser, type CommunityPost } from "./CommunityFeed";

export function CommunityPostDetail({
  postId,
  currentUser,
}: {
  postId: string;
  currentUser: CommunityCurrentUser;
}) {
  const router = useRouter();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/community/posts/${postId}`)
      .then(async (response) => ({ ok: response.ok, json: await response.json() }))
      .then(({ ok, json }) => {
        if (!active) return;
        if (ok) setPost(json.data);
        else setMissing(true);
      })
      .catch(() => {
        if (active) setMissing(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  return (
    <div className="mx-auto max-w-[720px] px-3 py-6 sm:px-5 lg:py-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-[var(--color-brand-active)]">
            مجتمع خلّيها ترند
          </p>
          <h1 className="mt-1 text-2xl font-black">المنشور</h1>
        </div>
        <Link
          href="/community"
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-xs font-black"
        >
          العودة للمجتمع <ArrowStartIcon size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-[20px] bg-[var(--color-surface)]" />
      ) : post ? (
        <PostCard
          post={post}
          currentUser={currentUser}
          onRemoved={() => router.push("/community")}
        />
      ) : missing ? (
        <div className="rounded-[20px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <h2 className="text-xl font-black">المنشور غير متاح</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            قد يكون حُذف أو أصبح غير متاح لك.
          </p>
        </div>
      ) : null}
    </div>
  );
}
