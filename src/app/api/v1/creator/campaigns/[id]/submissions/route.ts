import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, newRequestId } from "../../../../../../../lib/api/response";
import { getCurrentUser } from "../../../../../../../lib/auth/session";
import { SubmissionService } from "../../../../../../../modules/submissions/service";

const createSubmissionSchema = z.object({
  socialAccountId: z.string().min(1, "معرف الحساب الاجتماعي مطلوب"),
  postUrl: z.string().url("رابط منشور صانع المحتوى غير صالح"),
});

export async function POST(
  request: Request,
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

    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "المدخلات غير صالحة.", 400, {
        requestId,
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const submission = await SubmissionService.createSubmission(
      user.id,
      campaignId,
      parsed.data,
    );
    return NextResponse.json({
      data: submission,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل تقديم المنشور.";
    return errorResponse("BAD_REQUEST", message, 400, {
      requestId,
    });
  }
}

export async function GET(
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

    const submissions = await SubmissionService.listSubmissionsForCreator(
      user.id,
      campaignId,
    );
    return NextResponse.json({
      data: submissions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "فشل جلب المنشورات.";
    return errorResponse("INTERNAL_ERROR", message, 500, {
      requestId,
    });
  }
}
