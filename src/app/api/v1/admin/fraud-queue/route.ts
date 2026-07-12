import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { FraudService } from "../../../../../modules/fraud/service";

export async function GET() {
  const requestId = newRequestId();
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("UNAUTHENTICATED", "الرجاء تسجيل الدخول أولاً.", 401, {
      requestId,
    });
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return errorResponse("FORBIDDEN", "هذا الإجراء متاح فقط لمسؤولي النظام.", 403, {
      requestId,
    });
  }

  const assessments = await FraudService.listQueue();
  return NextResponse.json({
    data: assessments.map((item) => ({
      id: item.id,
      submissionId: item.submissionId,
      fraudScore: item.fraudScore,
      riskLevel: item.riskLevel,
      status: item.status,
      reviewNote: item.reviewNote,
      campaignTitle: item.submission.campaignMembership.campaign.title,
      brandName: item.submission.campaignMembership.campaign.brand.name,
      creatorName: item.submission.socialAccount.creatorProfile.user.fullName,
      postUrl: item.submission.postUrl,
      signals: item.submission.fraudSignals.map((signal) => ({
        id: signal.id,
        kind: signal.kind,
        scoreImpact: signal.scoreImpact,
        note: signal.note,
        createdAt: signal.createdAt.toISOString(),
      })),
    })),
  });
}
