import {
  errorResponse,
  ok,
  parseJsonBody,
  type IdRouteContext,
} from "@/app/api/_lib/http";
import { requireAdmin, requireUser } from "@/lib/auth/auth-guards";
import { deleteProduct, getProduct, updateProduct } from "@/lib/products";

export async function GET(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    await requireUser();

    const { id } = await params;

    const product = await getProduct(id);

    return ok(product);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    await requireAdmin();

    const { id } = await params;

    const body = await parseJsonBody(request);

    const product = await updateProduct(id, body);

    return ok(product);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    await requireAdmin();

    const { id } = await params;

    const deleted = await deleteProduct(id);

    return ok(deleted);
  } catch (error) {
    return errorResponse(error, request);
  }
}
