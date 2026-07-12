import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "./jwt";
import { AuthService } from "../../modules/auth/service";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("khalliha_trend_session")?.value;
    if (!token) {
      return null;
    }

    const secret = getAuthSecret();
    const payload = (await verifyJWT(token, secret)) as {
      userId?: string;
      role?: string;
      status?: string;
      fullName?: string;
      brandName?: string;
      email?: string;
      phone?: string;
    } | null;
    if (!payload || !payload.userId) {
      return null;
    }

    const user = await AuthService.findById(payload.userId);
    if (!user) {
      return null;
    }

    // A SUPER_ADMIN session may carry a role override (e.g. the joker
    // test-login's "preview as brand/creator" selection) so admins can view
    // role-gated pages as another role without that ever being written to
    // the database. Only ever downgrades an already-fully-privileged
    // session for this request — it cannot grant anyone new access.
    if (
      user.role === "SUPER_ADMIN" &&
      payload.role &&
      payload.role !== user.role &&
      ["CREATOR", "BRAND", "SUPER_ADMIN"].includes(payload.role)
    ) {
      return { ...user, role: payload.role as typeof user.role };
    }

    return user;
  } catch {
    return null;
  }
}
