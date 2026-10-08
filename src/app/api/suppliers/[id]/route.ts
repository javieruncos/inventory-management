import {
  errorResponse,
  ok,
  parseJsonBody,
  type IdRouteContext,
} from "@/app/api/_lib/http";
import { deleteSupplier, getSupplier, updateSupplier } from "@/lib/suppliers";

export async function GET(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const supplier = await getSupplier(id);

    return ok(supplier);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const body = await parseJsonBody(request);

    const supplier = await updateSupplier(id, body);

    return ok(supplier);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const deleted = await deleteSupplier(id);

    return ok(deleted);
  } catch (error) {
    return errorResponse(error, request);
  }
}
