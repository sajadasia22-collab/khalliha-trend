import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { requireApiUser } from "../../../../lib/auth/api-user";

export async function GET() {
  const requestId = newRequestId();
  try {
    const auth = await requireApiUser(requestId);
    if (!auth.ok) return auth.response;
    const { user } = auth;

    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        creatorProfile: user.creatorProfile,
        brandMembers: user.brandMembers,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
    return errorResponse("INTERNAL_ERROR", message, 500, { requestId });
  }
}
