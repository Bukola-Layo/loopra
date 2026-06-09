import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

export function apiError(
  message: string,
  status: number = 400,
  code?: string,
  details?: Record<string, unknown>
) {
  const body: ApiErrorResponse = { error: message };
  if (code) body.code = code;
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof Error && error.message === "Unauthorized") {
    return apiError("Authentication required", 401, "UNAUTHORIZED");
  }
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
