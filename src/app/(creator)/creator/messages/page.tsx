import { redirect } from "next/navigation";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { MessagingCenter } from "../../../../components/messaging/MessagingCenter";
import { getCurrentUser } from "../../../../lib/auth/session";
import { MessagingService } from "../../../../modules/messaging/service";

export const dynamic = "force-dynamic";

export default async function CreatorMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CREATOR") redirect("/unauthorized");
  const [conversations, contacts] = await Promise.all([
    MessagingService.list(user.id),
    MessagingService.listContacts(user.id),
  ]);
  return (
    <main
      className="dashboard-page min-h-screen pb-24 text-[var(--color-text)] md:ps-64 md:pb-0"
      dir="rtl"
    >
      <DashboardHeader
        dashboardRole="creator"
        userLabel={`صانع محتوى: ${user.fullName}`}
      />
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black">الرسائل</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            تواصل مع العلامات ضمن الحملات التي انضممت إليها.
          </p>
        </div>
        <MessagingCenter
          currentUserId={user.id}
          userRole="CREATOR"
          initialConversations={conversations.map((item) => ({
            ...item,
            createdAt: undefined,
            updatedAt: undefined,
            lastMessageAt: item.lastMessageAt.toISOString(),
            messages: item.messages.map((message) => ({
              body: message.body,
              createdAt: message.createdAt.toISOString(),
            })),
          }))}
          contacts={contacts}
        />
      </section>
    </main>
  );
}
