import type { Metadata } from "next";
import { CommunityPostDetail } from "../../../../components/community/CommunityPostDetail";
import { DashboardHeader } from "../../../../components/layout/DashboardHeader";
import { Footer } from "../../../../components/layout/Footer";
import { Navbar } from "../../../../components/layout/Navbar";
import type { DashboardRole } from "../../../../components/layout/dashboardNav";
import { getCurrentUser } from "../../../../lib/auth/session";

export const metadata: Metadata = {
  title: "منشور المجتمع — خلّيها ترند",
  description: "منشور من مجتمع صناع المحتوى في خلّيها ترند.",
};

function dashboardRole(role: string): DashboardRole | null {
  if (role === "CREATOR") return "creator";
  if (role === "BRAND") return "brand";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  return null;
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getCurrentUser(), params]);
  const role = user ? dashboardRole(user.role) : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {user && role ? (
        <DashboardHeader dashboardRole={role} userLabel={user.fullName} />
      ) : (
        <Navbar />
      )}
      <main className={user && role ? "pb-20 md:ps-64 md:pb-0" : ""} dir="rtl">
        <CommunityPostDetail
          postId={id}
          currentUser={
            user ? { id: user.id, fullName: user.fullName, role: user.role } : null
          }
        />
      </main>
      {!user && <Footer />}
    </div>
  );
}
