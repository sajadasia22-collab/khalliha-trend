import type { Metadata } from "next";
import { CommunityFeed } from "../../components/community/CommunityFeed";
import { DashboardHeader } from "../../components/layout/DashboardHeader";
import { Footer } from "../../components/layout/Footer";
import { Navbar } from "../../components/layout/Navbar";
import type { DashboardRole } from "../../components/layout/dashboardNav";
import { getCurrentUser } from "../../lib/auth/session";

export const metadata: Metadata = {
  title: "المجتمع — خلّيها ترند",
  description: "منشورات صناع المحتوى العراقيين وأعمالهم وروابطهم الخارجية.",
};

function dashboardRole(role: string): DashboardRole | null {
  if (role === "CREATOR") return "creator";
  if (role === "BRAND") return "brand";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  return null;
}

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const role = user ? dashboardRole(user.role) : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {user && role ? (
        <DashboardHeader dashboardRole={role} userLabel={user.fullName} />
      ) : (
        <Navbar />
      )}
      <main className={user && role ? "pb-20 md:ps-64 md:pb-0" : ""} dir="rtl">
        <CommunityFeed
          currentUser={
            user ? { id: user.id, fullName: user.fullName, role: user.role } : null
          }
        />
      </main>
      {!user && <Footer />}
    </div>
  );
}
