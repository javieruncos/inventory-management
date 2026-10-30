import { NextResponse } from "next/server";
import { errorResponse } from "@/app/api/_lib/http";
import { requireUser } from "@/lib/auth/auth-guards";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser();

    return NextResponse.json({ data: user }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const response = errorResponse(error, request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
