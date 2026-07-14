"use client";

import { useEffect, useMemo, useState } from "react";
import { FlagIcon, MessageIcon, PlusIcon, SearchIcon, SendIcon } from "../ui/icons";
import { useToast } from "../ui/Toast";

type Conversation = {
  id: string;
  lastMessageAt: string;
  unreadCount: number;
  campaign: { id: string; title: string; brand: { name: string } };
  creatorProfile: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
    userId: string;
    user: { fullName: string };
  };
  messages: Array<{ body: string; createdAt: string }>;
};

type Contact = {
  campaign: { id: string; title: string; brand: { name: string } };
  creatorProfileId: string;
  creatorProfile?: {
    username: string | null;
    avatarUrl: string | null;
    user: { fullName: string };
  };
};

type Message = {
  id: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; fullName: string; role: string };
};

const reasonLabels: Record<string, string> = {
  SPAM: "رسائل مزعجة",
  HARASSMENT: "مضايقة",
  HATE: "خطاب كراهية",
  MISINFORMATION: "معلومات مضللة",
  COPYRIGHT: "حقوق ملكية",
  OTHER: "سبب آخر",
};

export function MessagingCenter({
  initialConversations,
  contacts,
  currentUserId,
  userRole,
}: {
  initialConversations: Conversation[];
  contacts: Contact[];
  currentUserId: string;
  userRole: "CREATOR" | "BRAND";
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [newBody, setNewBody] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("HARASSMENT");
  const [reportDetails, setReportDetails] = useState("");

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const filteredItems = useMemo(() => {
    const query = conversationSearch.trim().toLocaleLowerCase("ar-IQ");
    if (!query) return items;
    return items.filter((item) =>
      [
        item.campaign.title,
        item.campaign.brand.name,
        item.creatorProfile.user.fullName,
        item.messages[0]?.body ?? "",
      ].some((value) => value.toLocaleLowerCase("ar-IQ").includes(query)),
    );
  }, [conversationSearch, items]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const query = new URLSearchParams();
    if (messageSearch.trim()) query.set("search", messageSearch.trim());
    Promise.all([
      fetch(`/api/v1/conversations/${selectedId}/messages?${query}`).then((response) =>
        response.json(),
      ),
      fetch(`/api/v1/conversations/${selectedId}/read`, { method: "POST" }),
    ])
      .then(([json]) => {
        if (!active) return;
        if (json.data) setMessages(json.data);
        setItems((current) =>
          current.map((item) =>
            item.id === selectedId ? { ...item, unreadCount: 0 } : item,
          ),
        );
      })
      .catch(() => showToast("تعذر تحميل الرسائل", "error"));
    return () => {
      active = false;
    };
  }, [selectedId, messageSearch, showToast]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const json = await response.json();
      if (!response.ok)
        return showToast(json.error?.message ?? "تعذر إرسال الرسالة", "error");
      setMessages((current) => [...current, json.data]);
      setItems((current) =>
        current.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                lastMessageAt: json.data.createdAt,
                messages: [{ body: json.data.body, createdAt: json.data.createdAt }],
              }
            : item,
        ),
      );
      setReply("");
    } finally {
      setBusy(false);
    }
  }

  async function createConversation(event: React.FormEvent) {
    event.preventDefault();
    const contact = contacts.find(
      (item) => `${item.campaign.id}:${item.creatorProfileId}` === newContact,
    );
    if (!contact || !newBody.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: contact.campaign.id,
          creatorProfileId: contact.creatorProfileId,
          body: newBody,
        }),
      });
      const json = await response.json();
      if (!response.ok)
        return showToast(json.error?.message ?? "تعذر بدء المحادثة", "error");
      const freshResponse = await fetch("/api/v1/conversations");
      const fresh = await freshResponse.json();
      setItems(fresh.data ?? items);
      setSelectedId(json.data.id);
      setShowNew(false);
      setNewBody("");
      showToast("تم بدء المحادثة", "success");
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reportMessageId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/conversations/${selectedId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: reportMessageId,
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok)
        return showToast(json.error?.message ?? "تعذر إرسال البلاغ", "error");
      setReportMessageId(null);
      setReportDetails("");
      showToast("تم إرسال البلاغ للمراجعة", "success");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[650px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-[var(--color-border)] lg:border-e lg:border-b-0">
        <div className="border-b border-[var(--color-border)] p-4">
          <button
            type="button"
            onClick={() => setShowNew((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand)] px-4 py-3 font-bold text-[var(--color-text-on-brand)]"
          >
            <PlusIcon size={18} /> محادثة حملة جديدة
          </button>
          <label className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
            <SearchIcon size={18} />
            <span className="sr-only">بحث في المحادثات</span>
            <input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="ابحث بالحملة أو الشخص أو الرسالة"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>
        {showNew && (
          <form
            onSubmit={createConversation}
            className="space-y-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          >
            <label className="block text-sm font-bold">
              جهة اتصال من حملة
              <select
                required
                value={newContact}
                onChange={(event) => setNewContact(event.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
              >
                <option value="">اختر جهة الاتصال</option>
                {contacts.map((contact) => (
                  <option
                    key={`${contact.campaign.id}:${contact.creatorProfileId}`}
                    value={`${contact.campaign.id}:${contact.creatorProfileId}`}
                  >
                    {contact.campaign.title} —{" "}
                    {userRole === "BRAND"
                      ? contact.creatorProfile?.user.fullName
                      : contact.campaign.brand.name}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              required
              minLength={1}
              maxLength={2000}
              value={newBody}
              onChange={(event) => setNewBody(event.target.value)}
              placeholder="الرسالة الأولى"
              className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
            />
            <button
              disabled={busy}
              className="rounded-[var(--radius-sm)] bg-[var(--color-text)] px-4 py-2 text-sm font-bold text-[var(--color-bg)]"
            >
              بدء المحادثة
            </button>
          </form>
        )}
        <div className="max-h-[360px] overflow-y-auto lg:max-h-[560px]">
          {filteredItems.map((item) => {
            const person =
              userRole === "BRAND"
                ? item.creatorProfile.user.fullName
                : item.campaign.brand.name;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full border-b border-[var(--color-border)] p-4 text-start transition ${selectedId === item.id ? "bg-[var(--color-surface-muted)]" : "hover:bg-[var(--color-surface-muted)]"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong>{person}</strong>
                  {item.unreadCount > 0 && (
                    <span className="rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-xs font-bold text-[var(--color-text-on-brand)]">
                      {item.unreadCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                  {item.campaign.title}
                </span>
                <span className="mt-2 block truncate text-sm text-[var(--color-text-secondary)]">
                  {item.messages[0]?.body ?? "محادثة جديدة"}
                </span>
              </button>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">
              لا توجد محادثات مطابقة.
            </p>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        {selected ? (
          <>
            <header className="border-b border-[var(--color-border)] p-4">
              <h2 className="font-bold">
                {userRole === "BRAND"
                  ? selected.creatorProfile.user.fullName
                  : selected.campaign.brand.name}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                حملة: {selected.campaign.title}
              </p>
              <label className="mt-3 flex max-w-md items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2">
                <SearchIcon size={16} />
                <span className="sr-only">بحث داخل الرسائل</span>
                <input
                  value={messageSearch}
                  onChange={(event) => setMessageSearch(event.target.value)}
                  placeholder="بحث داخل هذه الرسائل"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-surface-muted)] p-4 lg:p-6">
              {messages.map((message) => {
                const own = message.sender.id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${own ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`group max-w-[82%] rounded-[var(--radius-md)] px-4 py-3 ${own ? "bg-[var(--color-brand)] text-[var(--color-text-on-brand)]" : "border border-[var(--color-border)] bg-[var(--color-surface)]"}`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {message.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-4 text-xs opacity-70">
                        <time>
                          {new Date(message.createdAt).toLocaleString("ar-IQ", {
                            numberingSystem: "latn",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                        {!own && (
                          <button
                            type="button"
                            onClick={() => setReportMessageId(message.id)}
                            className="flex items-center gap-1 underline"
                          >
                            <FlagIcon size={13} /> إبلاغ
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">
                  لا توجد رسائل مطابقة للبحث.
                </p>
              )}
            </div>
            {reportMessageId && (
              <form
                onSubmit={submitReport}
                className="grid gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[180px_1fr_auto]"
              >
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                >
                  {Object.entries(reasonLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="تفاصيل البلاغ (اختياري)"
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                />
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-text)] px-3 py-2 text-sm text-[var(--color-bg)]"
                  >
                    إرسال البلاغ
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportMessageId(null)}
                    className="px-2 text-sm underline"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
            <form
              onSubmit={sendMessage}
              className="flex gap-2 border-t border-[var(--color-border)] p-4"
            >
              <label className="flex-1">
                <span className="sr-only">اكتب رسالة</span>
                <textarea
                  required
                  maxLength={2000}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="اكتب رسالتك…"
                  className="min-h-12 w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none focus:border-[var(--color-brand)]"
                />
              </label>
              <button
                disabled={busy || !reply.trim()}
                aria-label="إرسال الرسالة"
                className="self-stretch rounded-[var(--radius-md)] bg-[var(--color-brand)] px-5 text-[var(--color-text-on-brand)] disabled:opacity-50"
              >
                <SendIcon />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-[var(--color-text-muted)]">
            <MessageIcon size={42} />
            <h2 className="text-lg font-bold text-[var(--color-text)]">رسائل الحملات</h2>
            <p>ابدأ محادثة مع جهة اتصال مرتبطة بإحدى حملاتك.</p>
          </div>
        )}
      </section>
    </div>
  );
}
