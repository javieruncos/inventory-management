import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/app/api/_lib/csrf";
import { errorResponse, parseJsonBody } from "@/app/api/_lib/http";
import { requireAdmin } from "@/lib/auth/auth-guards";
import { createUser, listUsers } from "@/lib/users";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin();

    const users = await listUsers();

    return NextResponse.json({ data: users }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdmin();
    assertTrustedOrigin(request);

    const body = await parseJsonBody(request);

    const user = await createUser(body);

    return NextResponse.json(
      { data: user },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
