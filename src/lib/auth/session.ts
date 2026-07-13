import { cookies } from "next/headers";
import { getAuthSecret, verifyJWT } from "./jwt";
import { AuthService } from "../../modules/auth/service";
import { UserStatus } from "../../generated/prisma/enums";

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
    } | null;
    if (!payload || !payload.userId) {
      return null;
    }

    const user = await AuthService.findById(payload.userId);
    if (
      !user ||
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.BANNED
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
