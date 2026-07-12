import { NextResponse } from "next/server";
import { getRuntimeReadiness } from "@/config/env";

export function GET() {
  const readiness = getRuntimeReadiness();

  return NextResponse.json(readiness, {
    status: readiness.ok ? 200 : 503,
  });
}
