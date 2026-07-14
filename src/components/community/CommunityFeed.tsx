"use client";

/* eslint-disable @next/next/no-img-element -- images are restricted to the configured community/profile storage. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../ui/Toast";
import {
  BlockIcon,
  BookmarkIcon,
  CommentIcon,
  FlagIcon,
  HeartIcon,
  ImageIcon,
  MoreIcon,
  MuteIcon,
  SearchIcon,
  SendIcon,
  ShareIcon,
  TrashIcon,
} from "../ui/icons";

type CurrentUser = { id: string; fullName: string; role: string } | null;
type CreatorIdentity = { username: string | null; avatarUrl: string | null } | null;
type CommunityComment = {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
  author: { fullName: string; creatorProfile: CreatorIdentity };
};
type CommunityPost = {
  id: string;
  authorId: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
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

function PostCard({
  post,
  currentUser,
  onRemoved,
}: {
  post: CommunityPost;
  currentUser: CurrentUser;
  onRemoved: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [item, setItem] = useState(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.comments.slice().reverse());
  const [commentBody, setCommentBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [busy, setBusy] = useState(false);
  const identity = item.author.creatorProfile;
  const own = currentUser?.id === item.authorId;

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
      const shareUrl = `${window.location.origin}/community?post=${item.id}`;
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
      body: JSON.stringify({ body: commentBody }),
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
  }

  async function saveEdit() {
    setBusy(true);
    const response = await fetch(`/api/v1/community/posts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: editBody,
        imageUrl: item.imageUrl,
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
    <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3 p-5">
        <Link href={identity?.username ? `/creators/${identity.username}` : "/creators"}>
          {avatar(identity, item.author.fullName)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={identity?.username ? `/creators/${identity.username}` : "/creators"}
            className="font-black hover:text-[var(--color-brand-active)]"
          >
            {item.author.fullName}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            {identity?.username && <span dir="ltr">@{identity.username}</span>}
            <span>•</span>
            <time dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleDateString("ar-IQ", {
                day: "numeric",
                month: "short",
              })}
            </time>
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
        <div className="px-5 pb-5">
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
        <p className="whitespace-pre-wrap px-5 pb-5 text-[15px] leading-7">{item.body}</p>
      ) : null}

      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt="صورة مرفقة بالمنشور"
          className="max-h-[620px] w-full object-cover"
        />
      )}
      {item.linkUrl && (
        <a
          href={item.linkUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-5 mb-5 block truncate rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-bold text-[var(--color-brand-active)]"
          dir="ltr"
        >
          {item.linkUrl}
        </a>
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

      <div className="grid grid-cols-4 border-t border-[var(--color-border)] px-3 py-2">
        <button
          type="button"
          aria-pressed={item.isLiked}
          className={`flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold ${item.isLiked ? "text-[var(--color-brand-active)]" : "text-[var(--color-text-secondary)]"}`}
          onClick={() => action("like")}
        >
          <HeartIcon size={18} fill={item.isLiked ? "currentColor" : "none"} />{" "}
          {item._count.likes}
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold text-[var(--color-text-secondary)]"
          onClick={loadComments}
        >
          <CommentIcon size={18} /> {item._count.comments}
        </button>
        <button
          type="button"
          aria-pressed={item.isSaved}
          className={`flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold ${item.isSaved ? "text-[var(--color-brand-active)]" : "text-[var(--color-text-secondary)]"}`}
          onClick={() => action("save")}
        >
          <BookmarkIcon size={18} fill={item.isSaved ? "currentColor" : "none"} /> حفظ
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold text-[var(--color-text-secondary)]"
          onClick={() => action("share")}
        >
          <ShareIcon size={18} /> {item._count.shares}
        </button>
      </div>

      {commentsOpen && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                {avatar(
                  comment.author.creatorProfile,
                  comment.author.fullName,
                  "h-8 w-8",
                )}
                <div className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
                  <strong className="text-xs">{comment.author.fullName}</strong>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {currentUser ? (
            <form onSubmit={addComment} className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                placeholder="اكتب تعليقاً..."
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

export function CommunityFeed({ currentUser }: { currentUser: CurrentUser }) {
  const { showToast } = useToast();
  const [feed, setFeed] = useState<"all" | "following" | "saved">("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ feed, pageSize: "20" });
    if (query) params.set("search", query);
    const response = await fetch(`/api/v1/community/posts?${params}`);
    const json = await response.json();
    if (response.ok) setPosts(json.data);
    else showToast(json.error?.message ?? "تعذّر تحميل المجتمع.", "error");
    setLoading(false);
  }, [feed, query, showToast]);

  useEffect(() => {
    // Fetch completion updates the feed; this effect intentionally owns that synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts();
  }, [loadPosts]);
  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/v1/community/suggestions")
      .then((response) => response.json())
      .then((json) => setSuggestions(json.data ?? []))
      .catch(() => null);
  }, [currentUser]);

  async function uploadImage(file: File) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/v1/community/images", {
      method: "POST",
      body: form,
    });
    const json = await response.json();
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر رفع الصورة.", "error");
    setImageUrl(json.data.url);
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    setPublishing(true);
    const response = await fetch("/api/v1/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
      }),
    });
    const json = await response.json();
    setPublishing(false);
    if (!response.ok)
      return showToast(json.error?.message ?? "تعذّر نشر المنشور.", "error");
    setBody("");
    setImageUrl("");
    setLinkUrl("");
    setFeed("all");
    await loadPosts();
    showToast("تم نشر المنشور.", "success");
  }

  function selectFeed(value: "all" | "following" | "saved") {
    if (value !== "all" && !currentUser)
      return showToast("سجّل الدخول لهذه الخلاصة.", "error");
    setFeed(value);
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-6 -z-0 h-52 rounded-[2rem] bg-[radial-gradient(circle_at_18%_20%,rgba(214,246,29,.32),transparent_25%),linear-gradient(135deg,var(--forest-900),var(--forest-700))]"
      />
      <header className="relative z-10 px-5 py-8 text-[var(--color-text-on-dark)] sm:px-10">
        <span className="text-xs font-black text-[var(--color-brand)]">
          مساحة عراقية مهنية
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">المجتمع يصنع الترند</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--forest-100)]">
          شارك فكرة أو صورة أو رابط عمل خارجي، وتواصل حول الخبرة الحقيقية—بدون استضافة
          فيديو وبدون أرباح اجتماعية.
        </p>
      </header>

      <div className="relative z-10 mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,720px)_320px] lg:justify-center">
        <section className="min-w-0 space-y-5">
          {currentUser?.role === "CREATOR" && (
            <form
              onSubmit={publish}
              className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)]"
            >
              <div className="flex gap-3">
                {avatar(null, currentUser.fullName)}
                <textarea
                  className="min-h-24 flex-1 resize-none border-0 bg-transparent p-2 text-[15px] leading-7 outline-none"
                  placeholder="شنو الفكرة اللي تستحق تصير ترند؟"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={2000}
                />
              </div>
              {imageUrl && (
                <div className="relative mt-3 overflow-hidden rounded-[var(--radius-lg)]">
                  <img
                    src={imageUrl}
                    alt="معاينة صورة المنشور"
                    className="max-h-96 w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-3 rounded-full bg-[var(--color-surface-dark)] px-3 py-1 text-xs text-[var(--color-text-on-dark)]"
                    onClick={() => setImageUrl("")}
                  >
                    إزالة
                  </button>
                </div>
              )}
              <input
                type="url"
                dir="ltr"
                className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm"
                placeholder="https:// رابط خارجي اختياري"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
              />
              <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <button
                  type="button"
                  className="btn-ghost gap-2 text-sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon size={18} /> صورة
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm"
                  disabled={publishing || (!body.trim() && !imageUrl && !linkUrl)}
                >
                  {publishing ? "جارٍ النشر..." : "انشر الآن"}
                </button>
              </div>
            </form>
          )}

          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 overflow-x-auto">
                {(
                  [
                    ["all", "الكل"],
                    ["following", "أتابعهم"],
                    ["saved", "المحفوظات"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectFeed(value)}
                    className={`whitespace-nowrap rounded-[var(--radius-pill)] px-4 py-2 text-xs font-black ${feed === value ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuery(search.trim());
                }}
              >
                <SearchIcon
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  size={17}
                />
                <input
                  className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] py-2 pe-10 ps-4 text-sm sm:w-56"
                  placeholder="ابحث في المجتمع"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </form>
            </div>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface)]"
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
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
              <h2 className="text-xl font-black">الخلاصة هادئة حالياً</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                غيّر الفلتر أو كن أول من يشارك فكرة مفيدة.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-[var(--radius-xl)] bg-[var(--color-surface-dark)] p-5 text-[var(--color-text-on-dark)] shadow-[var(--shadow-md)]">
            <p className="text-xs font-black text-[var(--color-brand)]">قواعد المساحة</p>
            <ul className="mt-4 space-y-3 text-xs leading-6 text-[var(--forest-100)]">
              <li>• محتوى مهني واحترام متبادل.</li>
              <li>• الصور والنصوص والروابط الخارجية فقط.</li>
              <li>• لا أرباح على الإعجابات أو المتابعين.</li>
              <li>• البلاغات تراجعها الإدارة قبل أي إجراء.</li>
            </ul>
          </section>
          {currentUser && suggestions.length > 0 && (
            <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="font-black">صناع محتوى قد يعجبونك</h2>
              <div className="mt-4 space-y-4">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.username}
                    href={`/creators/${suggestion.username}`}
                    className="flex items-center gap-3"
                  >
                    {avatar(
                      { username: suggestion.username, avatarUrl: suggestion.avatarUrl },
                      suggestion.user.fullName,
                      "h-10 w-10",
                    )}
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">
                        {suggestion.user.fullName}
                      </strong>
                      <span
                        className="block truncate text-[11px] text-[var(--color-text-muted)]"
                        dir="ltr"
                      >
                        @{suggestion.username}
                      </span>
                    </span>
                    <span className="ms-auto rounded-full bg-[rgba(214,246,29,.18)] px-2 py-1 text-[10px] font-black">
                      {suggestion.trustScore}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
