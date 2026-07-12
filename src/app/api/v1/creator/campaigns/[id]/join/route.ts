import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { MembershipService } from "../../../../../../../modules/memberships/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = newRequestId();
  const { id: campaignId } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
        requestId,
      });
    }

    if (user.role !== "CREATOR") {
      return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لصناع المحتوى.", 403, {
        requestId,
      });
    }

    const membership = await MembershipService.joinCampaign(user.id, campaignId);
    return NextResponse.json({
      data: membership,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل الانضمام للحملة.";
    return errorResponse("BAD_REQUEST", message, 400, {
      requestId,
    });
  }
}
