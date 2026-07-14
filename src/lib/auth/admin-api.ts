import { errorResponse } from "../api/response";
import { requireApiUser } from "./api-user";

export async function requireAdminApiUser(requestId: string) {
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth;
  const { user } = auth;

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return {
      ok: false as const,
      response: errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لمسؤولي النظام.", 403, {
        requestId,
      }),
    };
  }

  return { ok: true as const, user };
}
