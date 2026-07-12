import { NextResponse } from "next/server";

const COOKIE_NAME = "khalliha_trend_session";

export async function POST() {
  const response = NextResponse.json({
    status: "success",
    message: "تم تسجيل الخروج بنجاح",
  });

  // Clear cookie by setting maxAge to 0
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
