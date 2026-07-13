import type { ComponentType } from "react";
import {
  DashboardIcon,
  MegaphoneIcon,
  UserIcon,
  ClipboardCheckIcon,
  ShieldAlertIcon,
  DisputeIcon,
  WalletIcon,
  SettingsIcon,
  type IconProps,
} from "../ui/icons";

export type DashboardRole = "creator" | "brand" | "admin";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
};

export const navByRole: Record<DashboardRole, NavItem[]> = {
  creator: [
    { href: "/creator/dashboard", label: "لوحة التحكم", icon: DashboardIcon },
    { href: "/campaigns", label: "استكشف الحملات", icon: MegaphoneIcon },
    { href: "/creator/wallet", label: "المحفظة", icon: WalletIcon },
    { href: "/creator/profile", label: "الملف الشخصي", icon: UserIcon },
    { href: "/creator/settings", label: "الإعدادات", icon: SettingsIcon },
  ],
  brand: [
    { href: "/brand/dashboard", label: "لوحة التحكم", icon: DashboardIcon },
    { href: "/brand/campaigns", label: "حملاتي", icon: MegaphoneIcon },
    { href: "/brand/wallet", label: "المحفظة", icon: WalletIcon },
    { href: "/brand/profile", label: "الملف الشخصي", icon: UserIcon },
    { href: "/brand/settings", label: "الإعدادات", icon: SettingsIcon },
  ],
  admin: [
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: DashboardIcon },
    { href: "/admin/users", label: "المستخدمون", icon: UserIcon },
    { href: "/admin/reviews", label: "المراجعات", icon: ClipboardCheckIcon },
    { href: "/admin/fraud", label: "الاحتيال", icon: ShieldAlertIcon },
    { href: "/admin/disputes", label: "النزاعات", icon: DisputeIcon },
    { href: "/admin/settings", label: "الإعدادات", icon: SettingsIcon },
  ],
};

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/campaigns" && pathname.startsWith(`${href}/`));
}
