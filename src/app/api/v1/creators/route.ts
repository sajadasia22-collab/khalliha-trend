import { NextResponse } from "next/server";
import { errorResponse, newRequestId } from "../../../../lib/api/response";
import { creatorDirectoryQuerySchema } from "../../../../modules/creator/directory-schemas";
import { CreatorDirectoryService } from "../../../../modules/creator/directory-service";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const url = new URL(request.url);
  const parsed = creatorDirectoryQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "معايير البحث غير صالحة.", 400, {
      requestId,
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await CreatorDirectoryService.list(parsed.data);
  return NextResponse.json({ data: result.items, pagination: result.pagination });
}
