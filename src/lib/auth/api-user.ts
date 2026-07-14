import { errorResponse } from "../api/response";
import { getCurrentUser } from "./session";

export async function requireApiUser(requestId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      response: errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
        requestId,
      }),
    };
  }

  return { ok: true as const, user };
}
