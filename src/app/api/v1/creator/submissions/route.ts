import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { SubmissionService } from "../../../../../modules/submissions/service";

export async function GET() {
  const requestId = newRequestId();

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

    const submissions = await SubmissionService.listAllForCreator(user.id);
    return NextResponse.json({
      data: submissions.map((submission) => ({
        id: submission.id,
        status: submission.status,
        createdAt: submission.createdAt.toISOString(),
        campaignTitle: submission.campaignMembership.campaign.title,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل جلب المشاركات.";
    return errorResponse("INTERNAL_ERROR", message, 500, {
      requestId,
    });
  }
}
