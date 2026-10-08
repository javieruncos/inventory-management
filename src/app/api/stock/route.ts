import { errorResponse, ok, parseJsonBody } from "@/app/api/_lib/http";
import { createMovement, listMovements } from "@/lib/stock";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") ?? undefined;

    const movements = await listMovements(productId);

    return ok(movements);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody(request);

    const movement = await createMovement(body);

    return ok(movement, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
