"use client";

/* eslint-disable @next/next/no-img-element -- images are restricted to the configured community/profile storage. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../ui/Toast";
import {
  BlockIcon,
  BookmarkIcon,
  CloseIcon,
  CommentIcon,
  FlagIcon,
  HeartIcon,
  ImageIcon,
  LinkIcon,
  MoreIcon,
  MuteIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  ShareIcon,
  TrashIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../ui/icons";

export type CommunityCurrentUser = {
  id: string;
  fullName: string;
  role: string;
} | null;
type CreatorIdentity = { username: string | null; avatarUrl: string | null } | null;
type CommunityComment = {
  id: string;
  body: string;
  authorId: string;
  parentId: string | null;
  createdAt: string;
  author: { fullName: string; creatorProfile: CreatorIdentity };
};
export type CommunityPost = {
  id: string;
  authorId: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImageUrl: string | null;
  images: Array<{ id: string; url: string; sortOrder: number }>;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string; creatorProfile: CreatorIdentity };
  comments: CommunityComment[];
  _count: { likes: number; comments: number; shares: number };
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
};
type Suggestion = {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  trustScore: number;
  user: { fullName: string };
};

const reportReasons = [
  ["SPAM", "محتوى مزعج"],
  ["HARASSMENT", "إساءة أو مضايقة"],
  ["HATE", "خطاب كراهية"],
  ["MISINFORMATION", "معلومات مضللة"],
  ["COPYRIGHT", "حقوق ملكية"],
  ["OTHER", "سبب آخر"],
] as const;

const feedOptions = [
  { value: "all", label: "آخر المنشورات", shortLabel: "الرئيسية", icon: TrendingUpIcon },
  {
    value: "following",
    label: "الحسابات المتابَعة",
    shortLabel: "أتابعهم",
    icon: UsersIcon,
  },
  {
    value: "saved",
    label: "المنشورات المحفوظة",
    shortLabel: "المحفوظات",
    icon: BookmarkIcon,
  },
] as const;

function formatPostTime(value: string) {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  const minutes = Math.floor(elapsed / 60_000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (minutes < 1_440) return `منذ ${Math.floor(minutes / 60)} س`;

  return date.toLocaleDateString("ar-IQ", {
    day: "numeric",
    month: "short",
  });
}

function linkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function avatar(identity: CreatorIdentity, name: string, size = "h-11 w-11") {
  return (
    <span
      className={`flex ${size} flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]`}
    >
      {identity?.avatarUrl ? (
        <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-black">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

export function PostCard({
  post,
  currentUser,
  onRemoved,
}: {
  post: CommunityPost;
  currentUser: CommunityCurrentUser;
  onRemoved: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [item, setItem] = useState(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [busy, setBusy] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const identity = item.author.creatorProfile;
  const own = currentUser?.id === item.authorId;
  const postImages = item.images?.length
    ? item.images.map((image) => image.url)
    : item.imageUrl
      ? [item.imageUrl]
      : [];

  useEffect(() => {
    if (!activeImage) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImage(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeImage]);

  function requireLogin() {
    if (currentUser) return true;
    showToast("سجّل الدخول للتفاعل مع المجتمع.", "error");
    return false;
  }

  async function action(kind: "like" | "save" | "share") {
    if (!requireLogin()) return;
    const response = await fetch(`/api/v1/community/posts/${item.id}/${kind}`, {
      method: "POST",
    });
    const json = await response.json();
    if (!response.ok) {
      showToast(json.error?.message ?? "تعذّر تنفيذ الإجراء.", "error");
      return;
    }
    if (kind === "like") {
      setItem((current) => ({
        ...current,
        isLiked: json.data.active,
        _count: { ...current._count, likes: json.data.count },
      }));
    } else if (kind === "save") {
      setItem((current) => ({ ...current, isSaved: json.data.active }));
    } else {
      setItem((current) => ({
        ...current,
        isShared: true,
        _count: { ...current._count, shares: json.data.count },
      }));
      const shareUrl = `${window.location.origin}/community/posts/${item.id}`;
      if (navigator.share) {
        await navigator
          .share({ title: "منشور من خلّيها ترند", url: shareUrl })
          .catch(() => null);
      } else {
        await navigator.clipboard.writeText(shareUrl).catch(() => null);
        showToast("تم نسخ رابط المنشور.", "success");
      }
    }
  }

  async function loadComments() {
    setCommentsOpen((open) => !open);
    if (commentsOpen || comments.length >= item._count.comments) return;
    const response = await fetch(`/api/v1/community/posts/${item.id}/comments`);
    const json = await response.json();
    if (response.ok) setComments(json.data);
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!requireLogin() || !commentBody.trim()) return;
    setBusy(true);
    const response = await fetch(`/api/v1/community/posts/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody, parentId: replyTo?.id ?? null }),
    });
    const json = await response.json();
    setBusy(false);
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر نشر التعليق.", "error");
    setComments((current) => [...current, json.data]);
    setItem((current) => ({
      ...current,
      _count: { ...current._count, comments: current._count.comments + 1 },
    }));
    setCommentBody("");
    setReplyTo(null);
  }

  async function removeComment(commentId: string) {
    const response = await fetch(`/api/v1/community/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      showToast("تعذّر حذف التعليق.", "error");
      return;
    }
    const removedIds = new Set([
      commentId,
      ...comments
        .filter((comment) => comment.parentId === commentId)
        .map((item) => item.id),
    ]);
    setComments((items) => items.filter((comment) => !removedIds.has(comment.id)));
    setItem((current) => ({
      ...current,
      _count: {
        ...current._count,
        comments: Math.max(0, current._count.comments - removedIds.size),
      },
    }));
  }

  function renderComment(comment: CommunityComment, nested = false) {
    return (
      <div key={comment.id} className={`flex gap-2.5 ${nested ? "ms-10 mt-2" : ""}`}>
        {avatar(comment.author.creatorProfile, comment.author.fullName, "h-8 w-8")}
        <div className="min-w-0 flex-1">
          <div className="rounded-[18px] bg-[var(--color-surface-muted)] px-3.5 py-2.5">
            <strong className="text-xs">{comment.author.fullName}</strong>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-2 text-[11px] font-bold text-[var(--color-text-muted)]">
            {!nested && currentUser && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo({ id: comment.id, name: comment.author.fullName });
                  setCommentBody("");
                }}
                className="hover:text-[var(--color-text)]"
              >
                رد
              </button>
            )}
            {currentUser?.id === comment.authorId && (
              <button
                type="button"
                onClick={() => void removeComment(comment.id)}
                className="hover:text-[var(--color-text)]"
              >
                حذف
              </button>
            )}
            <time dateTime={comment.createdAt}>{formatPostTime(comment.createdAt)}</time>
          </div>
        </div>
      </div>
    );
  }

  async function saveEdit() {
    setBusy(true);
    const response = await fetch(`/api/v1/community/posts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: editBody,
        imageUrls: postImages,
        linkUrl: item.linkUrl,
      }),
    });
    const json = await response.json();
    setBusy(false);
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر تعديل المنشور.", "error");
    setItem((current) => ({
      ...current,
      body: json.data.body,
      updatedAt: json.data.updatedAt,
      images: json.data.images,
    }));
    setEditing(false);
  }

  async function removePost() {
    if (!window.confirm("هل تريد حذف المنشور؟")) return;
    const response = await fetch(`/api/v1/community/posts/${item.id}`, {
      method: "DELETE",
    });
    if (response.ok) onRemoved(item.id);
  }

  async function report() {
    if (!requireLogin()) return;
    const response = await fetch("/api/v1/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: item.id, reason: reportReason }),
    });
    const json = await response.json();
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر إرسال البلاغ.", "error");
    setReporting(false);
    showToast("وصل البلاغ للإدارة.", "success");
  }

  async function relationship(kind: "mute" | "block") {
    if (!requireLogin() || !identity?.username) return;
    const response = await fetch(
      `/api/v1/community/users/${encodeURIComponent(identity.username)}/${kind}`,
      { method: "POST" },
    );
    const json = await response.json();
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر تنفيذ الإجراء.", "error");
    onRemoved(item.id);
    showToast(kind === "mute" ? "تم كتم الحساب." : "تم حظر الحساب.", "success");
  }

  return (
    <article className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(6,38,25,.06),0_8px_24px_rgba(6,38,25,.04)] transition-shadow duration-200 hover:shadow-[0_2px_4px_rgba(6,38,25,.08),0_14px_32px_rgba(6,38,25,.07)]">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <Link href={identity?.username ? `/creators/${identity.username}` : "/creators"}>
          {avatar(identity, item.author.fullName)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={identity?.username ? `/creators/${identity.username}` : "/creators"}
            className="text-[15px] font-black hover:text-[var(--color-brand-active)]"
          >
            {item.author.fullName}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            {identity?.username && <span dir="ltr">@{identity.username}</span>}
            <span aria-hidden="true">•</span>
            <time dateTime={item.createdAt}>{formatPostTime(item.createdAt)}</time>
            <span aria-hidden="true">•</span>
            <span>عام</span>
            {item.updatedAt !== item.createdAt && <span>معدّل</span>}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            className="btn-icon"
            aria-label="خيارات المنشور"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreIcon aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="absolute end-0 top-11 z-10 w-44 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-lg)]">
              {own ? (
                <>
                  <button
                    className="w-full rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-muted)]"
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    تعديل المنشور
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-muted)]"
                    onClick={removePost}
                  >
                    <TrashIcon size={16} /> حذف
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-muted)]"
                    onClick={() => {
                      setReporting(true);
                      setMenuOpen(false);
                    }}
                  >
                    <FlagIcon size={16} /> إبلاغ
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-muted)]"
                    onClick={() => relationship("mute")}
                  >
                    <MuteIcon size={16} /> كتم الحساب
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-muted)]"
                    onClick={() => relationship("block")}
                  >
                    <BlockIcon size={16} /> حظر الحساب
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="px-4 pb-5 sm:px-5">
          <textarea
            className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
            value={editBody}
            onChange={(event) => setEditBody(event.target.value)}
            maxLength={2000}
          />
          <div className="mt-2 flex gap-2">
            <button className="btn-primary text-sm" disabled={busy} onClick={saveEdit}>
              حفظ
            </button>
            <button className="btn-ghost text-sm" onClick={() => setEditing(false)}>
              إلغاء
            </button>
          </div>
        </div>
      ) : item.body ? (
        <p className="whitespace-pre-wrap px-4 pb-5 text-[15px] leading-7 sm:px-5 sm:text-base">
          {item.body}
        </p>
      ) : null}

      {postImages.length > 0 && (
        <div
          className={`grid gap-0.5 overflow-hidden bg-[var(--color-border)] ${postImages.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {postImages.map((url, index) => (
            <button
              key={url}
              type="button"
              className={`group relative overflow-hidden bg-[var(--color-surface-muted)] ${postImages.length === 1 ? "max-h-[680px]" : "aspect-square"}`}
              onClick={() => setActiveImage(url)}
              aria-label={`فتح صورة المنشور ${index + 1} من ${postImages.length}`}
            >
              <img
                src={url}
                alt={`صورة المنشور ${index + 1}`}
                className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${postImages.length === 1 ? "max-h-[680px]" : "h-full"}`}
              />
            </button>
          ))}
        </div>
      )}
      {item.linkUrl && (
        <a
          href={item.linkUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-4 mb-5 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3.5 transition-colors hover:border-[var(--color-border-strong)] sm:mx-5"
          dir="ltr"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-brand-active)]">
            <LinkIcon size={18} aria-hidden="true" />
          </span>
          {item.linkImageUrl && (
            <img
              src={item.linkImageUrl}
              alt=""
              className="h-16 w-20 flex-none rounded-lg object-cover"
            />
          )}
          <span className="min-w-0 flex-1 text-start">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              رابط خارجي
            </span>
            <span className="block truncate text-sm font-black text-[var(--color-text)]">
              {item.linkTitle || linkHost(item.linkUrl)}
            </span>
            {item.linkDescription && (
              <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--color-text-muted)]">
                {item.linkDescription}
              </span>
            )}
          </span>
        </a>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,17,11,.94)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة صورة المنشور"
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setActiveImage(null)}
            aria-label="إغلاق معاينة الصورة"
          />
          <button
            type="button"
            className="absolute end-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--forest-600)] text-[var(--color-text-on-dark)]"
            onClick={() => setActiveImage(null)}
            aria-label="إغلاق معاينة الصورة"
          >
            <CloseIcon />
          </button>
          <img
            src={activeImage}
            alt="صورة المنشور بالحجم الكامل"
            className="relative z-10 max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {reporting && (
        <div className="mx-5 mb-5 rounded-[var(--radius-md)] border border-[var(--color-brand)] bg-[rgba(214,246,29,.08)] p-4">
          <label className="text-xs font-black" htmlFor={`report-${item.id}`}>
            سبب البلاغ
          </label>
          <select
            id={`report-${item.id}`}
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
          >
            {reportReasons.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary text-xs" onClick={report}>
              إرسال البلاغ
            </button>
            <button className="btn-ghost text-xs" onClick={() => setReporting(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-2 text-xs text-[var(--color-text-muted)] sm:px-5">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-text-on-brand)]">
            <HeartIcon size={11} fill="currentColor" aria-hidden="true" />
          </span>
          {item._count.likes ? `${item._count.likes} إعجاب` : "كن أول المعجبين"}
        </span>
        <span className="flex items-center gap-3">
          {item._count.comments > 0 && <span>{item._count.comments} تعليق</span>}
          {item._count.shares > 0 && <span>{item._count.shares} مشاركة</span>}
        </span>
      </div>

      <div className="mx-4 grid grid-cols-4 border-y border-[var(--color-border)] py-1 sm:mx-5">
        <button
          type="button"
          aria-pressed={item.isLiked}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-colors hover:bg-[var(--color-surface-muted)] ${item.isLiked ? "text-[var(--color-brand-active)]" : "text-[var(--color-text-secondary)]"}`}
          onClick={() => action("like")}
        >
          <HeartIcon size={18} fill={item.isLiked ? "currentColor" : "none"} />
          <span className="hidden sm:inline">إعجاب</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
          onClick={loadComments}
        >
          <CommentIcon size={18} /> <span className="hidden sm:inline">تعليق</span>
        </button>
        <button
          type="button"
          aria-pressed={item.isSaved}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-colors hover:bg-[var(--color-surface-muted)] ${item.isSaved ? "text-[var(--color-brand-active)]" : "text-[var(--color-text-secondary)]"}`}
          onClick={() => action("save")}
        >
          <BookmarkIcon size={18} fill={item.isSaved ? "currentColor" : "none"} />
          <span className="hidden sm:inline">حفظ</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
          onClick={() => action("share")}
        >
          <ShareIcon size={18} /> <span className="hidden sm:inline">مشاركة</span>
        </button>
      </div>

      {commentsOpen && (
        <div className="bg-[var(--color-surface)] p-4 sm:px-5">
          <div className="space-y-3">
            {comments
              .filter((comment) => !comment.parentId)
              .map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}
                  {comments
                    .filter((reply) => reply.parentId === comment.id)
                    .map((reply) => renderComment(reply, true))}
                </div>
              ))}
          </div>
          {currentUser ? (
            <div className="mt-4">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--trend-100)] px-3 py-2 text-xs">
                  <span>
                    رد على <strong>{replyTo.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    aria-label="إلغاء الرد"
                  >
                    <CloseIcon size={15} />
                  </button>
                </div>
              )}
              <form onSubmit={addComment} className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                  placeholder={replyTo ? "اكتب ردك..." : "اكتب تعليقاً..."}
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="btn-icon bg-[var(--color-brand)]"
                  disabled={busy || !commentBody.trim()}
                  aria-label="إرسال التعليق"
                >
                  <SendIcon size={18} />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="mt-4 block text-center text-sm font-bold text-[var(--color-brand-active)]"
            >
              سجّل الدخول للتعليق
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export function CommunityFeed({ currentUser }: { currentUser: CommunityCurrentUser }) {
  const { showToast } = useToast();
  const [feed, setFeed] = useState<"all" | "following" | "saved">("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(
    async (
      targetPage = 1,
      append = false,
      selectedFeed: "all" | "following" | "saved" = feed,
    ) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        feed: selectedFeed,
        page: String(targetPage),
        pageSize: "10",
      });
      if (query) params.set("search", query);
      const response = await fetch(`/api/v1/community/posts?${params}`);
      const json = await response.json();
      if (response.ok) {
        setPosts((current) => {
          if (!append) return json.data;
          const existing = new Set(current.map((post) => post.id));
          return [
            ...current,
            ...json.data.filter((post: CommunityPost) => !existing.has(post.id)),
          ];
        });
        setPage(targetPage);
        setHasMore(targetPage < json.pagination.pageCount);
      } else showToast(json.error?.message ?? "تعذّر تحميل المجتمع.", "error");
      setLoading(false);
      setLoadingMore(false);
    },
    [feed, query, showToast],
  );

  useEffect(() => {
    // Fetch completion updates the feed; this effect intentionally owns that synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts(1, false);
  }, [loadPosts]);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadPosts(page + 1, true);
      },
      { rootMargin: "320px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadPosts, loading, loadingMore, page]);
  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/v1/community/suggestions")
      .then((response) => response.json())
      .then((json) => setSuggestions(json.data ?? []))
      .catch(() => null);
  }, [currentUser]);

  async function uploadImages(files: File[]) {
    const available = Math.max(0, 4 - imageUrls.length);
    const selected = files.slice(0, available);
    if (!selected.length) return;
    setUploadingImage(true);
    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/v1/community/images", {
          method: "POST",
          body: form,
        });
        const json = await response.json();
        if (!response.ok) {
          showToast(json.error?.message ?? "تعذّر رفع الصورة.", "error");
          break;
        }
        uploaded.push(json.data.url);
      }
      setImageUrls((current) => [...current, ...uploaded].slice(0, 4));
    } finally {
      setUploadingImage(false);
    }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    setPublishing(true);
    const response = await fetch("/api/v1/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        imageUrls,
        linkUrl: linkUrl || null,
      }),
    });
    const json = await response.json();
    setPublishing(false);
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر نشر المنشور.", "error");
    setBody("");
    setImageUrls([]);
    setLinkUrl("");
    setLinkOpen(false);
    setFeed("all");
    await loadPosts(1, false, "all");
    showToast("تم نشر المنشور.", "success");
  }

  function selectFeed(value: "all" | "following" | "saved") {
    if (value !== "all" && !currentUser)
      return showToast("سجّل الدخول لهذه الخلاصة.", "error");
    setFeed(value);
  }

  async function followSuggestion(username: string) {
    const response = await fetch(
      `/api/v1/creators/${encodeURIComponent(username)}/follow`,
      { method: "POST" },
    );
    const json = await response.json();
    if (!response.ok) {
      showToast(json.error?.message ?? "تعذّرت المتابعة.", "error");
      return;
    }
    setSuggestions((items) => items.filter((item) => item.username !== username));
    showToast("تمت المتابعة.", "success");
  }

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-7">
      <header className="overflow-hidden rounded-[22px] bg-[var(--color-surface-dark)] text-[var(--color-text-on-dark)] shadow-[0_14px_34px_rgba(6,38,25,.14)]">
        <div className="relative flex flex-col gap-5 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -start-16 -top-24 h-56 w-56 rounded-full bg-[var(--color-brand)] opacity-15 blur-3xl"
          />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-black text-[var(--color-brand)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
              مجتمع خلّيها ترند
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">تواصل، شارك، واصنع الأثر</h1>
            <p className="mt-1.5 text-xs leading-6 text-[var(--forest-100)] sm:text-sm">
              مساحة عراقية مهنية تجمع صناع المحتوى حول الأفكار والخبرات الحقيقية.
            </p>
          </div>
          <form
            className="relative w-full lg:w-[360px]"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
          >
            <SearchIcon
              className="absolute end-4 top-1/2 -translate-y-1/2 text-[var(--forest-200)]"
              size={18}
            />
            <input
              className="h-12 w-full rounded-[var(--radius-pill)] border border-[var(--forest-500)] bg-[var(--forest-600)] py-2 pe-11 ps-4 text-sm text-[var(--color-text-on-dark)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[rgba(214,246,29,.15)]"
              placeholder="ابحث عن منشور أو صانع محتوى..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
        </div>
      </header>

      <nav
        aria-label="خلاصات المجتمع"
        className="mt-3 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-sm)] xl:hidden"
      >
        {feedOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => selectFeed(option.value)}
              className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-colors ${feed === option.value ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"}`}
            >
              <Icon size={17} aria-hidden="true" /> {option.shortLabel}
            </button>
          );
        })}
      </nav>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,680px)_280px] lg:justify-center xl:grid-cols-[245px_minmax(0,680px)_280px]">
        <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block">
          <section className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]">
            <h2 className="px-3 pb-3 pt-2 text-sm font-black">تصفح المجتمع</h2>
            <div className="space-y-1">
              {feedOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectFeed(option.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-bold transition-colors ${feed === option.value ? "bg-[var(--trend-100)] text-[var(--color-text)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"}`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${feed === option.value ? "bg-[var(--color-brand)]" : "bg-[var(--color-surface-muted)]"}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-black text-[var(--color-text-muted)]">
              روابط سريعة
            </p>
            <div className="mt-3 space-y-1 text-sm font-bold">
              <Link
                href="/creators"
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                <UsersIcon size={18} /> اكتشف صناع المحتوى
              </Link>
              <Link
                href="/campaigns"
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                <TrendingUpIcon size={18} /> الحملات المتاحة
              </Link>
            </div>
          </section>
        </aside>

        <section aria-label="خلاصة المجتمع" className="min-w-0 space-y-4">
          {currentUser && suggestions.length > 0 && (
            <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] xl:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black">حسابات تستحق المتابعة</h2>
                <Link
                  href="/creators"
                  className="text-xs font-black text-[var(--color-brand-active)]"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.username}
                    className="flex w-24 flex-none flex-col items-center text-center"
                  >
                    <Link
                      href={`/creators/${suggestion.username}`}
                      className="flex w-full flex-col items-center"
                    >
                      <span className="rounded-full border-2 border-[var(--color-brand)] p-0.5">
                        {avatar(
                          {
                            username: suggestion.username,
                            avatarUrl: suggestion.avatarUrl,
                          },
                          suggestion.user.fullName,
                          "h-14 w-14",
                        )}
                      </span>
                      <strong className="mt-2 w-full truncate text-xs">
                        {suggestion.user.fullName}
                      </strong>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void followSuggestion(suggestion.username)}
                      className="mt-2 w-full rounded-lg bg-[var(--trend-100)] px-2 py-1.5 text-[10px] font-black"
                    >
                      متابعة
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {currentUser?.role === "CREATOR" && (
            <form
              onSubmit={publish}
              className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(6,38,25,.06),0_8px_24px_rgba(6,38,25,.04)]"
            >
              <div className="flex gap-3 p-4 sm:p-5">
                {avatar(null, currentUser.fullName)}
                <textarea
                  className="min-h-16 flex-1 resize-none rounded-[18px] border-0 bg-[var(--color-surface-muted)] px-4 py-3 text-[15px] leading-6 outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]"
                  placeholder={`بماذا تفكر، ${currentUser.fullName.split(" ")[0]}؟`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={2000}
                />
              </div>
              {imageUrls.length > 0 && (
                <div
                  className={`mx-4 mb-4 grid gap-1 overflow-hidden rounded-[var(--radius-lg)] sm:mx-5 ${imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {imageUrls.map((url, index) => (
                    <div
                      key={url}
                      className={`relative overflow-hidden bg-[var(--color-surface-muted)] ${imageUrls.length > 1 ? "aspect-square" : "max-h-96"}`}
                    >
                      <img
                        src={url}
                        alt={`معاينة صورة المنشور ${index + 1}`}
                        className={`w-full object-cover ${imageUrls.length > 1 ? "h-full" : "max-h-96"}`}
                      />
                      <button
                        type="button"
                        className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-dark)] text-[var(--color-text-on-dark)]"
                        onClick={() =>
                          setImageUrls((current) =>
                            current.filter((image) => image !== url),
                          )
                        }
                        aria-label={`إزالة الصورة ${index + 1}`}
                      >
                        <CloseIcon size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {linkOpen && (
                <div className="mx-4 mb-4 sm:mx-5">
                  <label
                    htmlFor="community-link"
                    className="mb-2 block text-xs font-black"
                  >
                    أضف رابطاً خارجياً
                  </label>
                  <div className="relative">
                    <LinkIcon
                      size={18}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    />
                    <input
                      id="community-link"
                      type="url"
                      dir="ltr"
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] py-2.5 pe-10 ps-3 text-sm outline-none focus:border-[var(--color-brand-active)]"
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                    />
                  </div>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) void uploadImages(files);
                  event.target.value = "";
                }}
              />
              <div className="mx-4 flex items-center gap-1 border-t border-[var(--color-border)] py-2 sm:mx-5">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage || imageUrls.length >= 4}
                >
                  <ImageIcon size={19} className="text-[var(--color-brand-active)]" />
                  {uploadingImage
                    ? "جارٍ الرفع..."
                    : imageUrls.length
                      ? `صور ${imageUrls.length}/4`
                      : "صور"}
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                  onClick={() => setLinkOpen((open) => !open)}
                >
                  <LinkIcon size={19} /> رابط خارجي
                </button>
                <button
                  type="submit"
                  className="ms-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-xs font-black text-[var(--color-text-on-brand)] transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    publishing ||
                    uploadingImage ||
                    (!body.trim() && !imageUrls.length && !linkUrl)
                  }
                >
                  {publishing ? "ينشر..." : "نشر"}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between px-1 py-1">
            <div>
              <h2 className="text-base font-black">
                {feedOptions.find((option) => option.value === feed)?.label}
              </h2>
              {query && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  نتائج البحث عن «{query}»
                </p>
              )}
            </div>
            {query && (
              <button
                type="button"
                className="text-xs font-black text-[var(--color-brand-active)]"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                }}
              >
                مسح البحث
              </button>
            )}
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)]"
              />
            ))
          ) : posts.length ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onRemoved={(id) =>
                  setPosts((items) => items.filter((post) => post.id !== id))
                }
              />
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--trend-100)]">
                <UsersIcon size={24} />
              </span>
              <h2 className="mt-4 text-xl font-black">الخلاصة هادئة حالياً</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                غيّر الفلتر أو كن أول من يشارك فكرة مفيدة.
              </p>
            </div>
          )}
          <div ref={loadMoreRef} className="h-2" aria-hidden="true" />
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-[var(--color-text-muted)]">
              <span className="btn-spinner" aria-hidden="true" /> تحميل منشورات أكثر...
            </div>
          )}
          {!loading && posts.length > 0 && !hasMore && (
            <p className="py-3 text-center text-xs text-[var(--color-text-muted)]">
              وصلت لنهاية الخلاصة.
            </p>
          )}
        </section>

        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
          {currentUser && suggestions.length > 0 && (
            <section className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black">أشخاص قد تعرفهم</h2>
                <Link
                  href="/creators"
                  className="text-[11px] font-black text-[var(--color-brand-active)]"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.username}
                    className="group flex items-center gap-3"
                  >
                    <Link
                      href={`/creators/${suggestion.username}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {avatar(
                        {
                          username: suggestion.username,
                          avatarUrl: suggestion.avatarUrl,
                        },
                        suggestion.user.fullName,
                        "h-11 w-11",
                      )}
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm group-hover:text-[var(--color-brand-active)]">
                          {suggestion.user.fullName}
                        </strong>
                        <span
                          className="block truncate text-[11px] text-[var(--color-text-muted)]"
                          dir="ltr"
                        >
                          @{suggestion.username}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void followSuggestion(suggestion.username)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--trend-100)] transition hover:bg-[var(--color-brand)]"
                      aria-label={`متابعة ${suggestion.user.fullName}`}
                    >
                      <PlusIcon size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-[20px] bg-[var(--color-surface-dark)] text-[var(--color-text-on-dark)] shadow-[var(--shadow-md)]">
            <div className="border-b border-[var(--forest-500)] p-5">
              <p className="text-xs font-black text-[var(--color-brand)]">
                مجتمع مهني وآمن
              </p>
              <h2 className="mt-1 text-lg font-black">قواعد المساحة</h2>
            </div>
            <ul className="space-y-3 p-5 text-xs leading-6 text-[var(--forest-100)]">
              <li className="flex gap-2">
                <span className="text-[var(--color-brand)]">●</span> محتوى مهني واحترام
                متبادل.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-brand)]">●</span> نصوص وصور وروابط
                خارجية فقط.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-brand)]">●</span> لا أرباح على
                الإعجابات أو المتابعين.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-brand)]">●</span> البلاغات تراجعها
                الإدارة.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
