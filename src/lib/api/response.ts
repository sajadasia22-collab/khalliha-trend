import { NextResponse } from "next/server";

type ApiErrorBody = {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
};

export function newRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 11)}`;
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  options?: { requestId?: string; details?: unknown },
) {
  const body: { error: ApiErrorBody } = {
    error: {
      code,
      message,
      ...(options?.requestId ? { requestId: options.requestId } : {}),
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
) {
  return NextResponse.json({
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      pageCount: Math.ceil(pagination.total / pagination.pageSize),
    },
  });
}
