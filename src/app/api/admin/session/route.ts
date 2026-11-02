import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { apiError } from "@/lib/http";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      { authorized: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
