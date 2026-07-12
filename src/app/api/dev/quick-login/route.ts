import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/auth/password";
import { getAuthSecret, signJWT } from "../../../../lib/auth/jwt";
import { UserRole, UserStatus } from "../../../../generated/prisma/client";

const COOKIE_NAME = "khalliha_trend_session";

const ROLE_CONFIG: Record<
  string,
  { email: string; fullName: string; dashboard: string }
> = {
  ADMIN: {
    email: "dev-admin@khalliha-trend.local",
    fullName: "مدير تجريبي (Dev)",
    dashboard: "/admin/dashboard",
  },
  BRAND: {
    email: "dev-brand@khalliha-trend.local",
    fullName: "تاجر تجريبي (Dev)",
    dashboard: "/brand/dashboard",
  },
  CREATOR: {
    email: "dev-creator@khalliha-trend.local",
    fullName: "صانع محتوى تجريبي (Dev)",
    dashboard: "/creator/dashboard",
  },
};

// Dev-only convenience login for quickly previewing each role locally.
// Hard-disabled in production so it can never become an auth bypass there.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const config = role ? ROLE_CONFIG[role] : undefined;
  if (!config) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }

  const mappedRole = role === "ADMIN" ? UserRole.SUPER_ADMIN : (role as UserRole);

  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: { role: mappedRole, status: UserStatus.ACTIVE },
    create: {
      email: config.email,
      fullName: config.fullName,
      passwordHash: hashPassword(crypto.randomUUID()),
      role: mappedRole,
      status: UserStatus.ACTIVE,
    },
  });

  let brandName: string | undefined;
  if (mappedRole === UserRole.CREATOR) {
    await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, trustScore: 80 },
    });
  }
  if (mappedRole === UserRole.BRAND) {
    let member = await prisma.brandMember.findFirst({
      where: { userId: user.id },
      include: { brand: true },
    });
    if (!member) {
      const brand = await prisma.brandProfile.create({
        data: { name: "علامة تجريبية (Dev)", slug: `dev-brand-${user.id.slice(0, 10)}` },
      });
      member = await prisma.brandMember.create({
        data: { userId: user.id, brandId: brand.id, role: "OWNER" },
        include: { brand: true },
      });
    }
    brandName = member.brand.name;
  }

  const secret = getAuthSecret();
  const token = await signJWT(
    {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: mappedRole,
      status: user.status,
      brandName,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    secret,
  );

  const response = NextResponse.redirect(new URL(config.dashboard, request.url));
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // this route already 404s above when NODE_ENV is production
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
