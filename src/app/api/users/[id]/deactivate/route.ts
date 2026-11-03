import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/app/api/_lib/csrf";
import { errorResponse, type IdRouteContext } from "@/app/api/_lib/http";
import { requireAdmin } from "@/lib/auth/auth-guards";
import { deactivateUser } from "@/lib/users";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const admin = await requireAdmin();
    assertTrustedOrigin(request);

    const { id } = await params;

    const user = await deactivateUser(id, admin.id);

    return NextResponse.json({ data: user }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
