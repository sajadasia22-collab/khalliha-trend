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

    return await AuthService.findById(payload.userId);
  } catch {
    return null;
  }
}
