import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** An error with an HTTP status and a stable machine-readable code that agents can rely on. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string, id: string) => new ApiError(404, "not_found", `${what} '${id}' was not found.`);

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } }, err.status);
  }
  if (err instanceof ZodError) {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "The request is invalid. See details.",
          details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
      },
      400,
    );
  }
  console.error(err);
  return json({ error: { code: "internal_error", message: "Something went wrong on our side." } }, 500);
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
