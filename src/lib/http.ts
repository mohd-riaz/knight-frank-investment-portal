import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertSameOrigin(request: Request) {
  const expectedOrigin = new URL(process.env.BETTER_AUTH_URL || request.url)
    .origin;
  const origin = request.headers.get("origin");
  if (origin !== expectedOrigin)
    throw new HttpError(403, "This request must come from the portal.");
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Please check the information you entered." },
      { status: 400 },
    );
  console.error(
    "Portal request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  return NextResponse.json(
    { error: "The service is temporarily unavailable. Please try again." },
    { status: 503 },
  );
}
