"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "../ui/icons";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function loadNotifications() {
    try {
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data);
      setUnreadCount(json.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeAndFocusTrigger();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleNotificationClick(notification: Notification) {
    if (!notification.readAt) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      fetch(`/api/v1/notifications/${notification.id}/read`, { method: "POST" }).catch(
        () => {},
      );
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
    fetch("/api/v1/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
      >
        <BellIcon size={18} strokeWidth={1.6} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[11px] font-black text-[var(--color-text-on-brand)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="الإشعارات"
          className="fixed inset-x-3 top-16 z-30 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:absolute sm:inset-x-auto sm:start-0 sm:top-auto sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h3 className="text-sm font-bold text-[var(--color-text)]">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-[var(--forest-500)] hover:text-[var(--forest-700)] cursor-pointer"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div
            className="max-h-96 overflow-y-auto"
            aria-live="polite"
            aria-atomic="false"
          >
            {loading ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
                جاري التحميل...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
                لا توجد إشعارات حتى الآن.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="block w-full border-b border-[var(--color-border)] px-4 py-3 text-start last:border-b-0 hover:bg-[var(--color-surface-muted)] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm ${notification.readAt ? "font-semibold text-[var(--color-text-secondary)]" : "font-black text-[var(--color-text)]"}`}
                    >
                      {notification.title}
                    </span>
                    {!notification.readAt && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-brand)]" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2">
                    {notification.body}
                  </p>
                  <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
                    {timeAgo(notification.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
