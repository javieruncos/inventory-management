import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/app/api/_lib/csrf";
import { errorResponse, parseJsonBody } from "@/app/api/_lib/http";
import { setAuthCookie } from "@/lib/auth/auth-cookie";
import { authenticateUser } from "@/lib/auth/auth-service";
import { loginSchema } from "@/schemas/auth";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: Request): Promise<Response> {
  try {
    assertTrustedOrigin(request);

    const body = await parseJsonBody(request);
    const input = loginSchema.parse(body);
    const { token, user } = await authenticateUser(input);

    const response = NextResponse.json(
      { data: user },
      { headers: NO_STORE_HEADERS },
    );

    return setAuthCookie(response, token);
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
