import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { requireApiUser } from "../../../../../lib/auth/api-user";
import { AccountService } from "../../../../../modules/account/service";
import { updateNotificationPreferencesSchema } from "../../../../../modules/account/schemas";

export async function GET() {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const preferences = await AccountService.getNotificationPreferences(auth.user.id);
  return NextResponse.json({ data: preferences });
}

export async function PATCH(request: Request) {
  const requestId = newRequestId();
  const auth = await requireApiUser(requestId);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateNotificationPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const preferences = await AccountService.updateNotificationPreferences(
    auth.user.id,
    parsed.data,
  );
  return NextResponse.json({ data: preferences });
}
