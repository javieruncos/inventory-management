import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/app/api/_lib/csrf";
import { errorResponse } from "@/app/api/_lib/http";
import { clearAuthCookie } from "@/lib/auth/auth-cookie";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request): Promise<Response> {
  try {
    assertTrustedOrigin(request);

    const response = NextResponse.json(
      { data: null },
      { headers: NO_STORE_HEADERS },
    );

    return clearAuthCookie(response);
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
